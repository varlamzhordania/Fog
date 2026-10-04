"use client";

import {useEffect, useRef, useState} from "react";
import Link from "next/link";
import {useParams} from "next/navigation";
import {
    Button, Card, Chip, Label, Radio, RadioGroup, Separator, Skeleton, toast, Typography,
} from "@heroui/react";
import {CheckCircle2, Clock, XCircle} from "lucide-react";
import Icon from "@/components/Icon/Icon";
import QRCode from "react-qr-code";
import {useCancelOrder, useOrder, usePayOrder, usePaymentMethods} from "@/queries/checkout";
import {getApiErrorMessage} from "@/lib/utils";

const formatPrice = (value) =>
    new Intl.NumberFormat("en-US", {style: "currency", currency: "USD"}).format(Number(value || 0));

const STATUS = {
    payment: {label: "Awaiting payment", color: "warning"},
    pending: {label: "Paid · in review", color: "accent"},
    processing: {label: "Processing", color: "accent"},
    shipped: {label: "Shipped", color: "accent"},
    delivered: {label: "Delivered", color: "success"},
    cancelled: {label: "Cancelled", color: "danger"},
};

function useRemaining(expiresAt) {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        if (!expiresAt) return;
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [expiresAt]);
    return expiresAt ? Math.max(0, new Date(expiresAt).getTime() - now) : 0;
}

const formatClock = (ms) => {
    const total = Math.floor(ms / 1000);
    const m = String(Math.floor(total / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    return `${m}:${s}`;
};

export default function OrderPaymentPage() {
    const {id} = useParams();
    const {data: order, isLoading, isError, refetch} = useOrder(id);
    const {data: methodData} = usePaymentMethods();
    const payMutation = usePayOrder(id);
    const cancelMutation = useCancelOrder(id);

    const methods = methodData?.results ?? methodData ?? [];
    const [selected, setSelected] = useState(null);

    const remaining = useRemaining(order?.expires_at);
    const refetched = useRef(false);

    // When the clock hits zero, ask the server (it cancels expired orders on read).
    useEffect(() => {
        if (order?.status === "payment" && order.expires_at && remaining === 0 && !refetched.current) {
            refetched.current = true;
            refetch();
        }
        if (remaining > 0) refetched.current = false;
    }, [remaining, order, refetch]);

    if (isLoading) {
        return <div className="container py-16"><Skeleton className="h-64 w-full rounded-xl"/>
        </div>;
    }
    if (isError || !order) {
        return (
            <div className="container py-16 text-center">
                <Typography type="h2">Order not found</Typography>
                <Link href="/products" className="text-accent">Back to shop</Link>
            </div>
        );
    }

    const status = STATUS[order.status] ?? {label: order.status, color: "default"};
    const awaiting = order.status === "payment";
    const currentMethod = methods.find((m) => m.name === order.payment?.method);
    const chosen = selected ?? currentMethod?.code ?? methods[0]?.code ?? "";

    const switchMethod = () =>
        payMutation.mutate(
            {payment_method: chosen},
            {
                onSuccess: () => toast.success("Payment method updated."),
                onError: (e) => {
                    toast.danger(getApiErrorMessage(e));
                    refetch();
                },
            }
        );

    const cancel = () =>
        cancelMutation.mutate(undefined, {
            onSuccess: () => toast.success("Order cancelled."),
            onError: (e) => toast.danger(getApiErrorMessage(e)),
        });

    return (
        <div className="container grid grid-cols-12 items-start gap-8 py-8 pb-16">
            <section className="col-span-12 flex flex-col gap-6 lg:col-span-8">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-5">
                    <div>
                        <Typography type="body-sm" className="uppercase tracking-wider text-muted">
                            FOG DIRECT
                        </Typography>
                        <Typography type="h1" className="text-3xl font-light">Order
                            #{order.id}</Typography>
                    </div>
                    <Chip color={status.color}><Chip.Label>{status.label}</Chip.Label></Chip>
                </div>

                {awaiting && (
                    <Card>
                        <Card.Content className="flex flex-col gap-4 p-5 sm:p-6">
                            <div className="flex items-start gap-3">
                                <Icon icon={Clock} className="size-6 text-warning"/>
                                <div>
                                    <Typography type="body-sm" className="text-muted">
                                        Time left to pay
                                    </Typography>
                                    <Typography type="h2" className="font-mono tabular-nums">
                                        {formatClock(remaining)}
                                    </Typography>
                                </div>
                            </div>
                            <Typography type="body-xs" className="text-muted">
                                If payment isn't completed before the timer ends, the order is
                                cancelled
                                automatically and the items are released.
                            </Typography>

                            {order.payment_instructions && (
                                <>
                                    <Separator/>
                                    <div className="flex flex-col gap-2 text-sm">
                                        <Typography type="h4">
                                            Pay with {order.payment_instructions.method}
                                        </Typography>

                                        <p className="text-muted">
                                            {order.payment_instructions.message}
                                        </p>

                                        {order.payment_instructions.checkout_url && (
                                            <Button
                                                className="w-fit"
                                                onPress={() =>
                                                    window.location.assign(
                                                        order.payment_instructions.checkout_url
                                                    )
                                                }
                                            >
                                                Pay by card
                                            </Button>
                                        )}

                                        <dl className="mt-2 grid grid-cols-2 gap-2">
                                            <dt className="text-muted">Reference</dt>
                                            <dd className="font-mono">
                                                {order.payment_instructions.reference}
                                            </dd>

                                            <dt className="text-muted">Amount</dt>
                                            <dd className="font-mono">
                                                {formatPrice(order.payment_instructions.amount)}
                                            </dd>

                                            {order.payment_instructions.address && (
                                                <>
                                                    <dt className="text-muted">Send exactly</dt>
                                                    <dd className="font-mono">
                                                        {order.payment_instructions.crypto_amount}{" "}
                                                        {order.payment_instructions.asset}
                                                    </dd>

                                                    <dt className="text-muted">To address</dt>
                                                    <dd className="break-all font-mono">
                                                        {order.payment_instructions.address}
                                                    </dd>
                                                </>
                                            )}
                                        </dl>

                                        {order.payment_instructions.address && (
                                            <div className="mt-4 flex flex-col items-center gap-3">
                                                <div
                                                    className="rounded-xl border border-separator bg-surface p-4">
                                                    <QRCode
                                                        value={order.payment_instructions.address}
                                                        size={180}
                                                        bgColor="transparent"
                                                        fgColor="currentColor"
                                                        level="M"
                                                    />
                                                </div>

                                                <Typography
                                                    type="body-xs"
                                                    className="text-center text-muted"
                                                >
                                                    Scan the QR code to pay
                                                </Typography>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </Card.Content>
                    </Card>
                )}

                {awaiting && methods.length > 1 && (
                    <Card>
                        <Card.Content className="flex flex-col gap-4 p-5 sm:p-6">
                            <Typography type="h4">Choose another payment provider</Typography>
                            <RadioGroup name="payment_method" value={chosen} onChange={setSelected}>
                                {methods.map((m) => (
                                    <Radio key={m.code} value={m.code}
                                           className="w-full flex-row rounded-lg border p-3">
                                        <Radio.Content>
                                            <Radio.Control><Radio.Indicator/></Radio.Control>
                                            <Label>{m.name}</Label>
                                        </Radio.Content>
                                    </Radio>
                                ))}
                            </RadioGroup>
                            <Button onPress={switchMethod} isPending={payMutation.isPending}
                                    isDisabled={payMutation.isPending || chosen === currentMethod?.code}
                                    className="w-fit">
                                Use this provider
                            </Button>
                        </Card.Content>
                    </Card>
                )}

                {order.status === "cancelled" && (
                    <Card>
                        <Card.Content className="flex items-center gap-3 p-5">
                            <Icon icon={XCircle} className="size-6 text-danger"/>
                            <Typography type="body-sm">
                                This order was cancelled and its items were released.
                                {order.notes ? ` (${order.notes.split("\n").pop()})` : ""}
                            </Typography>
                        </Card.Content>
                    </Card>
                )}

                {["pending", "processing", "shipped", "delivered"].includes(order.status) && (
                    <Card>
                        <Card.Content className="flex flex-col gap-2 p-5">
                            <div className="flex items-center gap-3">
                                <Icon icon={CheckCircle2} className="size-6 text-success"/>
                                <Typography type="body-sm">Payment received. Thank you!</Typography>
                            </div>
                            {order.shipment?.tracking_number && (
                                <Typography type="body-sm" className="text-muted">
                                    {order.shipment.carrier} ·
                                    Tracking {order.shipment.tracking_number}
                                </Typography>
                            )}
                        </Card.Content>
                    </Card>
                )}
            </section>

            <aside className="col-span-12 lg:col-span-4">
                <Card>
                    <Card.Content className="flex flex-col gap-4 p-5 sm:p-6">
                        <Typography type="h3" className="font-normal">Summary</Typography>
                        <ul className="flex flex-col gap-3">
                            {order.items.map((item) => (
                                <li key={item.id} className="flex justify-between gap-3 text-sm">
                                    <span className="min-w-0 truncate">
                                        {item.quantity} × {item.product_name ?? "Removed product"}
                                    </span>
                                    <span
                                        className="shrink-0">{formatPrice(item.total_price)}</span>
                                </li>
                            ))}
                        </ul>
                        <Separator/>
                        <div className="flex items-center justify-between">
                            <span>Total</span>
                            <Typography type="h3">{formatPrice(order.total_price)}</Typography>
                        </div>
                        <Separator/>
                        <div className="text-sm text-muted">
                            <p className="font-medium text-foreground">{order.delivery_address?.full_name}</p>
                            <p>
                                {[order.delivery_address?.line1, order.delivery_address?.line2,
                                    order.delivery_address?.city, order.delivery_address?.postal_code,
                                    order.delivery_address?.country].filter(Boolean).join(", ")}
                            </p>
                        </div>
                        {awaiting && (
                            <Button variant="ghost" onPress={cancel}
                                    isPending={cancelMutation.isPending}
                                    className="text-danger">
                                Cancel order
                            </Button>
                        )}
                    </Card.Content>
                </Card>
            </aside>
        </div>
    );
}
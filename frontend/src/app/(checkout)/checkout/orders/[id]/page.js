"use client";

import {useEffect, useRef, useState} from "react";
import Link from "next/link";
import {useParams} from "next/navigation";
import {
    Button, Card, Chip, Label, Radio, RadioGroup, Separator, Skeleton, toast, Typography,
} from "@heroui/react";
import {CheckCircle2, Clock, Copy, ExternalLink, XCircle} from "lucide-react";
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

    // Auto-refetch when clock expires
    useEffect(() => {
        if (order?.status === "payment" && order.expires_at && remaining === 0 && !refetched.current) {
            refetched.current = true;
            refetch();
        }
        if (remaining > 0) refetched.current = false;
    }, [remaining, order, refetch]);

    if (isLoading) {
        return (
            <div className="container py-16">
                <Skeleton className="h-64 w-full rounded-xl" />
            </div>
        );
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
    const instructions = order.payment_instructions;

    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(text);
        toast.success(`Copied ${label} to clipboard.`);
    };

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
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-separator/40 pb-5">
                    <div>
                        <Typography type="body-sm" className="uppercase tracking-widest font-mono text-muted text-xs">
                            FOG DIRECT // PROTOCOL
                        </Typography>
                        <Typography type="h1" className="text-3xl font-light tracking-tight">
                            Order #{order.id}
                        </Typography>
                    </div>
                    <Chip color={status.color}><Chip.Label>{status.label}</Chip.Label></Chip>
                </div>

                {awaiting && (
                    <Card className="border border-white/5 bg-surface/50 backdrop-blur-sm">
                        <Card.Content className="flex flex-col gap-5 p-5 sm:p-6">
                            <div className="flex items-start gap-3">
                                <Icon icon={Clock} className="size-5 text-warning mt-0.5" />
                                <div>
                                    <Typography type="body-sm" className="text-muted text-xs uppercase font-mono tracking-wider">
                                        Time left to complete settlement
                                    </Typography>
                                    <Typography type="h2" className="font-mono tabular-nums text-2xl">
                                        {formatClock(remaining)}
                                    </Typography>
                                </div>
                            </div>
                            <Typography type="body-xs" className="text-muted leading-relaxed">
                                Unsettled orders expire automatically when the window elapses, returning reserved fungal culture stock to inventory.
                            </Typography>

                            {instructions && (
                                <>
                                    <Separator className="border-separator/40" />
                                    <div className="flex flex-col gap-3 text-sm">
                                        <div className="flex items-center justify-between">
                                            <Typography type="h4" className="font-medium tracking-tight">
                                                {instructions.provider === "xcash"
                                                    ? "Cryptocurrency Settlement"
                                                    : `Pay with ${instructions.method}`}
                                            </Typography>
                                            {instructions.chain && (
                                                <span className="font-mono text-xs text-muted border border-white/10 px-2 py-0.5 rounded">
                                                    {instructions.chain.toUpperCase()}
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-muted text-xs leading-relaxed">
                                            {instructions.message}
                                        </p>

                                        <dl className="mt-2 grid grid-cols-2 gap-y-3 gap-x-4 text-xs font-mono bg-black/30 p-4 border border-white/5 rounded-lg">
                                            <dt className="text-muted">REFERENCE</dt>
                                            <dd className="break-all text-foreground text-right">{instructions.reference}</dd>

                                            <dt className="text-muted">AMOUNT DUE</dt>
                                            <dd className="text-foreground text-right">{formatPrice(instructions.amount)}</dd>

                                            {instructions.address && (
                                                <>
                                                    <dt className="text-muted">CRYPTO EXACT</dt>
                                                    <dd className="text-foreground text-right font-medium">
                                                        {instructions.crypto_amount} {instructions.asset}
                                                    </dd>

                                                    <dt className="text-muted col-span-2 pt-2 border-t border-white/5">
                                                        DEPOSIT ADDRESS
                                                    </dt>
                                                    <dd className="col-span-2 flex items-center justify-between gap-2 bg-black/60 p-2.5 border border-white/10 rounded font-mono text-[11px] break-all text-stone-300">
                                                        <span>{instructions.address}</span>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onPress={() => copyToClipboard(instructions.address, "address")}
                                                            className="shrink-0 h-6 px-2 text-stone-400 hover:text-white"
                                                        >
                                                            <Icon icon={Copy} className="size-3.5" />
                                                        </Button>
                                                    </dd>
                                                </>
                                            )}
                                        </dl>

                                        {instructions.address && (
                                            <div className="mt-3 flex flex-col items-center gap-3">
                                                <div className="rounded-lg border border-separator/40 bg-white p-3.5 shadow-md">
                                                    <QRCode
                                                        value={instructions.address}
                                                        size={150}
                                                        bgColor="#ffffff"
                                                        fgColor="#000000"
                                                        level="M"
                                                    />
                                                </div>
                                                <Typography type="body-xs" className="text-center font-mono text-[11px] text-muted">
                                                    Scan with wallet to dispatch funds
                                                </Typography>
                                            </div>
                                        )}

                                        {instructions.checkout_url && (
                                            <div className="pt-2">
                                                <Button
                                                    className="w-full sm:w-auto font-mono text-xs uppercase tracking-wider bg-white text-black hover:bg-stone-200"
                                                    onPress={() => window.open(instructions.checkout_url, "_blank")}
                                                >
                                                    Open Xcash Gateway
                                                    <Icon icon={ExternalLink} className="size-3.5 ml-2" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </Card.Content>
                    </Card>
                )}

                {awaiting && methods.length > 1 && (
                    <Card className="border border-white/5 bg-surface/30">
                        <Card.Content className="flex flex-col gap-4 p-5 sm:p-6">
                            <Typography type="h4" className="text-sm font-medium">Alternative Gateway</Typography>
                            <RadioGroup name="payment_method" value={chosen} onChange={setSelected}>
                                {methods.map((m) => (
                                    <Radio key={m.code} value={m.code} className="w-full flex-row rounded-lg border border-white/5 p-3">
                                        <Radio.Content>
                                            <Radio.Control><Radio.Indicator /></Radio.Control>
                                            <Label className="text-xs font-mono">{m.name}</Label>
                                        </Radio.Content>
                                    </Radio>
                                ))}
                            </RadioGroup>
                            <Button
                                onPress={switchMethod}
                                isPending={payMutation.isPending}
                                isDisabled={payMutation.isPending || chosen === currentMethod?.code}
                                className="w-fit text-xs font-mono"
                            >
                                Switch Provider
                            </Button>
                        </Card.Content>
                    </Card>
                )}

                {order.status === "cancelled" && (
                    <Card className="border border-danger/20 bg-danger/5">
                        <Card.Content className="flex items-center gap-3 p-5">
                            <Icon icon={XCircle} className="size-5 text-danger" />
                            <Typography type="body-sm" className="font-mono text-xs">
                                Order cancelled. Reserved inventory released.
                                {order.notes ? ` (${order.notes.split("\n").pop()})` : ""}
                            </Typography>
                        </Card.Content>
                    </Card>
                )}

                {["pending", "processing", "shipped", "delivered"].includes(order.status) && (
                    <Card className="border border-emerald-500/20 bg-emerald-500/5">
                        <Card.Content className="flex flex-col gap-2 p-5">
                            <div className="flex items-center gap-3">
                                <Icon icon={CheckCircle2} className="size-5 text-emerald-400" />
                                <Typography type="body-sm" className="font-mono text-xs text-emerald-200">
                                    Payment settled on-chain. Order queued for dispatch.
                                </Typography>
                            </div>
                            {order.shipment?.tracking_number && (
                                <Typography type="body-sm" className="text-muted font-mono text-xs">
                                    {order.shipment.carrier} · Tracking: {order.shipment.tracking_number}
                                </Typography>
                            )}
                        </Card.Content>
                    </Card>
                )}
            </section>

            <aside className="col-span-12 lg:col-span-4">
                <Card className="border border-white/5 bg-surface/50 backdrop-blur-sm">
                    <Card.Content className="flex flex-col gap-4 p-5 sm:p-6">
                        <Typography type="h3" className="font-mono text-sm tracking-wider uppercase text-muted">
                            Order Spec
                        </Typography>
                        <ul className="flex flex-col gap-3 font-mono text-xs">
                            {order.items.map((item) => (
                                <li key={item.id} className="flex justify-between gap-3 text-stone-300">
                                    <span className="min-w-0 truncate">
                                        {item.quantity} × {item.product_name ?? "Product"}
                                    </span>
                                    <span className="shrink-0">{formatPrice(item.total_price)}</span>
                                </li>
                            ))}
                        </ul>
                        <Separator className="border-separator/40" />
                        <div className="flex items-center justify-between font-mono">
                            <span className="text-xs uppercase text-muted">Total</span>
                            <Typography type="h3" className="text-xl">{formatPrice(order.total_price)}</Typography>
                        </div>
                        <Separator className="border-separator/40" />
                        <div className="text-xs font-mono text-muted space-y-1">
                            <p className="font-sans text-sm text-foreground">{order.delivery_address?.full_name}</p>
                            <p>
                                {[
                                    order.delivery_address?.line1,
                                    order.delivery_address?.line2,
                                    order.delivery_address?.city,
                                    order.delivery_address?.postal_code,
                                    order.delivery_address?.country,
                                ].filter(Boolean).join(", ")}
                            </p>
                        </div>
                        {awaiting && (
                            <Button
                                variant="ghost"
                                onPress={cancel}
                                isPending={cancelMutation.isPending}
                                className="text-danger font-mono text-xs mt-2"
                            >
                                Cancel order
                            </Button>
                        )}
                    </Card.Content>
                </Card>
            </aside>
        </div>
    );
}
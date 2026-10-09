"use client";

import {useEffect, useRef, useState} from "react";
import Link from "next/link";
import {useParams} from "next/navigation";
import {
    Button, Card, Chip, Label, Radio, RadioGroup, Separator, Skeleton, toast, Typography,
} from "@heroui/react";
import {
    AlertTriangle, Check, CheckCircle2, Clock, Copy, ExternalLink, Info, Package,
    RefreshCw, ShieldCheck, Truck, XCircle,
} from "lucide-react";
import QRCode from "react-qr-code";
import Icon from "@/components/icon/Icon";
import {
    useCancelOrder, useOrder, usePayOrder, usePaymentMethods,
} from "@/queries/checkout";
import {getApiErrorMessage} from "@/lib/utils";
import {chainLabel, explorerTxUrl, formatPrice, shortHash} from "@/lib/payments";

const STATUS = {
    payment: {label: "Awaiting payment", color: "warning"},
    pending: {label: "Payment received", color: "accent"},
    processing: {label: "Preparing your order", color: "accent"},
    shipped: {label: "Shipped", color: "accent"},
    delivered: {label: "Delivered", color: "success"},
    cancelled: {label: "Cancelled", color: "danger"},
};

const TRACK = [
    {key: "payment", label: "Order placed"},
    {key: "pending", label: "Paid"},
    {key: "processing", label: "Preparing"},
    {key: "shipped", label: "Shipped"},
    {key: "delivered", label: "Delivered"},
];

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

const formatDate = (value) =>
    value ? new Date(value).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short"
    }) : "";

export default function OrderPage() {
    const {id} = useParams();
    const {data: order, isLoading, isError, refetch} = useOrder(id);
    const {data: methodData} = usePaymentMethods();
    const payMutation = usePayOrder(id);
    const cancelMutation = useCancelOrder(id);

    const awaiting = order?.status === "payment";
    const instructions = order?.payment_instructions;


    const remaining = useRemaining(order?.expires_at);
    const invoiceRemaining = useRemaining(instructions?.invoice_expires_at);
    const refetched = useRef(false);

    const methods = methodData?.results ?? methodData ?? [];
    const [selected, setSelected] = useState(null);
    const [confirmCancel, setConfirmCancel] = useState(false);

    useEffect(() => {
        if (awaiting && order.expires_at && remaining === 0 && !refetched.current) {
            refetched.current = true;
            refetch();
        }
        if (remaining > 0) refetched.current = false;
    }, [remaining, awaiting, order, refetch]);

    if (isLoading) {
        return (
            <div className="container flex flex-col gap-6 py-10">
                <Skeleton className="h-10 w-64 rounded-lg"/>
                <Skeleton className="h-16 w-full rounded-xl"/>
                <Skeleton className="h-96 w-full rounded-xl"/>
            </div>
        );
    }

    if (isError || !order) {
        return (
            <div
                className="container flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
                <Typography type="h2">We couldn't find this order</Typography>
                <Typography type="body-sm" className="text-muted">
                    It may belong to another account, or the link is wrong.
                </Typography>
                <Link href="/products" className="text-accent">Back to shop</Link>
            </div>
        );
    }

    const status = STATUS[order.status] ?? {label: order.status, color: "default"};
    const currentMethod =
        methods.find((m) => m.code === order.payment?.method_code) ??
        methods.find((m) => m.name === order.payment?.method);

    const chosen = selected ?? currentMethod?.code ?? methods[0]?.code ?? "";
    const invoiceExpired =
        Boolean(instructions?.invoice_expires_at) && invoiceRemaining === 0
        || instructions?.invoice_status === "expired";
    const paid = ["pending", "processing", "shipped", "delivered"].includes(order.status);

    const switchMethod = (code) =>
        payMutation.mutate(
            {payment_method: code},
            {
                onSuccess: () => toast.success("Payment details updated."),
                onError: (e) => {
                    toast.danger(getApiErrorMessage(e));
                    refetch();
                },
            }
        );

    const cancel = () =>
        cancelMutation.mutate(undefined, {
            onSuccess: () => {
                setConfirmCancel(false);
                toast.success("Order cancelled.");
            },
            onError: (e) => toast.danger(getApiErrorMessage(e)),
        });

    return (
        <div className="container flex flex-col gap-8 py-8 pb-16">
            {/* Header */}
            <header className="flex flex-wrap items-end justify-between gap-4 border-b pb-6">
                <div>
                    <Typography type="body-sm" className="text-muted">
                        Placed {formatDate(order.created_at)}
                    </Typography>
                    <Typography type="h1"
                                className="text-3xl font-light tracking-tight sm:text-4xl">
                        Order #{order.id}
                    </Typography>
                </div>
                <Chip color={status.color} size="lg"><Chip.Label>{status.label}</Chip.Label></Chip>
            </header>

            {order.status !== "cancelled" && <Tracker status={order.status}/>}


            <div className="grid grid-cols-12 items-start gap-8">
                <section className="col-span-12 flex flex-col gap-6 lg:col-span-8">

                    {order.status === "cancelled" &&
                        <Card className="border border-danger/30 bg-danger/5">
                            <Card.Content className="flex items-start gap-3 p-5">
                                <Icon icon={XCircle}
                                      className="mt-0.5 size-5 shrink-0 text-danger"/>
                                <div>
                                    <Typography type="body-sm" className="font-medium">This order
                                        was cancelled</Typography>
                                    <Typography type="body-xs" className="mt-1 text-muted">
                                        Reserved items were released back to stock. If you
                                        already sent a payment, contact support with your
                                        order number.
                                    </Typography>
                                </div>
                            </Card.Content>
                        </Card>}

                    {awaiting && instructions && (
                        <PaymentPanel
                            order={order}
                            instructions={instructions}
                            remaining={remaining}
                            invoiceRemaining={invoiceRemaining}
                            invoiceExpired={invoiceExpired}
                            refreshing={payMutation.isPending}
                            onRefresh={() => switchMethod(currentMethod?.code ?? chosen)}
                        />
                    )}

                    {awaiting && !instructions && (
                        <Card>
                            <Card.Content className="p-6">
                                <Typography type="body-sm" className="text-muted">
                                    Payment details are being prepared. This page refreshes
                                    automatically.
                                </Typography>
                            </Card.Content>
                        </Card>
                    )}

                    {awaiting && methods.length > 1 && (
                        <Card>
                            <Card.Content className="flex flex-col gap-4 p-5 sm:p-6">
                                <div>
                                    <Typography type="h3" className="text-lg font-medium">
                                        Pay with something else
                                    </Typography>
                                    <Typography type="body-xs" className="mt-1 text-muted">
                                        Switching creates new payment details. Don't send anything
                                        to the
                                        old address afterwards.
                                    </Typography>
                                </div>
                                <RadioGroup
                                    name="payment_method"
                                    aria-label="Payment method"
                                    value={chosen}
                                    onChange={setSelected}
                                    className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                                >
                                    {methods.map((m) => (
                                        <Radio
                                            key={m.code}
                                            value={m.code}
                                            isDisabled={Number(m.min_amount || 0) > Number(order.total_price)}
                                            className={`w-full flex-row rounded-xl border p-3 transition-colors ${
                                                chosen === m.code ? "border-accent bg-accent/5" : "border-border"
                                            }`}
                                        >
                                            <Radio.Content>
                                                <Radio.Control><Radio.Indicator/></Radio.Control>
                                                <Label className="text-sm">{m.name}</Label>
                                            </Radio.Content>
                                        </Radio>
                                    ))}
                                </RadioGroup>
                                <Button
                                    onPress={() => switchMethod(chosen)}
                                    isPending={payMutation.isPending}
                                    isDisabled={payMutation.isPending || chosen === currentMethod?.code}
                                    variant="secondary"
                                    className="w-fit"
                                >
                                    Switch payment method
                                </Button>
                            </Card.Content>
                        </Card>
                    )}

                    {paid && (
                        <Card className="border border-success/30 bg-success/5">
                            <Card.Content className="flex flex-col gap-3 p-5 sm:p-6">
                                <div className="flex items-start gap-3">
                                    <Icon icon={CheckCircle2}
                                          className="mt-0.5 size-5 shrink-0 text-success"/>
                                    <div>
                                        <Typography type="body-sm" className="font-medium">
                                            Payment confirmed
                                        </Typography>
                                        <Typography type="body-xs" className="mt-1 text-muted">
                                            {order.status === "delivered"
                                                ? "Your order has been delivered."
                                                : "Thank you. We'll email you at every step, starting when it ships."}
                                        </Typography>
                                    </div>
                                </div>
                                {order.payment?.transaction_id && (
                                    <div
                                        className="flex items-center justify-between gap-3 rounded-lg bg-background/60 px-3 py-2">
                                        <div className="min-w-0">
                                            <p className="text-xs text-muted">Transaction ID</p>
                                            <p className="truncate font-mono text-xs">{order.payment.transaction_id}</p>
                                        </div>
                                        <CopyButton value={order.payment.transaction_id}
                                                    label="transaction ID"/>
                                    </div>
                                )}
                            </Card.Content>
                        </Card>
                    )}

                    {paid && order.shipment && (
                        <ShipmentCard shipment={order.shipment}/>
                    )}
                </section>

                {/* Summary */}
                <aside className="col-span-12 lg:sticky lg:top-28 lg:col-span-4">
                    <Card>
                        <Card.Content className="flex flex-col gap-5 p-5 sm:p-6">
                            <Typography type="h3" className="text-lg font-medium">Order
                                summary</Typography>

                            <ul className="flex flex-col gap-3">
                                {order.items.map((item) => (
                                    <li key={item.id}
                                        className="flex justify-between gap-3 text-sm">
                                        {item.product_slug ? (
                                            <Link
                                                href={`/products/${item.product_slug}/`}
                                                className="min-w-0 truncate no-underline hover:text-accent"
                                            >
                                                {item.quantity} × {item.product_name}
                                            </Link>
                                        ) : (
                                            <span className="min-w-0 truncate">
                                                {item.quantity} × {item.product_name ?? "Removed product"}
                                            </span>
                                        )}
                                        <span
                                            className="shrink-0">{formatPrice(item.total_price)}</span>
                                    </li>
                                ))}
                            </ul>

                            <Separator/>

                            {(Number(order.tax_amount) > 0 || order.shipping_method_name) && (
                                <>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted">Subtotal</span>
                                        <span>{formatPrice(order.subtotal)}</span>
                                    </div>
                                    {order.shipping_method_name && (
                                        <div className="flex justify-between text-sm">
                                            <span
                                                className="text-muted">Shipping ({order.shipping_method_name})</span>
                                            <span>{Number(order.shipping_cost) ? formatPrice(order.shipping_cost) : "Free"}</span>
                                        </div>
                                    )}
                                    {Number(order.tax_amount) > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted">
                                                {order.tax_included ? "Includes " : ""}{order.tax_name} ({Number(order.tax_rate)}%)
                                            </span>
                                            <span>{formatPrice(order.tax_amount)}</span>
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="flex items-baseline justify-between">
                                <span className="font-medium">Total</span>
                                <span
                                    className="text-2xl font-semibold">{formatPrice(order.total_price)}</span>
                            </div>

                            <Separator/>

                            <div className="flex flex-col gap-1 text-sm">
                                <span className="text-xs text-muted">Delivering to</span>
                                <span
                                    className="font-medium">{order.delivery_address?.full_name}</span>
                                <span className="text-muted">
                                    {[
                                        order.delivery_address?.line1,
                                        order.delivery_address?.line2,
                                        order.delivery_address?.city,
                                        order.delivery_address?.state,
                                        order.delivery_address?.postal_code,
                                        order.delivery_address?.country,
                                    ].filter(Boolean).join(", ")}
                                </span>
                            </div>

                            {awaiting && (
                                <>
                                    <Separator/>
                                    {confirmCancel ? (
                                        <div className="flex flex-col gap-2">
                                            <Typography type="body-xs" className="text-muted">
                                                Cancel this order and release the reserved items?
                                            </Typography>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="danger"
                                                    onPress={cancel}
                                                    isPending={cancelMutation.isPending}
                                                >
                                                    Yes, cancel order
                                                </Button>
                                                <Button size="sm" variant="ghost"
                                                        onPress={() => setConfirmCancel(false)}>
                                                    Keep order
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onPress={() => setConfirmCancel(true)}
                                            className="w-fit text-danger"
                                        >
                                            Cancel order
                                        </Button>
                                    )}
                                </>
                            )}

                            <Link href="/contact"
                                  className="text-xs text-muted no-underline hover:text-foreground">
                                Need help with this order? Contact support
                            </Link>
                        </Card.Content>
                    </Card>
                </aside>
            </div>
        </div>
    );
}


function Tracker({status}) {
    const index = Math.max(0, TRACK.findIndex((s) => s.key === status));

    return (
        <ol className="grid grid-cols-5" aria-label="Order progress">
            {TRACK.map((step, i) => {
                const done = i < index || (i === index && status === "delivered");
                const active = i === index && !done;
                return (
                    <li key={step.key}
                        className="relative flex flex-col items-center gap-2 text-center"
                        aria-current={active ? "step" : undefined}>
                        {i > 0 && (
                            <span
                                className={`absolute right-1/2 top-3.5 h-0.5 w-full ${i <= index ? "bg-accent" : "bg-border"}`}
                                aria-hidden="true"
                            />
                        )}
                        <span
                            className={`relative z-10 flex size-7 items-center justify-center rounded-full border-2 bg-background text-xs ${
                                done
                                    ? "border-accent bg-accent text-accent-foreground"
                                    : active
                                        ? "border-accent text-accent"
                                        : "border-border text-muted"
                            }`}
                        >
                            {done ? <Icon icon={Check} className="size-3.5"/> : i + 1}
                        </span>
                        <span
                            className={`text-xs sm:text-sm ${i <= index ? "font-medium" : "text-muted"}`}>
                            {step.label}
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}

function CopyButton({value, label}) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(String(value));
            setCopied(true);
            toast.success(`Copied ${label}.`);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            toast.danger("Couldn't copy. Select the text and copy it manually.");
        }
    };

    return (
        <Button isIconOnly size="sm" variant="ghost" aria-label={`Copy ${label}`} onPress={copy}>
            <Icon icon={copied ? Check : Copy} className="size-4"/>
        </Button>
    );
}

function Spinner() {
    return (
        <span
            className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
            aria-hidden="true"
        />
    );
}

function PaymentPanel({
                          order,
                          instructions,
                          remaining,
                          invoiceRemaining,
                          invoiceExpired,
                          refreshing,
                          onRefresh
                      }) {
    const hasAddress = Boolean(instructions.address);
    const detected = Boolean(instructions.tx_hash);
    const network = chainLabel(instructions.chain);
    const explorer = explorerTxUrl(instructions.chain, instructions.tx_hash);
    const progress = instructions.confirm_progress != null && typeof instructions.confirm_progress !== "object"
        ? String(instructions.confirm_progress)
        : null;

    const total = order.expires_at && order.created_at
        ? new Date(order.expires_at).getTime() - new Date(order.created_at).getTime()
        : 0;
    const percent = total > 0 ? Math.min(100, Math.max(0, (remaining / total) * 100)) : 0;
    const urgent = remaining > 0 && remaining < 10 * 60 * 1000;
    const critical = remaining > 0 && remaining < 3 * 60 * 1000;
    const barColor = critical ? "bg-danger" : urgent ? "bg-warning" : "bg-accent";

    return (
        <Card>
            <Card.Content className="flex flex-col gap-6 p-5 sm:p-6">
                {/* Timer */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 text-sm text-muted">
                            <Icon icon={Clock} className="size-4"/> Time left to pay
                        </span>
                        <span
                            className={`font-mono text-xl tabular-nums ${critical ? "text-danger" : urgent ? "text-warning" : ""}`}
                            role="timer"
                        >
                            {formatClock(remaining)}
                        </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-default"
                         role="progressbar" aria-valuenow={Math.round(percent)} aria-valuemin={0}
                         aria-valuemax={100}
                         aria-label="Payment time remaining">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
                            style={{width: `${percent}%`}}/>
                    </div>
                </div>

                <Separator/>

                {hasAddress ? (
                    <>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <Typography type="h2" className="text-2xl font-semibold">
                                    Pay {instructions.crypto_amount} {instructions.asset}
                                </Typography>
                                <Typography type="body-sm" className="text-muted">
                                    ≈ {formatPrice(instructions.amount)} · {instructions.method}
                                </Typography>
                            </div>
                            {network &&
                                <Chip variant="secondary"><Chip.Label>{network}</Chip.Label></Chip>}
                        </div>

                        <LiveStatus
                            detected={detected}
                            expired={invoiceExpired}
                            progress={progress}
                            explorer={explorer}
                            hash={instructions.tx_hash}
                        />

                        {invoiceExpired ? (
                            <div
                                className="flex flex-col items-start gap-3 rounded-xl border border-warning/40 bg-warning/5 p-4">
                                <div className="flex items-start gap-2.5">
                                    <Icon icon={AlertTriangle}
                                          className="mt-0.5 size-4 shrink-0 text-warning"/>
                                    <Typography type="body-xs" className="leading-relaxed">
                                        This payment request has expired, so don't send anything to
                                        it. Your items are
                                        still reserved — create a new request to keep going.
                                    </Typography>
                                </div>
                                <Button onPress={onRefresh} isPending={refreshing} size="sm">
                                    <Icon icon={RefreshCw} className="size-4"/>
                                    Create new payment request
                                </Button>
                            </div>
                        ) : (
                            <div className="grid gap-6 md:grid-cols-[190px_1fr]">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="rounded-xl border bg-white p-3 shadow-sm">
                                        <QRCode
                                            value={instructions.payment_uri || instructions.address}
                                            size={160}
                                            bgColor="#ffffff"
                                            fgColor="#000000"
                                            level="M"
                                        />
                                    </div>
                                    <Typography type="body-xs" className="text-center text-muted">
                                        Scan with your wallet app
                                    </Typography>
                                </div>

                                <dl className="flex min-w-0 flex-col gap-4">
                                    <DetailRow label="Amount to send"
                                               value={`${instructions.crypto_amount} ${instructions.asset}`}
                                               copy={instructions.crypto_amount} copyLabel="amount"
                                               strong/>
                                    <DetailRow label="Deposit address" value={instructions.address}
                                               copy={instructions.address} copyLabel="address"
                                               mono/>
                                    <div className="flex gap-6">
                                        <DetailRow label="Network" value={network || "—"}/>
                                        <DetailRow label="Reference"
                                                   value={instructions.reference}/>
                                    </div>
                                    {instructions.invoice_expires_at && invoiceRemaining > 0 && (
                                        <p className="text-xs text-muted">
                                            This payment request is valid for
                                            another {formatClock(invoiceRemaining)}.
                                        </p>
                                    )}
                                </dl>
                            </div>
                        )}

                        {!invoiceExpired && (
                            <div className="flex flex-col gap-3">
                                <Note icon={AlertTriangle} tone="warning">
                                    Send
                                    exactly {instructions.crypto_amount} {instructions.asset} on {network || "the network shown"}.
                                    Other amounts or networks may not be detected and can't be
                                    recovered.
                                </Note>
                                {instructions.settlement === "smart_contract" && (
                                    <Note icon={ShieldCheck} tone="accent">
                                        This address is created for this order only and is backed by
                                        a smart contract
                                        that forwards your payment straight to the store wallet.
                                        Don't reuse it for
                                        another order.
                                    </Note>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-start gap-4">
                        <div>
                            <Typography type="h2" className="text-2xl font-semibold">
                                Pay {formatPrice(instructions.amount)}
                            </Typography>
                            <Typography type="body-sm" className="mt-1 text-muted">
                                {instructions.message}
                            </Typography>
                        </div>
                        <LiveStatus detected={detected} expired={invoiceExpired} progress={progress}
                                    explorer={explorer} hash={instructions.tx_hash}/>
                        {instructions.checkout_url && (
                            <Button
                                size="lg"
                                onPress={() => window.open(instructions.checkout_url, "_blank", "noopener")}
                            >
                                Continue to secure payment
                                <Icon icon={ExternalLink} className="size-4"/>
                            </Button>
                        )}
                        {invoiceExpired && (
                            <Button variant="secondary" onPress={onRefresh} isPending={refreshing}>
                                <Icon icon={RefreshCw} className="size-4"/>
                                Create new payment request
                            </Button>
                        )}
                    </div>
                )}
            </Card.Content>
        </Card>
    );
}

function LiveStatus({detected, expired, progress, explorer, hash}) {
    if (expired) return null;

    if (detected) {
        return (
            <div
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm"
                role="status">
                <span className="flex items-center gap-2 font-medium text-accent">
                    <Spinner/> Payment detected
                </span>
                <span className="text-muted">
                    Waiting for network confirmations{progress ? ` (${progress})` : ""}
                </span>
                {explorer && (
                    <a href={explorer} target="_blank" rel="noopener noreferrer"
                       className="ml-auto flex items-center gap-1 text-xs text-accent hover:underline">
                        {shortHash(hash)} <Icon icon={ExternalLink} className="size-3"/>
                    </a>
                )}
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2.5 rounded-xl bg-default/60 px-4 py-3 text-sm"
             role="status">
            <span className="relative flex size-2.5">
                <span
                    className="absolute inline-flex size-full animate-ping rounded-full bg-warning opacity-60 motion-reduce:animate-none"/>
                <span className="relative inline-flex size-2.5 rounded-full bg-warning"/>
            </span>
            <span>Waiting for your payment</span>
            <span className="text-muted">· this page updates by itself</span>
        </div>
    );
}

function DetailRow({label, value, copy, copyLabel, mono = false, strong = false}) {
    return (
        <div className="min-w-0">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="mt-1 flex items-center justify-between gap-2">
                <span
                    className={`min-w-0 break-all ${mono ? "font-mono text-sm" : ""} ${strong ? "text-lg font-semibold" : ""}`}>
                    {value}
                </span>
                {copy && <CopyButton value={copy} label={copyLabel}/>}
            </dd>
        </div>
    );
}

function Note({icon, tone, children}) {
    const styles = tone === "warning"
        ? "border-warning/40 bg-warning/5"
        : "border-accent/30 bg-accent/5";
    const iconColor = tone === "warning" ? "text-warning" : "text-accent";
    return (
        <div className={`flex items-start gap-2.5 rounded-xl border p-3.5 ${styles}`}>
            <Icon icon={icon || Info} className={`mt-0.5 size-4 shrink-0 ${iconColor}`}/>
            <Typography type="body-xs" className="leading-relaxed">{children}</Typography>
        </div>
    );
}

function ShipmentCard({shipment}) {
    const shipped = shipment.status !== "pending";
    return (
        <Card>
            <Card.Content className="flex flex-col gap-4 p-5 sm:p-6">
                <div className="flex items-center gap-3">
                    <Icon icon={shipped ? Truck : Package} className="size-5 text-accent"/>
                    <Typography type="h3" className="text-lg font-medium">
                        {shipment.status === "delivered" ? "Delivered" : shipped ? "On its way" : "Getting ready to ship"}
                    </Typography>
                </div>

                {shipped && shipment.tracking_number ? (
                    <dl className="grid gap-4 sm:grid-cols-2">
                        <DetailRow label="Carrier" value={shipment.carrier || "—"}/>
                        <DetailRow label="Tracking number" value={shipment.tracking_number}
                                   copy={shipment.tracking_number} copyLabel="tracking number"
                                   mono/>
                        {shipment.shipped_at &&
                            <DetailRow label="Shipped" value={formatDate(shipment.shipped_at)}/>}
                        {shipment.delivered_at &&
                            <DetailRow label="Delivered"
                                       value={formatDate(shipment.delivered_at)}/>}
                    </dl>
                ) : (
                    <Typography type="body-sm" className="text-muted">
                        {shipped
                            ? "Your order has been handed to the carrier. Tracking details will appear here when they're available."
                            : "We'll add tracking details here as soon as your order leaves the warehouse."}
                    </Typography>
                )}
            </Card.Content>
        </Card>
    );
}
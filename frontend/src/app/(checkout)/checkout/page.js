"use client";

import {useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {
    Button, Card, Checkbox, FieldError, Form, Input, Label, Radio, RadioGroup,
    Separator, Skeleton, TextArea, TextField, toast, Typography,
} from "@heroui/react";
import {
    ArrowRight, Check, ChevronDown, Coins, CreditCard, Lock, LogIn, Package,
    ShieldCheck, ShoppingCart,
} from "lucide-react";
import Icon from "@/components/icon/Icon";
import Image from "@/components/Image";
import {useAuthStore} from "@/stores/auth";
import {useCartStore} from "@/stores/cart";
import {useAddresses} from "@/queries/account";
import {useCreateOrder, usePaymentMethods} from "@/queries/checkout";
import {getApiErrorMessage} from "@/lib/utils";
import {describeMethod, formatPrice} from "@/lib/payments";
import {notFoundImage} from "@/lib/config";

const EMPTY_ADDRESS = {
    full_name: "", line1: "", line2: "", city: "", state: "", postal_code: "", country: "",
};

const choiceClass = (selected, disabled) =>
    `w-full flex-row rounded-xl border p-4 transition-colors ${
        disabled
            ? "cursor-not-allowed opacity-50 border-border"
            : selected
                ? "border-accent bg-accent/5"
                : "border-border hover:border-accent/50"
    }`;

export default function CheckoutPage() {
    const router = useRouter();
    const logged_in = useAuthStore((s) => s.logged_in);
    const user = useAuthStore((s) => s.user);
    const {items, getTotalPrice, getTotalQuantity} = useCartStore();

    const {data: addressData, isLoading: addressesLoading} = useAddresses();
    const {data: methodData, isLoading: methodsLoading} = usePaymentMethods();
    const createOrder = useCreateOrder();

    const addresses = addressData?.results ?? addressData ?? [];
    const methods = methodData?.results ?? methodData ?? [];

    const [addressChoice, setAddressChoice] = useState(null);
    const [methodChoice, setMethodChoice] = useState(null);
    const [newAddress, setNewAddress] = useState(EMPTY_ADDRESS);
    const [saveAddress, setSaveAddress] = useState(true);
    const [notes, setNotes] = useState("");
    const [summaryOpen, setSummaryOpen] = useState(false);

    const totalQuantity = getTotalQuantity();
    const totalPrice = Number(getTotalPrice());

    const isTooSmall = (m) => totalPrice < Number(m.min_amount || 0);

    // Derived defaults (no effects needed)
    const defaultAddress = addresses.find((a) => a.is_default) ?? addresses[0];
    const selectedAddress = addressChoice ?? (defaultAddress ? String(defaultAddress.id) : "new");
    const firstUsable = methods.find((m) => !isTooSmall(m));
    const selectedMethod = methodChoice ?? firstUsable?.code ?? null;
    const method = methods.find((m) => m.code === selectedMethod);
    const belowMinimum = Boolean(method) && isTooSmall(method);
    const canSubmit = Boolean(selectedMethod) && !belowMinimum && !createOrder.isPending;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedMethod) return toast.danger("Choose a payment method.");

        const payload = {
            payment_method: selectedMethod,
            notes,
            ...(selectedAddress === "new"
                ? {address: newAddress, save_address: saveAddress}
                : {address_id: Number(selectedAddress)}),
        };

        try {
            // make sure the server cart matches what the customer sees
            await useCartStore.getState().syncGuestCart();
        } catch {
            /* the API validates the cart anyway */
        }

        createOrder.mutate(payload, {
            onSuccess: ({order, payment_instructions}) => {
                useCartStore.getState().resetLocalCart();

                // Only hand over to a hosted page when we have nothing to show
                // ourselves (card checkout, or a gateway that hasn't picked a coin).
                if (payment_instructions?.checkout_url && !payment_instructions?.address) {
                    window.location.assign(payment_instructions.checkout_url);
                    return;
                }
                toast.success("Order placed. Complete your payment to confirm it.");
                router.push(`/checkout/orders/${order.id}/`);
            },
            onError: (error) => toast.danger(getApiErrorMessage(error, "Could not place the order.")),
        });
    };

    if (!logged_in) {
        return (
            <EmptyState
                icon={LogIn}
                title="Sign in to check out"
                text="Your cart is saved. Sign in or create an account to choose an address and pay."
                href="/login"
                action="Sign in"
            />
        );
    }

    if (totalQuantity === 0) {
        return (
            <EmptyState
                icon={ShoppingCart}
                title="Your cart is empty"
                text="Add something to your cart and it will show up here."
                href="/products"
                action="Browse products"
            />
        );
    }

    return (
        <div className="flex w-full flex-col">
            <header className="container pb-6 pt-6 sm:pb-8 sm:pt-8">
                <div className="flex flex-col gap-5 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <Typography type="h1" className="text-3xl font-light tracking-tight sm:text-4xl">
                            Checkout
                        </Typography>
                        <Typography type="body-sm" className="mt-1 flex items-center gap-1.5 text-muted">
                            <Icon icon={Lock} className="size-3.5"/>
                            Secure, private checkout
                        </Typography>
                    </div>
                    <Steps current={1}/>
                </div>
            </header>

            <Form
                onSubmit={handleSubmit}
                className="container grid grid-cols-12 items-start gap-8 pb-32 lg:gap-10 lg:pb-24"
            >
                <div className="col-span-12 flex flex-col gap-6 lg:col-span-7 xl:col-span-8">

                    {/* Contact */}
                    <Section step={1} title="Contact">
                        <Typography type="body-sm" className="text-muted">
                            Order updates go to{" "}
                            <span className="font-medium text-foreground">{user?.email ?? "your account email"}</span>.
                        </Typography>
                    </Section>

                    {/* Delivery */}
                    <Section step={2} title="Delivery address" description="Where should we send your order?">
                        {addressesLoading ? (
                            <Skeleton className="h-24 w-full rounded-xl"/>
                        ) : (
                            <RadioGroup
                                name="address"
                                aria-label="Delivery address"
                                value={selectedAddress}
                                onChange={setAddressChoice}
                                className="gap-3"
                            >
                                {addresses.map((a) => (
                                    <Radio
                                        key={a.id}
                                        value={String(a.id)}
                                        className={choiceClass(selectedAddress === String(a.id))}
                                    >
                                        <Radio.Content>
                                            <Radio.Control><Radio.Indicator/></Radio.Control>
                                            <div className="flex min-w-0 flex-col gap-0.5">
                                                <Label className="flex items-center gap-2 font-medium">
                                                    {a.full_name}
                                                    {a.is_default && (
                                                        <span
                                                            className="rounded-full bg-default px-2 py-0.5 text-xs font-normal text-muted">
                                                            Default
                                                        </span>
                                                    )}
                                                </Label>
                                                <span className="text-sm text-muted">
                                                    {[a.line1, a.line2].filter(Boolean).join(", ")}
                                                </span>
                                                <span className="text-sm text-muted">
                                                    {[a.city, a.state, a.postal_code, a.country].filter(Boolean).join(", ")}
                                                </span>
                                            </div>
                                        </Radio.Content>
                                    </Radio>
                                ))}
                                <Radio value="new" className={choiceClass(selectedAddress === "new")}>
                                    <Radio.Content>
                                        <Radio.Control><Radio.Indicator/></Radio.Control>
                                        <Label className="font-medium">Use a new address</Label>
                                    </Radio.Content>
                                </Radio>
                            </RadioGroup>
                        )}

                        {selectedAddress === "new" && (
                            <NewAddressForm
                                value={newAddress}
                                onChange={setNewAddress}
                                saveAddress={saveAddress}
                                onSaveChange={setSaveAddress}
                            />
                        )}
                    </Section>

                    {/* Payment */}
                    <Section
                        step={3}
                        title="Payment method"
                        description="You'll get the payment details on the next page."
                    >
                        {methodsLoading ? (
                            <Skeleton className="h-24 w-full rounded-xl"/>
                        ) : methods.length === 0 ? (
                            <Typography type="body-sm" className="text-muted">
                                No payment methods are available right now. Please try again shortly.
                            </Typography>
                        ) : (
                            <RadioGroup
                                name="payment_method"
                                aria-label="Payment method"
                                value={selectedMethod ?? ""}
                                onChange={setMethodChoice}
                                className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                            >
                                {methods.map((m) => (
                                    <MethodTile
                                        key={m.code}
                                        method={m}
                                        selected={selectedMethod === m.code}
                                        disabled={isTooSmall(m)}
                                    />
                                ))}
                            </RadioGroup>
                        )}

                        <div className="flex gap-3 rounded-xl bg-default/60 p-4">
                            <Icon icon={ShieldCheck} className="mt-0.5 size-5 shrink-0 text-accent"/>
                            <Typography type="body-xs" className="leading-relaxed text-muted">
                                Crypto payments go straight to the store wallet and are never held by a third
                                party. Your items are reserved while you pay (usually 60 minutes). If the
                                time runs out, the order is cancelled and the items go back on sale.
                            </Typography>
                        </div>
                    </Section>

                    {/* Notes */}
                    <Section step={4} title="Order notes" description="Optional. Anything the courier should know.">
                        <TextField variant="secondary" name="notes" value={notes} onChange={setNotes}>
                            <Label className="sr-only">Order notes</Label>
                            <TextArea rows={3} maxLength={1000} placeholder="Delivery instructions…"/>
                        </TextField>
                    </Section>
                </div>

                {/* Summary */}
                <aside className="order-first col-span-12 lg:order-last lg:col-span-5 xl:col-span-4">
                    <Card className="lg:sticky lg:top-28">
                        <Card.Content className="p-5 sm:p-6">
                            <button
                                type="button"
                                onClick={() => setSummaryOpen((open) => !open)}
                                aria-expanded={summaryOpen}
                                className="flex w-full items-center justify-between gap-3 lg:pointer-events-none"
                            >
                                <Typography type="h3" className="text-lg font-medium">
                                    Order summary
                                    <span className="ml-2 text-sm font-normal text-muted">
                                        ({totalQuantity} {totalQuantity === 1 ? "item" : "items"})
                                    </span>
                                </Typography>
                                <span className="flex items-center gap-2 lg:hidden">
                                    <span className="font-medium">{formatPrice(totalPrice)}</span>
                                    <Icon
                                        icon={ChevronDown}
                                        className={`size-4 transition-transform ${summaryOpen ? "rotate-180" : ""}`}
                                    />
                                </span>
                            </button>

                            <div className={`${summaryOpen ? "block" : "hidden"} lg:block`}>
                                <ul className="mt-5 flex flex-col gap-4">
                                    {items.map((item) => (
                                        <li key={item.product.id} className="flex items-center gap-3">
                                            <div
                                                className="relative size-16 shrink-0 rounded-lg border bg-default">
                                                <div className="relative size-full overflow-hidden rounded-lg">
                                                    <Image
                                                        src={item.product.primary_image || notFoundImage}
                                                        alt={item.product.name}
                                                        fill
                                                        sizes="64px"
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <span
                                                    className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-foreground text-xs text-background">
                                                    {item.quantity}
                                                </span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="line-clamp-2 text-sm font-medium leading-snug">
                                                    {item.product.name}
                                                </p>
                                                <p className="text-xs text-muted">
                                                    {formatPrice(item.product.store_price)} each
                                                </p>
                                            </div>
                                            <span className="shrink-0 text-sm font-medium">
                                                {formatPrice(Number(item.product.store_price) * Number(item.quantity))}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                <Separator className="my-5"/>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted">Subtotal</span>
                                    <span>{formatPrice(totalPrice)}</span>
                                </div>
                                <div className="mt-3 flex items-baseline justify-between">
                                    <span className="font-medium">Total</span>
                                    <span className="text-2xl font-semibold">{formatPrice(totalPrice)}</span>
                                </div>

                                <Link
                                    href="/cart"
                                    className="mt-3 inline-block text-xs text-muted no-underline hover:text-foreground"
                                >
                                    Edit cart
                                </Link>
                            </div>

                            {belowMinimum && (
                                <Typography type="body-xs" className="mt-4 text-danger">
                                    {method.name} needs an order of at least {formatPrice(method.min_amount)}.
                                </Typography>
                            )}

                            <Button
                                type="submit"
                                size="lg"
                                fullWidth
                                className="mt-6 hidden lg:flex"
                                isPending={createOrder.isPending}
                                isDisabled={!canSubmit}
                            >
                                <Icon icon={Lock} className="size-4"/>
                                {createOrder.isPending ? "Placing order…" : `Place order · ${formatPrice(totalPrice)}`}
                            </Button>

                            <Typography type="body-xs" className="mt-4 text-center leading-relaxed text-muted">
                                By placing this order you confirm you're 18 or older and agree to our{" "}
                                <Link href="/terms" className="underline underline-offset-2">Terms</Link> and{" "}
                                <Link href="/research-policy" className="underline underline-offset-2">Research Policy</Link>.
                            </Typography>

                            <Separator className="my-5"/>

                            <ul className="flex flex-col gap-2.5 text-xs text-muted">
                                <li className="flex items-center gap-2.5">
                                    <Icon icon={Lock} className="size-4 text-accent"/> Private checkout, no card data stored
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <Icon icon={Package} className="size-4 text-accent"/> Plain, discreet packaging
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <Icon icon={ShieldCheck} className="size-4 text-accent"/> Items reserved while you pay
                                </li>
                            </ul>
                        </Card.Content>
                    </Card>
                </aside>

                {/* Mobile sticky bar */}
                <div
                    className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur lg:hidden">
                    <div className="container flex items-center justify-between gap-4 py-3">
                        <div className="flex flex-col leading-tight">
                            <span className="text-xs text-muted">Total</span>
                            <span className="text-lg font-semibold">{formatPrice(totalPrice)}</span>
                        </div>
                        <Button
                            type="submit"
                            size="lg"
                            isPending={createOrder.isPending}
                            isDisabled={!canSubmit}
                        >
                            {createOrder.isPending ? "Placing order…" : "Place order"}
                            <Icon icon={ArrowRight} className="size-4"/>
                        </Button>
                    </div>
                </div>
            </Form>
        </div>
    );
}

/* ------------------------------------------------------------------ */

const STEPS = ["Cart", "Checkout", "Payment"];

function Steps({current}) {
    return (
        <ol className="flex items-center gap-2 text-sm" aria-label="Checkout progress">
            {STEPS.map((label, i) => {
                const done = i < current;
                const active = i === current;
                return (
                    <li key={label} className="flex items-center gap-2" aria-current={active ? "step" : undefined}>
                        <span
                            className={`flex size-6 items-center justify-center rounded-full text-xs font-medium ${
                                done
                                    ? "bg-accent text-accent-foreground"
                                    : active
                                        ? "border border-accent text-accent"
                                        : "border border-border text-muted"
                            }`}
                        >
                            {done ? <Icon icon={Check} className="size-3.5"/> : i + 1}
                        </span>
                        <span className={active ? "font-medium" : "text-muted"}>{label}</span>
                        {i < STEPS.length - 1 && <span className="mx-1 h-px w-6 bg-border sm:w-10"/>}
                    </li>
                );
            })}
        </ol>
    );
}

function Section({step, title, description, children}) {
    return (
        <Card>
            <Card.Content className="flex flex-col gap-5 p-5 sm:p-6">
                <div className="flex items-start gap-3">
                    <span
                        className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-medium text-accent">
                        {step}
                    </span>
                    <div>
                        <Typography type="h3" className="text-lg font-medium">{title}</Typography>
                        {description && (
                            <Typography type="body-sm" className="text-muted">{description}</Typography>
                        )}
                    </div>
                </div>
                {children}
            </Card.Content>
        </Card>
    );
}

function MethodTile({method, selected, disabled}) {
    const {ticker, network, isCard} = describeMethod(method);

    return (
        <Radio value={method.code} isDisabled={disabled} className={choiceClass(selected, disabled)}>
            <Radio.Content>
                <Radio.Control><Radio.Indicator/></Radio.Control>
                <div className="flex min-w-0 flex-1 items-start gap-3">
                    <MethodIcon method={method} ticker={ticker} isCard={isCard}/>
                    <div className="flex min-w-0 flex-col gap-0.5">
                        <Label className="font-medium">{method.name}</Label>
                        {(ticker || network) && (
                            <span className="text-xs text-muted">
                                {[ticker, network].filter(Boolean).join(" on ")}
                            </span>
                        )}
                        {method.description && (
                            <span className="line-clamp-2 text-xs text-muted">{method.description}</span>
                        )}
                        {disabled && (
                            <span className="text-xs text-danger">
                                Minimum order {formatPrice(method.min_amount)}
                            </span>
                        )}
                    </div>
                </div>
            </Radio.Content>
        </Radio>
    );
}

function MethodIcon({method, ticker, isCard}) {
    if (method.icon) {
        return (
            <Image
                src={method.icon}
                alt=""
                width={36}
                height={36}
                unoptimized
                className="size-9 shrink-0 rounded-lg object-contain"
            />
        );
    }
    return (
        <span
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-xs font-semibold text-accent">
            {isCard ? <Icon icon={CreditCard} className="size-4"/> : ticker ? ticker.slice(0, 4) :
                <Icon icon={Coins} className="size-4"/>}
        </span>
    );
}

function NewAddressForm({value, onChange, saveAddress, onSaveChange}) {
    const set = (name) => (v) => onChange((prev) => ({...prev, [name]: v}));

    const field = (name, label, props = {}) => (
        <TextField variant="secondary" name={name} value={value[name]} onChange={set(name)} {...props}>
            <Label>{label}</Label>
            <Input/>
            <FieldError/>
        </TextField>
    );

    return (
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-dashed border-border p-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
                {field("full_name", "Full name", {isRequired: true, autoComplete: "name"})}
            </div>
            <div className="sm:col-span-2">
                {field("line1", "Address", {isRequired: true, autoComplete: "address-line1"})}
            </div>
            <div className="sm:col-span-2">
                {field("line2", "Apartment, suite, etc. (optional)", {autoComplete: "address-line2"})}
            </div>
            {field("city", "City", {isRequired: true, autoComplete: "address-level2"})}
            {field("state", "State / province (optional)", {autoComplete: "address-level1"})}
            {field("postal_code", "Postal code", {isRequired: true, autoComplete: "postal-code"})}
            {field("country", "Country", {isRequired: true, autoComplete: "country-name"})}

            <div className="sm:col-span-2">
                <Checkbox isSelected={saveAddress} onChange={onSaveChange}>
                    <Checkbox.Content>
                        <Checkbox.Control><Checkbox.Indicator/></Checkbox.Control>
                        Save this address for next time
                    </Checkbox.Content>
                </Checkbox>
            </div>
        </div>
    );
}

function EmptyState({icon, title, text, href, action}) {
    return (
        <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
            <div className="flex size-16 items-center justify-center rounded-full border">
                <Icon icon={icon} className="size-7 text-muted"/>
            </div>
            <Typography type="h1" className="text-3xl font-light">{title}</Typography>
            <Typography type="body-sm" className="max-w-sm text-muted">{text}</Typography>
            <Link href={href} className="inline-flex items-center gap-2 text-accent no-underline">
                {action} <Icon icon={ArrowRight} className="size-4"/>
            </Link>
        </div>
    );
}
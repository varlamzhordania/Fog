"use client";

import {useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {
    Button, Card, Checkbox, FieldError, Form, Input, Label, Radio, RadioGroup,
    Separator, Skeleton, TextArea, TextField, toast, Typography,
} from "@heroui/react";
import {ArrowRight, LogIn, ShoppingCart} from "lucide-react";
import Icon from "@/components/Icon/Icon";
import {useAuthStore} from "@/stores/auth";
import {useCartStore} from "@/stores/cart";
import {useAddresses} from "@/queries/account";
import {useCreateOrder, usePaymentMethods} from "@/queries/checkout";
import {getApiErrorMessage} from "@/lib/utils";

const formatPrice = (value) =>
    new Intl.NumberFormat("en-US", {style: "currency", currency: "USD"}).format(Number(value || 0));

const EMPTY_ADDRESS = {
    full_name: "", line1: "", line2: "", city: "", state: "", postal_code: "", country: "",
};

export default function CheckoutPage() {
    const router = useRouter();
    const logged_in = useAuthStore((s) => s.logged_in);
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

    // Derived defaults (no effects needed)
    const defaultAddress = addresses.find((a) => a.is_default) ?? addresses[0];
    const selectedAddress = addressChoice ?? (defaultAddress ? String(defaultAddress.id) : "new");
    const selectedMethod = methodChoice ?? methods[0]?.code ?? null;

    const totalQuantity = getTotalQuantity();
    const totalPrice = Number(getTotalPrice());
    const method = methods.find((m) => m.code === selectedMethod);
    const belowMinimum = method && totalPrice < Number(method.min_amount);

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
            // make sure the server cart matches what the user sees
            await useCartStore.getState().syncGuestCart();
        } catch {
            /* the API validates the cart anyway */
        }

        createOrder.mutate(payload, {
            onSuccess: ({order, payment_instructions}) => {
                useCartStore.getState().resetLocalCart();
                if (payment_instructions?.checkout_url) {
                    window.location.assign(payment_instructions.checkout_url);
                    return;
                }
                toast.success("Order created. Complete your payment within 60 minutes.");
                router.push(`/checkout/orders/${order.id}/`);
            },
            onError: (error) => toast.danger(getApiErrorMessage(error, "Could not create the order.")),
        });
    };

    if (!logged_in) {
        return (
            <div
                className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
                <Typography type="h1" className="text-3xl font-light">Sign in to
                    checkout</Typography>
                <Typography type="body-sm" className="max-w-sm text-muted">
                    Your cart is saved. Sign in or create an account to choose an address and pay.
                </Typography>
                <Link href="/login"
                      className="inline-flex items-center gap-2 text-accent no-underline">
                    <Icon icon={LogIn}/> Sign in
                </Link>
            </div>
        );
    }

    if (totalQuantity === 0) {
        return (
            <div
                className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
                <Icon icon={ShoppingCart} className="size-10 text-muted"/>
                <Typography type="h1" className="text-3xl font-light">Your cart is
                    empty</Typography>
                <Link href="/products"
                      className="inline-flex items-center gap-2 text-accent no-underline">
                    Explore Catalog <Icon icon={ArrowRight} className="size-4"/>
                </Link>
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col">
            <header className="container pb-6 pt-6 sm:pb-8 sm:pt-8">
                <div className="border-b pb-5">
                    <Typography type="body-sm"
                                className="mb-1.5 uppercase tracking-wider text-muted">
                        FOG DIRECT · Secure checkout
                    </Typography>
                    <Typography type="h1"
                                className="text-3xl font-light tracking-tight sm:text-4xl">
                        Checkout
                    </Typography>
                </div>
            </header>

            <Form onSubmit={handleSubmit}
                  className="container grid grid-cols-12 items-start gap-8 pb-16 md:pb-24 lg:gap-10">
                <div className="col-span-12 flex flex-col gap-8 lg:col-span-8 xl:col-span-9">

                    {/* 1. Address */}
                    <Card>
                        <Card.Content className="flex flex-col gap-5 p-5 sm:p-6">
                            <Typography type="h3" className="font-normal">1. Delivery
                                address</Typography>

                            {addressesLoading ? (
                                <Skeleton className="h-20 w-full rounded-lg"/>
                            ) : (
                                <RadioGroup name="address" value={selectedAddress}
                                            onChange={setAddressChoice}>
                                    {addresses.map((a) => (
                                        <Radio key={a.id} value={String(a.id)}
                                               className="w-full flex-row rounded-lg border p-3">
                                            <Radio.Content>
                                                <Radio.Control><Radio.Indicator/></Radio.Control>
                                                <div className="flex flex-col">
                                                    <Label className="font-medium">
                                                        {a.full_name}{a.is_default ? " · Default" : ""}
                                                    </Label>
                                                    <span className="text-sm text-muted">
                                                        {[a.line1, a.line2, a.city, a.state, a.postal_code, a.country]
                                                            .filter(Boolean).join(", ")}
                                                    </span>
                                                </div>
                                            </Radio.Content>
                                        </Radio>
                                    ))}
                                    <Radio value="new"
                                           className="w-full flex-row rounded-lg border p-3">
                                        <Radio.Content>
                                            <Radio.Control><Radio.Indicator/></Radio.Control>
                                            <Label className="font-medium">Use a new address</Label>
                                        </Radio.Content>
                                    </Radio>
                                </RadioGroup>
                            )}

                            {selectedAddress === "new" && (
                                <NewAddressForm value={newAddress} onChange={setNewAddress}
                                                saveAddress={saveAddress}
                                                onSaveChange={setSaveAddress}/>
                            )}
                        </Card.Content>
                    </Card>

                    {/* 2. Payment */}
                    <Card>
                        <Card.Content className="flex flex-col gap-5 p-5 sm:p-6">
                            <Typography type="h3" className="font-normal">2. Payment
                                method</Typography>

                            {methodsLoading ? (
                                <Skeleton className="h-20 w-full rounded-lg"/>
                            ) : methods.length === 0 ? (
                                <Typography type="body-sm" className="text-muted">
                                    No payment methods are available right now.
                                </Typography>
                            ) : (
                                <RadioGroup name="payment_method" value={selectedMethod ?? ""}
                                            onChange={setMethodChoice}>
                                    {methods.map((m) => (
                                        <Radio key={m.code} value={m.code}
                                               className="w-full flex-row rounded-lg border p-3">
                                            <Radio.Content>
                                                <Radio.Control><Radio.Indicator/></Radio.Control>
                                                <div className="flex flex-col">
                                                    <Label className="font-medium">{m.name}</Label>
                                                    {m.description && (
                                                        <span
                                                            className="text-sm text-muted">{m.description}</span>
                                                    )}
                                                    {Number(m.min_amount) > 0 && (
                                                        <span className="text-xs text-muted">
                                                            Minimum {formatPrice(m.min_amount)}
                                                        </span>
                                                    )}
                                                </div>
                                            </Radio.Content>
                                        </Radio>
                                    ))}
                                </RadioGroup>
                            )}
                            <Typography type="body-xs" className="text-muted">
                                Your order is held for 60 minutes. If it isn't paid in that time it
                                is
                                cancelled and the items go back on sale.
                            </Typography>
                        </Card.Content>
                    </Card>

                    {/* 3. Notes */}
                    <Card>
                        <Card.Content className="flex flex-col gap-3 p-5 sm:p-6">
                            <Typography type="h3" className="font-normal">3. Notes
                                (optional)</Typography>
                            <TextField variant="secondary" name="notes" value={notes}
                                       onChange={setNotes}>
                                <Label className="sr-only">Order notes</Label>
                                <TextArea rows={3} maxLength={1000}
                                          placeholder="Delivery instructions…"/>
                            </TextField>
                        </Card.Content>
                    </Card>
                </div>

                {/* Summary */}
                <aside className="col-span-12 lg:col-span-4 xl:col-span-3">
                    <Card className="lg:sticky lg:top-30">
                        <Card.Content className="p-5 sm:p-6">
                            <Typography type="h3" className="mb-5 font-normal">Order
                                Summary</Typography>

                            <ul className="flex flex-col gap-3">
                                {items.map((item) => (
                                    <li key={item.product.id}
                                        className="flex justify-between gap-3 text-sm">
                                        <span className="min-w-0 truncate">
                                            {item.quantity} × {item.product.name}
                                        </span>
                                        <span className="shrink-0">
                                            {formatPrice(Number(item.product.store_price) * Number(item.quantity))}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <Separator className="my-5"/>

                            <div className="mb-6 flex items-center justify-between gap-4">
                                <Typography type="body">Total</Typography>
                                <Typography type="h2"
                                            className="font-normal">{formatPrice(totalPrice)}</Typography>
                            </div>

                            {belowMinimum && (
                                <Typography type="body-xs" className="mb-3 text-danger">
                                    {method.name} requires at least {formatPrice(method.min_amount)}.
                                </Typography>
                            )}

                            <Button type="submit" size="lg" fullWidth
                                    isPending={createOrder.isPending}
                                    isDisabled={createOrder.isPending || belowMinimum || !selectedMethod}>
                                {createOrder.isPending ? "Placing order..." : "Place Order"}
                                <Icon icon={ArrowRight} className="size-4"/>
                            </Button>

                            <Link href="/cart"
                                  className="mt-4 block text-center text-xs text-muted no-underline hover:text-foreground">
                                Back to cart
                            </Link>
                        </Card.Content>
                    </Card>
                </aside>
            </Form>
        </div>
    );
}

function NewAddressForm({value, onChange, saveAddress, onSaveChange}) {
    const set = (name) => (v) => onChange((prev) => ({...prev, [name]: v}));

    const field = (name, label, props = {}) => (
        <TextField variant="secondary" name={name} value={value[name]}
                   onChange={set(name)} {...props}>
            <Label>{label}</Label>
            <Input/>
            <FieldError/>
        </TextField>
    );

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div
                className="sm:col-span-2">{field("full_name", "Full name", {isRequired: true})}</div>
            <div
                className="sm:col-span-2">{field("line1", "Address line 1", {isRequired: true})}</div>
            <div className="sm:col-span-2">{field("line2", "Address line 2 (optional)")}</div>
            {field("city", "City / Town", {isRequired: true})}
            {field("state", "State / Province (optional)")}
            {field("postal_code", "Postal code", {isRequired: true})}
            {field("country", "Country", {isRequired: true})}

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
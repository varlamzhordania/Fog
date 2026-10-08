"use client";

import Link from "next/link";
import {useCartStore} from "@/stores/cart";
import CartQuantityControl from "@/components/inventory/CartQuantityControl";
import Icon from "@/components/icon/Icon";
import {
    ArrowRight, ShoppingCart, Trash2,
} from "lucide-react";
import {
    toast, Button, Card, Separator, Typography,
} from "@heroui/react";
import {notFoundImage} from "@/lib/config";
import Image from "@/components/Image";
import {useCartActions} from "@/hooks/useCartActions";
import {useRouter} from "next/navigation";
import {useAuthStore} from "@/stores/auth";
import {useConfig} from "@/queries/config";
import {computeTotals, taxLabel} from "@/lib/pricing";


const formatPrice = (value) => new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2,
}).format(Number(value || 0));


export default function CartPage() {
    const {
        items, getTotalQuantity, getTotalPrice, clearCart,
    } = useCartStore();

    const totalQuantity = getTotalQuantity();
    const totalPrice = getTotalPrice();

    const handleClearCart = async () => {
        try {
            await clearCart();
            toast.success("Cart cleared successfully.");
        } catch (error) {
            console.log(error)
            const errorMessage = error?.response?.data?.detail || "Failed to clear cart.";

            toast.danger(errorMessage);
        }
    };

    if (totalQuantity === 0) {
        return (<div
                className="container min-h-[70vh] flex items-center justify-center px-4 py-12 sm:px-6">
                <div className="flex w-full max-w-md flex-col items-center text-center">

                    <div
                        className="mb-5 flex size-16 items-center justify-center rounded-full border sm:mb-6 sm:size-20">
                        <Icon
                            icon={ShoppingCart}
                            className="size-8 text-muted sm:size-10"
                        />
                    </div>

                    <Typography
                        type="h1"
                        className="mb-3 text-2xl font-light tracking-tight sm:text-3xl"
                    >
                        Your cart is empty
                    </Typography>

                    <Typography
                        type="body-sm"
                        className="mb-7 max-w-sm px-2 text-center text-muted sm:mb-8"
                    >
                        Explore the FOG DIRECT catalog and add products to
                        your collection before continuing to checkout.
                    </Typography>

                    <Link
                        href="/products"
                        className="group inline-flex items-center no-underline transition-colors hover:text-accent"
                    >
                        Explore Catalog

                        <Icon
                            icon={ArrowRight}
                            className="mx-2 size-4 transition-transform group-hover:translate-x-0.5"
                        />
                    </Link>
                </div>
            </div>);
    }

    return (<div className="flex w-full flex-col">

            {/* Header */}
            <header className="container pb-6 pt-6 sm:pb-8 sm:pt-8">
                <div
                    className="flex flex-col gap-5 border-b pb-5 sm:flex-row sm:items-end sm:justify-between sm:pb-6">

                    <div className="min-w-0">
                        <Typography
                            type="body-sm"
                            className="mb-1.5 text-muted uppercase tracking-wider sm:mb-2"
                        >
                            FOG DIRECT · {totalQuantity}{" "}
                            {totalQuantity === 1 ? "ITEM" : "ITEMS"}
                        </Typography>

                        <Typography
                            type="h1"
                            className="text-3xl font-light tracking-tight sm:text-4xl"
                        >
                            Shopping Cart
                        </Typography>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onPress={handleClearCart}
                        className="w-fit shrink-0 text-muted hover:text-danger"
                    >
                        <Icon icon={Trash2}/>
                        Clear Cart
                    </Button>
                </div>
            </header>

            {/* Content */}
            <main className="container grid grid-cols-12 gap-8 pb-16 md:pb-24 lg:gap-10">

                {/* Products */}
                <section className="col-span-12 lg:col-span-8 xl:col-span-9">
                    <div className="flex flex-col">
                        {items.map((item) => (<ProductItem
                                key={item.product.id}
                                data={item}
                            />))}
                    </div>
                </section>

                {/* Summary */}
                <aside className="col-span-12 lg:col-span-4 xl:col-span-3">
                    <OrderSummary
                        totalQuantity={totalQuantity}
                        totalPrice={totalPrice}
                    />
                </aside>

            </main>
        </div>);
}


function ProductItem({data}) {
    const product = data.product;
    const quantity = Number(data.quantity);

    const {handleRemove} = useCartActions(product);

    const image = product.primary_image || product.image || notFoundImage;

    const storePrice = Number(product.store_price || 0);
    const basePrice = Number(product.base_price || 0);
    const discount = Number(product.discount_percentage || 0);

    const lineTotal = storePrice * quantity;

    return (<article className="w-full border-b py-5 first:pt-0 sm:py-6">
            <div className="flex min-w-0 gap-3 sm:gap-5">
                {/* Product Image */}
                <Link
                    href={`/products/${product.slug}`}
                    className="relative size-20 shrink-0 overflow-hidden rounded-md border bg-default sm:size-28 md:size-32"
                >
                    <Image
                        src={image}
                        alt={product.name}
                        fill
                        sizes="(min-width: 768px) 128px, (min-width: 640px) 112px, 80px"
                        loading={"eager"}
                        className="object-cover transition-transform duration-300 hover:scale-105"
                    />
                </Link>

                {/* Product Content */}
                <div className="flex min-w-0 flex-1 flex-col">
                    {/* Header */}
                    <div className="flex min-w-0 items-start justify-between gap-2 sm:gap-4">
                        <div className="min-w-0 flex-1">
                            <Typography
                                type="small"
                                className="mb-0.5 text-[10px] text-muted uppercase tracking-wider sm:mb-1 sm:text-xs"
                            >
                                Ref #{String(product.id).padStart(4, "0")}
                            </Typography>

                            <Link
                                href={`/products/${product.slug}`}
                                className="block no-underline hover:text-accent transition-colors"
                            >
                                <Typography
                                    type="h3"
                                    className="truncate text-base font-normal sm:text-lg"
                                >
                                    {product.name}
                                </Typography>
                            </Link>

                            {/* Pricing */}
                            <div
                                className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:mt-2 sm:gap-2">
                                <Typography type="body-sm" className="font-medium">
                                    {formatPrice(storePrice)}
                                </Typography>

                                {discount > 0 && basePrice > storePrice && (
                                    <Typography type="small" className="text-muted line-through">
                                        {formatPrice(basePrice)}
                                    </Typography>)}

                                {discount > 0 && (
                                    <span className="text-[11px] text-accent sm:text-xs">
                                        -{discount}%
                                    </span>)}
                            </div>
                        </div>

                        {/* Remove Button */}
                        <Button
                            isIconOnly
                            variant="ghost"
                            size="sm"
                            onPress={() => handleRemove()}
                            aria-label={`Remove ${product.name} from cart`}
                            className="size-8 shrink-0 text-muted hover:text-danger sm:size-9"
                        >
                            <Icon icon={Trash2} className="size-4"/>
                        </Button>
                    </div>

                    {/* Bottom */}
                    <div className="mt-5 flex items-center justify-between gap-3 sm:mt-6">
                        <CartQuantityControl
                            product={product}
                            showAddButton={false}
                            showRemoveButton={false}
                            size="sm"
                        />
                        <div className="min-w-0 text-right">
                            <Typography type="body-xs" className="text-muted">
                                Subtotal
                            </Typography>
                            <Typography type="body" className="font-medium">
                                {formatPrice(lineTotal)}
                            </Typography>
                        </div>
                    </div>
                </div>
            </div>
        </article>);
}

function OrderSummary({totalQuantity, totalPrice}) {
    const router = useRouter()
    const isAuthenticated = useAuthStore().logged_in
    const {availabilityCheck} = useCartStore(state => state)
    const {data: config} = useConfig();

    const totals = computeTotals(totalPrice, config);
    const minimum = Number(config?.MINIMUM_ORDER_AMOUNT_USD ?? 0);
    const belowMinimum = totals.subtotal < minimum;
    const maintenance = Boolean(config?.STORE_MAINTENANCE_MODE);

    const handleCheckout = () => {
        if (!isAuthenticated) {
            toast.danger("Please sign in before continue with your checkout")
            return
        }
        if (availabilityCheck()) {
            router.push("/checkout")
        }
    }

    return (<Card className="lg:sticky lg:top-30">
            <Card.Content className="p-5 sm:p-6">
                <Typography
                    type="h3"
                    className="mb-5 font-normal"
                >
                    Order Summary
                </Typography>

                <div className="flex flex-col gap-3">

                    <div className="flex items-center justify-between gap-4">
                        <Typography
                            type="body-sm"
                            className="text-muted"
                        >
                            Items
                        </Typography>

                        <Typography type="body-sm">
                            {totalQuantity}
                        </Typography>
                    </div>

                    <div className="flex items-start justify-between gap-4">
                        <Typography
                            type="body-sm"
                            className="text-muted"
                        >
                            Shipping
                        </Typography>

                        <Typography
                            type="body-xs"
                            className="max-w-[150px] text-right text-muted"
                        >
                            Calculated at checkout
                        </Typography>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <Typography type="body-sm" className="text-muted">Subtotal</Typography>
                        <Typography type="body-sm">{formatPrice(totals.subtotal)}</Typography>
                    </div>

                    {totals.tax > 0 && (<div className="flex items-center justify-between gap-4">
                            <Typography type="body-sm"
                                        className="text-muted">{taxLabel(totals)}</Typography>
                            <Typography type="body-sm">{formatPrice(totals.tax)}</Typography>
                        </div>)}


                </div>

                <Separator className="my-5"/>

                <div className="mb-6 flex items-center justify-between gap-4">

                    <Typography type="body">
                        Total
                    </Typography>

                    <Typography
                        type="h2"
                        className="font-normal"
                    >
                        {formatPrice(totals.total)}
                    </Typography>

                </div>

                {maintenance && (<Typography type="body-xs" className="mb-3 text-danger">
                        Checkout is temporarily disabled for maintenance. Your cart is saved.
                    </Typography>)}
                {!maintenance && belowMinimum && (
                    <Typography type="body-xs" className="mb-3 text-danger">
                        The minimum order is {formatPrice(minimum)}.
                        Add {formatPrice(minimum - totals.subtotal)} more to continue.
                    </Typography>)}

                <Button size="lg" fullWidth className="group"
                        isDisabled={maintenance || belowMinimum}
                        onPress={handleCheckout}>
                    Proceed to Checkout
                    <Icon
                        icon={ArrowRight}
                        className="size-4 transition-transform group-hover:translate-x-0.5"
                    />
                </Button>

                <Separator className="my-5"/>

                <Typography
                    type="body-xs"
                    className="text-center text-muted"
                >
                    Secure checkout with modern technology.
                </Typography>

            </Card.Content>
        </Card>);
}
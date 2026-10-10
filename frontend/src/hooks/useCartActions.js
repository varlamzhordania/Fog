"use client";

import {toast} from "@heroui/react";
import {useCartStore} from "@/stores/cart";
import {getDefaultPrice} from "@/lib/pricing";

export function useCartActions(product, priceProp) {
    const items = useCartStore((state) => state.items);
    const addItem = useCartStore((state) => state.addItem);
    const incrementQuantity = useCartStore((state) => state.incrementQuantity);
    const decrementQuantity = useCartStore((state) => state.decrementQuantity);
    const removeItem = useCartStore((state) => state.removeItem);

    const price = priceProp ?? getDefaultPrice(product);
    const stockUnit = price?.label

    const productId = Number(product?.id);
    const priceId = Number(price?.id);

    const hasValidPrice = Number.isFinite(productId) && productId > 0 && Number.isFinite(priceId) && priceId > 0;

    const item = items.find((i) => Number(i.product?.id) === productId && Number(i.price?.id) === priceId);

    const quantity = Number(item?.quantity ?? 0);

    // Stock is one pool per product, so subtract what other options of it use.
    const perPurchase = Math.max(1, Number(price?.stock_quantity ?? 1));
    const usedByOthers = items
        .filter((i) => Number(i.product.id) === productId && Number(i.price?.id) !== priceId)
        .reduce((sum, i) => sum + Number(i.quantity) * Number(i.price?.stock_quantity ?? 1), 0);
    const stock = Math.max(0, Math.floor((Number(product?.available_stock ?? 0) - usedByOthers) / perPurchase));

    const isInStock = stock > 0 || quantity > 0;
    const isInCart = Boolean(item);
    const isDownloadable = product?.product_type === "downloadable";
    const isAvailableToPurchase = product?.is_available || false;

    const atMax = quantity >= stock;
    const fail = (error, fallback) => toast.danger(error?.response?.data?.detail || fallback);

    const handleAdd = async (onAddCallback) => {
        if (!product || !hasValidPrice) {
            console.error("Cannot add product: missing product or price ID.", {
                productId: product?.id,
                price,
                prices: product?.prices,
            });

            return toast.danger("Unable to add this product. Please try again.");
        }

        if (stock <= 0) {
            return toast.danger("Maximum available stock reached.");
        }

        try {
            await addItem(product, price);
            toast.success(`${product.name} (${price.label}) added to cart.`);
            onAddCallback?.({product, price});
        } catch (error) {
            toast.danger(
                error?.response?.data?.detail || "Failed to add item to cart."
            );
        }
    };

    const handleIncrement = async () => {
        if (!productId || !priceId) return;
        if (atMax) return toast.danger("Maximum available stock reached.");
        try {
            await incrementQuantity(productId, priceId);
            toast.success("Quantity increased.");
        } catch (error) {
            fail(error, "Failed to increase quantity.");
        }
    };

    const handleDecrement = async () => {
        if (!productId || !priceId || quantity <= 1) return;
        try {
            await decrementQuantity(productId, priceId);
            toast.success("Quantity decreased.");
        } catch (error) {
            fail(error, "Failed to decrease quantity.");
        }
    };


    const handleSetQuantity = async (newQuantity) => {
        if (!productId || !priceId || !item) return;

        const nextQuantity = Number(newQuantity);

        if (!Number.isSafeInteger(nextQuantity) || nextQuantity < 1) {
            return toast.danger("Please enter a valid quantity.");
        }

        if (nextQuantity > stock) {
            return toast.danger(`Maximum available quantity is ${stock}.`);
        }

        const previousQuantity = quantity;
        if (nextQuantity === previousQuantity) return;

        try {
            await useCartStore
                .getState()
                .updateQuantity(productId, priceId, nextQuantity);

            const {logged_in} = await import("@/stores/auth").then(
                (module) => module.useAuthStore.getState()
            );

            if (logged_in) {
                const {updateCartItem} = await import("@/lib/api/checkout");
                await updateCartItem({
                    productId,
                    priceId,
                    quantity: nextQuantity,
                });
            }
        } catch (error) {
            useCartStore
                .getState()
                .updateQuantity(productId, priceId, previousQuantity);

            fail(error, "Failed to update quantity.");
        }
    };


    const handleRemove = async (onRemoveCallback) => {
        if (!productId || !priceId || !item) return;
        try {
            await removeItem(productId, priceId);
            toast.success(`${product.name} removed.`);
            onRemoveCallback?.({product, item});
        } catch (error) {
            fail(error, "Failed to remove item.");
        }
    };

    return {
        item,
        price,
        stockUnit,
        quantity,
        stock,
        isInStock,
        isInCart,
        isDownloadable,
        isAvailableToPurchase,
        hasValidPrice,
        handleAdd,
        handleIncrement,
        handleDecrement,
        handleSetQuantity,
        handleRemove,
    };
}
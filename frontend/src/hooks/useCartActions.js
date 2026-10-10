"use client";

import {toast} from "@heroui/react";
import {useCartStore} from "@/stores/cart";
import {getDefaultPrice} from "@/lib/pricing";

export function useCartActions(product, priceProp) {
    const {items, addItem, incrementQuantity, decrementQuantity, removeItem} = useCartStore();

    const price = priceProp ?? getDefaultPrice(product);
    const productId = product?.id ? Number(product.id) : null;
    const priceId = price?.id ? Number(price.id) : null;

    const item = items.find(
        (i) => Number(i.product.id) === productId && Number(i.price?.id) === priceId
    );
    const quantity = Number(item?.quantity ?? 0);

    // Stock is one pool per product, so subtract what other options of it use.
    const perPurchase = Math.max(1, Number(price?.stock_quantity ?? 1));
    const usedByOthers = items
        .filter((i) => Number(i.product.id) === productId && Number(i.price?.id) !== priceId)
        .reduce((sum, i) => sum + Number(i.quantity) * Number(i.price?.stock_quantity ?? 1), 0);
    const stock = Math.max(
        0, Math.floor((Number(product?.available_stock ?? 0) - usedByOthers) / perPurchase)
    );

    const isInStock = stock > 0 || quantity > 0;
    const isInCart = Boolean(item);
    const isDownloadable = product?.product_type === "downloadable";
    const isAvailableToPurchase = product?.is_available || false;

    const atMax = quantity >= stock;
    const fail = (error, fallback) =>
        toast.danger(error?.response?.data?.detail || fallback);

    const handleAdd = async (onAddCallback) => {
        if (!product || !price) return;
        if (stock <= 0) return toast.danger("Maximum available stock reached.");
        try {
            await addItem(product, price);
            toast.success(`${product.name} (${price.label}) added to cart.`);
            onAddCallback?.({product, price});
        } catch (error) {
            fail(error, "Failed to add item to cart.");
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
        item, price, quantity, stock, isInStock, isInCart, isDownloadable,
        isAvailableToPurchase, handleAdd, handleIncrement, handleDecrement, handleRemove,
    };
}
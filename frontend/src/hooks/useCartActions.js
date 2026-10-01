"use client";

import { toast } from "@heroui/react";
import { useCartStore } from "@/stores/cart";

export function useCartActions(product) {
    const {
        items,
        addItem,
        incrementQuantity,
        decrementQuantity,
        removeItem,
    } = useCartStore();

    const productId = product?.id ? Number(product.id) : null;

    const item = items.find((i) => Number(i.product.id) === productId);
    const quantity = Number(item?.quantity ?? 0);
    const stock = Number(product?.available_stock ?? 0);

    const isInStock = stock > 0;
    const isInCart = Boolean(item);
    const isDownloadable = product?.product_type === "downloadable";


    const handleAdd = async (onAddCallback) => {
        if (!product) return;

        if (!isInStock || (stock > 0 && quantity >= stock)) {
            toast.danger("Maximum available stock reached.");
            return;
        }

        try {
            await addItem(product);
            toast.success(`${product.name} added to cart.`);
            onAddCallback?.({ product });
        } catch (error) {
            toast.danger(error?.response?.data?.detail || "Failed to add item to cart.");
        }
    };

    const handleIncrement = async () => {
        if (!productId) return;

        if (!isInStock || (stock > 0 && quantity >= stock)) {
            toast.danger("Maximum available stock reached.");
            return;
        }

        try {
            await incrementQuantity(productId);
            toast.success("Quantity increased.");
        } catch (error) {
            toast.danger(error?.response?.data?.detail || "Failed to increase quantity.");
        }
    };

    const handleDecrement = async () => {
        if (!productId || quantity <= 1) return;

        try {
            await decrementQuantity(productId);
            toast.success("Quantity decreased.");
        } catch (error) {
            toast.danger(error?.response?.data?.detail || "Failed to decrease quantity.");
        }
    };

    const handleRemove = async (onRemoveCallback) => {
        if (!productId || !item) return;

        try {
            await removeItem(productId);
            toast.success(`${product.name} removed.`);
            onRemoveCallback?.({ product, item });
        } catch (error) {
            toast.danger(error?.response?.data?.detail || "Failed to remove item.");
        }
    };

    return {
        item,
        quantity,
        stock,
        isInStock,
        isInCart,
        isDownloadable,
        handleAdd,
        handleIncrement,
        handleDecrement,
        handleRemove,
    };
}
"use client";

import {useEffect, useState} from "react";
import {Button} from "@heroui/react";
import {
    Download,
    ShoppingBag,
    Trash2,
} from "lucide-react";

import {useCartStore} from "@/stores/cart";
import Icon from "@/components/Icon/Icon";

export default function CartQuantityControl({
                                                product,
                                                showAddButton = true,
                                                showRemoveButton = true,
                                                limitWidth = true,
                                                size = "md",
                                                className = "",
                                                onAdd,
                                                onUpdate,
                                                onRemove,
                                            }) {
    const {
        items,
        incrementItem,
        updateQuantity,
        removeItem,
        isItemPending,
        isSyncing,
    } = useCartStore((state) => state);

    const item = items.find(
        (item) =>
            Number(item.product.id) ===
            Number(product.id)
    );

    const quantity = Number(item?.quantity ?? 0);
    const stock = Number(product.available_stock ?? 0);

    const isInStock = stock > 0;
    const isInCart = Boolean(item);
    const isAtStockLimit = quantity >= stock;

    const isDownloadable =
        product.product_type === "downloadable";

    const isPending = isItemPending(product.id);
    const isDisabled = isPending || isSyncing;

    const [inputQuantity, setInputQuantity] = useState(quantity);

    /*
     * Keep the local NumberField value synchronized
     * with the actual cart value.
     *
     * Do not update it while an operation is pending.
     */
    useEffect(() => {
        if (!isPending) {
            setInputQuantity(quantity);
        }
    }, [quantity, isPending]);

    const handleAdd = async () => {
        if (
            isDisabled ||
            !isInStock ||
            isAtStockLimit
        ) {
            return;
        }

        await incrementItem(product, 1);

        onAdd?.({
            product,
            quantity: 1,
        });
    };

    const handleQuantityChange = async (newQuantity) => {
        if (!item || isDisabled) {
            return;
        }

        newQuantity = Number(newQuantity);

        if (!Number.isFinite(newQuantity)) {
            return;
        }

        newQuantity = Math.min(
            Math.max(newQuantity, 1),
            stock
        );

        /*
         * Update the local input immediately.
         */
        setInputQuantity(newQuantity);

        if (newQuantity === quantity) {
            return;
        }

        await updateQuantity(
            product.id,
            newQuantity
        );

        onUpdate?.({
            product,
            item,
            quantity: newQuantity,
        });
    };

    const handleRemove = async () => {
        if (!item || isDisabled) {
            return;
        }

        await removeItem(product.id);

        onRemove?.({
            product,
            item,
        });
    };

    /*
     * Product isn't in cart.
     */
    if (!isInCart) {
        if (!showAddButton) {
            return null;
        }

        return (
            <Button
                size={size}
                fullWidth
                isDisabled={
                    !isInStock ||
                    isDisabled
                }
                onPress={handleAdd}
                className={className}
            >
                <Icon
                    icon={
                        isDownloadable
                            ? Download
                            : ShoppingBag
                    }
                />

                {isInStock
                    ? "Add to Cart"
                    : "Out of Stock"}
            </Button>
        );
    }

    return (
        <div
            className={`flex items-center gap-2 ${className}`}
        >
            <div className="flex items-center gap-1">
                <Button
                    isIconOnly
                    size={size}
                    variant="tertiary"
                    isDisabled={
                        isDisabled ||
                        quantity <= 1
                    }
                    onPress={() =>
                        decrementQuantity(product.id)
                    }
                    aria-label={`Decrease ${product.name} quantity`}
                >
                    −
                </Button>

                <span
                    className="flex w-8 min-w-8 items-center justify-center text-center"
                    aria-live="polite"
                >
        {quantity}
    </span>

                <Button
                    isIconOnly
                    size={size}
                    variant="tertiary"
                    isDisabled={
                        isDisabled ||
                        quantity >= stock
                    }
                    onPress={() =>
                        incrementQuantity(product.id)
                    }
                    aria-label={`Increase ${product.name} quantity`}
                >
                    +
                </Button>
            </div>

            {showRemoveButton && (
                <Button
                    isIconOnly
                    size={size}
                    variant="tertiary"
                    isDisabled={isDisabled}
                    aria-label={`Remove ${product.name} from cart`}
                    onPress={handleRemove}
                >
                    <Icon icon={Trash2}/>
                </Button>
            )}
        </div>
    );
}
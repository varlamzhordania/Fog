"use client";

import {useRouter} from "next/navigation";
import {Button} from "@heroui/react";
import {Download, ShoppingBag, Trash2, Plus, Minus, SlidersHorizontal} from "lucide-react";
import Icon from "@/components/icon/Icon";
import {useCartActions} from "@/hooks/useCartActions";

export default function CartQuantityControl({
                                                product,
                                                price,
                                                showAddButton = true,
                                                showRemoveButton = true,
                                                size = "md",
                                                className = "",
                                                onAdd,
                                                onRemove,
                                            }) {
    const router = useRouter();
    const {
        quantity, stock, isInStock, isInCart, isDownloadable, isAvailableToPurchase,
        handleAdd, handleIncrement, handleDecrement, handleRemove,
    } = useCartActions(product, price);

    // Card on a listing: several options, none chosen yet.
    if (!price && (product.prices?.length ?? 0) > 1) {
        if (!showAddButton) return null;
        return (
            <Button
                size={size} fullWidth variant="secondary"
                isDisabled={!isAvailableToPurchase}
                onPress={() => router.push(`/products/${product.slug}/`)}
                className={className}
            >
                <Icon icon={SlidersHorizontal}/>
                {isAvailableToPurchase ? "Choose option" : "Out of Stock"}
            </Button>
        );
    }

    if (!isInCart) {
        if (!showAddButton) return null;
        return (
            <Button
                size={size} fullWidth
                isDisabled={!isInStock || !isAvailableToPurchase}
                onPress={() => handleAdd(onAdd)}
                className={className}
            >
                <Icon icon={isDownloadable ? Download : ShoppingBag}/>
                {isInStock && isAvailableToPurchase ? "Add to Cart" : "Out of Stock"}
            </Button>
        );
    }

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className="flex items-center gap-1">
                <Button isIconOnly size={size} variant="tertiary"
                        isDisabled={!isAvailableToPurchase || quantity <= 1}
                        onPress={handleDecrement}
                        aria-label={`Decrease ${product.name} quantity`}>
                    <Icon icon={Minus} size={16}/>
                </Button>

                <div
                    className="flex w-8 min-w-8 items-center justify-center text-center tabular-nums"
                    aria-live="polite" aria-label={`Quantity: ${quantity}`}>
                    <span>{quantity}</span>
                </div>

                <Button isIconOnly size={size} variant="tertiary"
                        isDisabled={!isAvailableToPurchase || quantity >= stock}
                        onPress={handleIncrement}
                        aria-label={`Increase ${product.name} quantity`}>
                    <Icon icon={Plus} size={16}/>
                </Button>
            </div>

            {showRemoveButton && (
                <Button isIconOnly size={size} variant="tertiary" color="danger"
                        aria-label={`Remove ${product.name} from cart`}
                        onPress={() => handleRemove(onRemove)}>
                    <Icon icon={Trash2} size={18}/>
                </Button>
            )}
        </div>
    );
}
"use client";

import { Button } from "@heroui/react";
import { Download, ShoppingBag, Trash2, Plus, Minus } from "lucide-react";
import Icon from "@/components/Icon/Icon";
import { useCartActions } from "@/hooks/useCartActions";

export default function CartQuantityControl({
    product,
    showAddButton = true,
    showRemoveButton = true,
    size = "md",
    className = "",
    onAdd,
    onRemove,
}) {
    // 1. Grab everything from our reusable hook
    const {
        quantity,
        stock,
        isInStock,
        isInCart,
        isDownloadable,
        handleAdd,
        handleIncrement,
        handleDecrement,
        handleRemove,
    } = useCartActions(product);

    if (!isInCart) {
        if (!showAddButton) return null;

        return (
            <Button
                size={size}
                fullWidth
                isDisabled={!isInStock}
                onPress={() => handleAdd(onAdd)} // Pass the callback here!
                className={className}
            >
                <Icon icon={isDownloadable ? Download : ShoppingBag} />
                {isInStock ? "Add to Cart" : "Out of Stock"}
            </Button>
        );
    }

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className="flex items-center gap-1">
                <Button
                    isIconOnly
                    size={size}
                    variant="tertiary"
                    isDisabled={quantity <= 1}
                    onPress={handleDecrement}
                    aria-label={`Decrease ${product.name} quantity`}
                >
                    <Icon icon={Minus} size={16} />
                </Button>

                <div
                    className="flex w-8 min-w-8 items-center justify-center text-center tabular-nums"
                    aria-live="polite"
                    aria-label={`Quantity: ${quantity}`}
                >
                    <span>{quantity}</span>
                </div>

                <Button
                    isIconOnly
                    size={size}
                    variant="tertiary"
                    isDisabled={stock > 0 && quantity >= stock}
                    onPress={handleIncrement}
                    aria-label={`Increase ${product.name} quantity`}
                >
                    <Icon icon={Plus} size={16} />
                </Button>
            </div>

            {showRemoveButton && (
                <Button
                    isIconOnly
                    size={size}
                    variant="tertiary"
                    color="danger"
                    aria-label={`Remove ${product.name} from cart`}
                    onPress={() => handleRemove(onRemove)}
                >
                    <Icon icon={Trash2} size={18} />
                </Button>
            )}
        </div>
    );
}
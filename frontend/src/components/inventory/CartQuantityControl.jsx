"use client";

import {useState, useEffect} from "react";
import {useRouter} from "next/navigation";
import {Button, Typography} from "@heroui/react";
import {cn} from "tailwind-variants";
import {Download, ShoppingBag, Trash2, Plus, Minus, SlidersHorizontal} from "lucide-react";
import Icon from "@/components/icon/Icon";
import {useCartActions} from "@/hooks/useCartActions";
import {optionSuffix, totalLabel} from "@/lib/pricing";

const FIELD_SIZE = {
    sm: "h-9 text-sm",
    md: "h-10 text-base",
    lg: "h-12 text-base",
};

export default function CartQuantityControl({
    product, price, showAddButton = true, showRemoveButton = true,
    size = "md", className = "", onAdd, onRemove,
}) {
    const router = useRouter();

    const {
        price: activePrice, quantity, stock, isInStock, isInCart, isDownloadable,
        isAvailableToPurchase, hasValidPrice,
        handleAdd, handleIncrement, handleDecrement, handleSetQuantity, handleRemove,
    } = useCartActions(product, price);

    const [inputValue, setInputValue] = useState(String(quantity));

    useEffect(() => {
        setInputValue(String(quantity));
    }, [quantity]);

    // Listing card with several options and none chosen yet.
    if (!price && (product.prices?.length ?? 0) > 1) {
        if (!showAddButton) return null;

        return (
            <Button
                size={size}
                fullWidth
                variant="secondary"
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
                size={size}
                fullWidth
                isDisabled={!hasValidPrice || !isInStock || !isAvailableToPurchase}
                onPress={() => handleAdd(onAdd)}
                className={className}
            >
                <Icon icon={isDownloadable ? Download : ShoppingBag}/>
                {isInStock && isAvailableToPurchase ? "Add to Cart" : "Out of Stock"}
            </Button>
        );
    }

    const commitQuantity = async () => {
        const requested = Number(inputValue);

        if (inputValue.trim() === "" || !Number.isSafeInteger(requested) || requested < 1) {
            setInputValue(String(quantity));
            return;
        }

        const next = Math.min(requested, stock);
        setInputValue(String(next));
        if (next !== quantity) await handleSetQuantity(next);
    };

    const total = totalLabel(product, activePrice, quantity);
    const atMax = quantity >= stock;

    return (
        <div className={cn("flex flex-col gap-1.5", className)}>
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                    <Button
                        isIconOnly
                        size={size}
                        variant="tertiary"
                        isDisabled={!isAvailableToPurchase || quantity <= 1}
                        onPress={handleDecrement}
                        aria-label={`Decrease ${product.name} quantity`}
                    >
                        <Icon icon={Minus} size={16}/>
                    </Button>

                    <label
                        className={cn(
                            "flex min-w-28 cursor-text items-center overflow-hidden rounded-xl border",
                            "border-field-border bg-field-background transition-colors",
                            "focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30",
                            !isAvailableToPurchase && "cursor-not-allowed opacity-50",
                            FIELD_SIZE[size] ?? FIELD_SIZE.md,
                        )}
                    >
                        <input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={stock}
                            step={1}
                            value={inputValue}
                            disabled={!isAvailableToPurchase}
                            aria-label={`${product.name} quantity`}
                            onChange={(event) => setInputValue(event.target.value)}
                            onBlur={commitQuantity}
                            onFocus={(event) => event.target.select()}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") event.currentTarget.blur();
                            }}
                            className={cn(
                                "h-full w-full min-w-0 bg-transparent pl-3 pr-1 text-right font-medium",
                                "tabular-nums outline-none",
                                "[appearance:textfield]",
                                "[&::-webkit-inner-spin-button]:appearance-none",
                                "[&::-webkit-outer-spin-button]:appearance-none",
                            )}
                        />
                        <span className="shrink-0 select-none whitespace-nowrap pl-1 pr-3 text-xs text-muted">
                            {optionSuffix(activePrice)}
                        </span>
                    </label>

                    <Button
                        isIconOnly
                        size={size}
                        variant="tertiary"
                        isDisabled={!isAvailableToPurchase || atMax}
                        onPress={handleIncrement}
                        aria-label={`Increase ${product.name} quantity`}
                    >
                        <Icon icon={Plus} size={16}/>
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
                        <Icon icon={Trash2} size={18}/>
                    </Button>
                )}
            </div>

            {(total || atMax) && (
                <Typography type="body-xs" className="text-muted" aria-live="polite">
                    {total && <>Total: <span className="font-medium text-foreground">{total}</span></>}
                    {total && atMax && " · "}
                    {atMax && <span className="text-warning">Max available</span>}
                </Typography>
            )}
        </div>
    );
}
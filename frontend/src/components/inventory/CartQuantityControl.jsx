"use client";

import {useState, useEffect} from "react";
import {useRouter} from "next/navigation";
import {Button, Input, Typography} from "@heroui/react";
import {
    Download,
    ShoppingBag,
    Trash2,
    Plus,
    Minus,
    SlidersHorizontal,
} from "lucide-react";
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
        quantity,
        stock,
        stockUnit,
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
    } = useCartActions(product, price);

    const [inputValue, setInputValue] = useState(String(quantity));

    useEffect(() => {
        setInputValue(String(quantity));
    }, [quantity]);


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
                isDisabled={
                    !hasValidPrice ||
                    !isInStock ||
                    !isAvailableToPurchase
                }
                onPress={() => handleAdd(onAdd)}
                className={className}
            >
                <Icon icon={isDownloadable ? Download : ShoppingBag}/>
                {isInStock && isAvailableToPurchase
                    ? "Add to Cart"
                    : "Out of Stock"}
            </Button>
        );
    }

    const commitQuantity = async () => {
        if (inputValue.trim() === "") {
            setInputValue(String(quantity));
            return;
        }

        const requested = Number(inputValue);

        if (!Number.isSafeInteger(requested) || requested < 1) {
            setInputValue(String(quantity));
            return;
        }

        const nextQuantity = Math.min(requested, stock);

        setInputValue(String(nextQuantity));

        if (nextQuantity !== quantity) {
            await handleSetQuantity(nextQuantity);
        }
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
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
                <div className={"relative"}>
                    <Input
                        type="number"
                        min={1}
                        max={stock}
                        step={1}
                        size={size}
                        value={inputValue}
                        fullWidth
                        aria-label={`${product.name} quantity`}
                        className="min-w-16"
                        disabled={!isAvailableToPurchase}
                        onChange={(event) => setInputValue(event.target.value)}
                        onBlur={commitQuantity}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.currentTarget.blur();
                            }
                        }}
                        onFocus={(event) => event.target.select()}
                    />
                    <Typography type={"body-xs"} className={"absolute top-2 right-2"}>
                        {stockUnit}
                    </Typography>
                </div>
                <Button
                    isIconOnly
                    size={size}
                    variant="tertiary"
                    isDisabled={
                        !isAvailableToPurchase || quantity >= stock
                    }
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
    );
}

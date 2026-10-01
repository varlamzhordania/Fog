"use client";

import {Button, NumberField} from "@heroui/react";
import {Download, ShoppingBag, Trash2} from "lucide-react";
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
        items, incrementItem, updateQuantity, removeItem
    } = useCartStore((state) => state);

    const item = items.find((item) => item.product_id === product.id);

    const quantity = item?.quantity ?? 0;
    const stock = Number(product.available_stock ?? 0);

    const isInStock = stock > 0;
    const isInCart = Boolean(item);
    const isAtStockLimit = quantity >= stock;

    const isDownloadable = product.product_type === "downloadable";


    const handleAdd = () => {
        if (!isInStock || isAtStockLimit) {
            return;
        }

        incrementItem(product, 1);

        onAdd?.({
            product, quantity: 1,
        });
    };


    const handleQuantityChange = (newQuantity) => {
        if (!item) {
            return;
        }

        newQuantity = Number(newQuantity);

        if (!Number.isFinite(newQuantity)) {
            return;
        }

        /*
         * NumberField can theoretically receive a value
         * outside the stock limit, so enforce it here too.
         */
        newQuantity = Math.min(Math.max(newQuantity, 1), stock);

        if (newQuantity === quantity) {
            return;
        }

        updateQuantity(item.id, newQuantity);

        onUpdate?.({
            product, item, quantity: newQuantity,
        });
    };


    const handleRemove = () => {
        if (!item) {
            return;
        }

        removeItem(item.id);

        onRemove?.({
            product, item,
        });
    };

    /*
     * Product isn't in cart.
     *
     * Show the normal Add to Cart button.
     */
    if (!isInCart) {
        if (!showAddButton) {
            return null;
        }

        return (<Button
            size={size}
            fullWidth
            isDisabled={!isInStock}
            onPress={handleAdd}
            className={className}
        >
            <Icon icon={isDownloadable ? Download : ShoppingBag}/>
            {isInStock ? "Add to Cart" : "Out of Stock"}
        </Button>);
    }


    /*
     * Product is already in the cart.
     */
    return (<div
        className={`flex items-center gap-2 ${className}`}
    >
        <NumberField
            minValue={1}
            maxValue={stock}
            value={quantity}
            onChange={handleQuantityChange}
            variant={"secondary"}
            aria-label={`Quantity for ${product.name}`}
        >
            <NumberField.Group>
                <NumberField.DecrementButton/>
                <NumberField.Input className={`${limitWidth && 'w-16'} text-center`}/>
                <NumberField.IncrementButton/>
            </NumberField.Group>
        </NumberField>

        {showRemoveButton && (<Button
            isIconOnly
            size={size}
            variant={"tertiary"}
            aria-label={`Remove ${product.name} from cart`}
            onPress={handleRemove}
        >
            <Icon icon={Trash2}/>
        </Button>)}
    </div>);
}
from django.shortcuts import get_object_or_404
from django.core.exceptions import ObjectDoesNotExist
from rest_framework.exceptions import ValidationError

from checkout.models import ShoppingCart, ShoppingCartItem
from inventory.models import Product


class CartService:
    @staticmethod
    def get_or_create_cart(user) -> ShoppingCart:
        cart, _ = ShoppingCart.objects.get_or_create(
            user=user
        )

        return (
            ShoppingCart.objects
            .prefetch_related(
                "items__product__product_stock",
                "items__product__product_media_items__media",
            )
            .get(pk=cart.pk)
        )

    @staticmethod
    def clear_cart(user) -> None:
        cart = CartService.get_or_create_cart(user)
        cart.items.all().delete()

    @staticmethod
    def add_to_cart(
            user,
            product_id: int,
            quantity: int = 1
    ) -> ShoppingCart:
        cart = CartService.get_or_create_cart(user)
        product = get_object_or_404(Product, id=product_id, is_active=True)

        cart_item = ShoppingCartItem.objects.filter(
            cart=cart,
            product=product
        ).first()

        if cart_item:
            cart_item.increment(quantity)
        else:
            try:
                available_stock = product.product_stock.available_quantity
            except ObjectDoesNotExist:
                available_stock = 0

            if quantity > available_stock:
                raise ValidationError(
                    {
                        "detail": f"Cannot add {quantity} items. Only {available_stock} available in stock."
                    }
                )

            ShoppingCartItem.objects.create(
                cart=cart,
                product=product,
                quantity=quantity
            )

        return cart

    @staticmethod
    def update_item_quantity(
            user,
            product_id: int,
            quantity: int,
            action: str = 'set',
    ) -> ShoppingCart:
        cart = CartService.get_or_create_cart(user)

        item = get_object_or_404(
            ShoppingCartItem,
            product_id=product_id,
            cart=cart
        )

        if action == 'increment':
            item.increment(quantity)
        elif action == 'decrement':
            item.decrement(quantity)
        elif action == 'set':
            item.set_quantity(quantity)
        else:
            raise ValidationError(
                {"detail": f"Unsupported action: {action}"}
            )

        return cart

    # In CartService
    @staticmethod
    def remove_item(user, product_id: int) -> ShoppingCart:
        cart = CartService.get_or_create_cart(user)
        item = get_object_or_404(
            ShoppingCartItem,
            product_id=product_id,
            cart=cart
            )
        item.delete()
        return cart

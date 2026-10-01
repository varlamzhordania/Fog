from django.shortcuts import get_object_or_404
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

        cart_item, created = ShoppingCartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={'quantity': quantity}
        )
        if not created:
            cart_item.quantity += quantity
            cart_item.save(update_fields=['quantity'])

        return cart

    @staticmethod
    def update_item_quantity(
            user,
            item_id: int,
            quantity: int
    ) -> ShoppingCart:
        cart = CartService.get_or_create_cart(user)
        item = get_object_or_404(ShoppingCartItem, id=item_id, cart=cart)

        if quantity <= 0:
            item.delete()
        else:
            item.quantity = quantity
            item.save(update_fields=["quantity"])

        return cart

    @staticmethod
    def remove_item(user, item_id: int) -> ShoppingCart:
        cart = CartService.get_or_create_cart(user)
        item = get_object_or_404(ShoppingCartItem, id=item_id, cart=cart)
        item.delete()

        return cart

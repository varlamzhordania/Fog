from django.shortcuts import get_object_or_404
from django.core.exceptions import ObjectDoesNotExist
from rest_framework.exceptions import ValidationError

from checkout.models import ShoppingCart, ShoppingCartItem
from inventory.models import Product, ProductPrice


class CartService:
    @staticmethod
    def get_or_create_cart(user) -> ShoppingCart:
        cart, _ = ShoppingCart.objects.get_or_create(user=user)
        return (
            ShoppingCart.objects
            .prefetch_related(
                "items__price",
                "items__product__product_stock",
                "items__product__product_media_items__media",
            )
            .get(pk=cart.pk)
        )

    @staticmethod
    def clear_cart(user) -> None:
        CartService.get_or_create_cart(user).items.all().delete()

    @staticmethod
    def _price(product, price_id):
        if price_id:
            return get_object_or_404(ProductPrice, pk=price_id, product=product, is_active=True)
        return product.get_default_price()

    @staticmethod
    def _find_item(cart, product_id, price_id):
        qs = ShoppingCartItem.objects.filter(cart=cart, product_id=product_id)
        if price_id:
            qs = qs.filter(price_id=price_id)
        return get_object_or_404(qs)

    @staticmethod
    def add_to_cart(user, product_id: int, quantity: int = 1, price_id=None) -> ShoppingCart:
        cart = CartService.get_or_create_cart(user)
        product = get_object_or_404(Product, id=product_id, is_active=True)
        price = CartService._price(product, price_id)

        item = ShoppingCartItem.objects.filter(cart=cart, product=product, price=price).first()
        if item:
            item.increment(quantity)
            return cart

        try:
            total = product.product_stock.available_quantity
        except ObjectDoesNotExist:
            total = 0
        used = sum(
            i.quantity * i.price.stock_quantity
            for i in cart.items.filter(product=product).select_related("price")
        )
        fits = max(0, total - used) // price.stock_quantity
        if quantity > fits:
            raise ValidationError(
                {"detail": f"Cannot add {quantity} items. Only {fits} available in stock."}
            )
        ShoppingCartItem.objects.create(cart=cart, product=product, price=price, quantity=quantity)
        return cart

    @staticmethod
    def update_item_quantity(user, product_id: int, quantity: int,
                             action: str = 'set', price_id=None) -> ShoppingCart:
        cart = CartService.get_or_create_cart(user)
        item = CartService._find_item(cart, product_id, price_id)
        if action == 'increment':
            item.increment(quantity)
        elif action == 'decrement':
            item.decrement(quantity)
        elif action == 'set':
            item.set_quantity(quantity)
        else:
            raise ValidationError({"detail": f"Unsupported action: {action}"})
        return cart

    @staticmethod
    def remove_item(user, product_id: int, price_id=None) -> ShoppingCart:
        cart = CartService.get_or_create_cart(user)
        CartService._find_item(cart, product_id, price_id).delete()
        return cart
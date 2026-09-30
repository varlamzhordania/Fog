from django.db import transaction
from django.utils import timezone

from checkout.models import ShoppingCart, ShoppingCartItem

# Upper bound for a single line, whatever the stock level is.
MAX_ITEM_QUANTITY = 99


def purchasable_quantity(product) -> int:
    """
    Units of a product a customer may hold in the cart: the stock that is free
    (on hand minus reserved), capped at MAX_ITEM_QUANTITY.
    Products without a stock record, or flagged unavailable, cannot be bought.
    """
    stock = getattr(product, "product_stock", None)

    if stock is None or not stock.is_available:
        return 0

    return min(stock.available_quantity, MAX_ITEM_QUANTITY)


def clamp_quantity(product, quantity: int) -> int:
    return max(0, min(int(quantity), purchasable_quantity(product)))


def touch_cart(cart: ShoppingCart) -> None:
    ShoppingCart.objects.filter(pk=cart.pk).update(updated_at=timezone.now())


@transaction.atomic
def set_item_quantity(cart: ShoppingCart, product, quantity: int) -> int:
    """
    Sets the absolute quantity of a product in the cart and returns the stored
    quantity. The request is clamped to what is in stock; a result of 0 removes
    the line.
    """
    quantity = clamp_quantity(product, quantity)

    if quantity == 0:
        cart.items.filter(product=product).delete()
    else:
        ShoppingCartItem.objects.update_or_create(
            cart=cart,
            product=product,
            defaults={"quantity": quantity},
        )

    touch_cart(cart)
    return quantity


@transaction.atomic
def set_items(cart: ShoppingCart, lines) -> None:
    """Applies several (product, quantity) pairs. Later duplicates win."""
    final = {}
    for product, quantity in lines:
        final[product.pk] = (product, quantity)

    for product, quantity in final.values():
        set_item_quantity(cart, product, quantity)


@transaction.atomic
def clear_cart(cart: ShoppingCart) -> None:
    cart.items.all().delete()
    touch_cart(cart)

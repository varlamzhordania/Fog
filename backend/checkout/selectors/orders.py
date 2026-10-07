from checkout.models import Order


def _base():
    return (
        Order.objects.select_related("delivery_address", "payment", "shipment")
        .prefetch_related("items__product", "stock_reservations")
    )


def orders_for_user(user):
    return _base().filter(user=user)


def order_detail(order_id):
    return _base().get(pk=order_id)
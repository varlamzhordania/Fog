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

def order_list_for_user(user):
    return Order.objects.filter(user=user).prefetch_related("items__product")
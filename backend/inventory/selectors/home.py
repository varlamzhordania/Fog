from django.db.models import F, Sum

from checkout.models import Order, OrderPayment
from inventory.models import Product

from .catalog import catalog_products


def home_sections():
    paid = OrderPayment.StatusChoices.COMPLETED
    base = catalog_products().filter(product_stock__is_available=True)

    deals = list(
        base.filter(store_price__lt=F("base_price"))
        .annotate(saving=F("base_price") - F("store_price"))
        .order_by("-saving")[:8]
    )
    return {
        "new_arrivals": base.order_by("-created_at")[:10],
        "best_sellers": (
            base.filter(order_items__order__payment__status=paid)
            .annotate(sold=Sum("order_items__quantity")).order_by("-sold")[:10]
        ),
        "deals": deals,
        "last_few": (
            base.filter(product_type="physical")
            .annotate(avail=F("product_stock__quantity") - F("product_stock__reserved_quantity"))
            .filter(avail__gt=0, avail__lte=F("product_stock__low_stock_threshold"))
            .order_by("avail")[:10]
        ),
        "stats": {
            "products": Product.objects.filter(is_active=True).count(),
            # order_by() clears Meta.ordering, which would otherwise leak into DISTINCT
            "countries": (
                Order.objects.filter(payment__status=paid)
                .order_by().values("delivery_address__country").distinct().count()
            ),
            "orders_delivered": Order.objects.filter(status=Order.StatusChoices.DELIVERED).count(),
            "max_discount": max((p.discount_percentage for p in deals), default=0),
        },
    }
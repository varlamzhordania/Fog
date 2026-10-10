from decimal import Decimal
from django.db.models.signals import post_save, pre_save
from django.db.models import Avg, Count
from django.db.models.signals import post_delete
from django.dispatch import receiver
from simple_history.models import HistoricalRecords

from inventory.models import (
    ProductStock, StockTransactionLog, Product, ProductPrice,
    ProductReview,
)


@receiver(pre_save, sender=ProductStock)
def _remember_quantity(sender, instance, raw=False, **kwargs):
    instance._old_quantity = None
    if not raw and instance.pk:
        instance._old_quantity = (
            ProductStock.objects.filter(pk=instance.pk)
            .values_list("quantity", flat=True).first()
        )


@receiver(post_save, sender=ProductStock)
def _log_manual_change(sender, instance, created, raw=False, **kwargs):
    if raw:
        return
    old = 0 if created else getattr(instance, "_old_quantity", None)
    if old is None or old == instance.quantity:
        return
    delta = instance.quantity - old
    request = getattr(HistoricalRecords.context, "request", None)
    user = getattr(request, "user", None)
    StockTransactionLog.objects.create(
        product_stock=instance,
        action=(StockTransactionLog.ActionChoices.RESTOCK if delta > 0
                else StockTransactionLog.ActionChoices.ADJUSTMENT),
        quantity=abs(delta),
        performed_by=user if getattr(
            user,
            "is_authenticated",
            False
        ) else None,
        note=f"Stock changed manually: {old} → {instance.quantity}.",
    )


def refresh_rating(product_id):
    agg = ProductReview.objects.filter(
        product_id=product_id, is_active=True
    ).aggregate(avg=Avg("rating"), n=Count("id"))
    Product.objects.filter(pk=product_id).update(
        # update(): no history/updated_at noise
        rating_average=Decimal(agg["avg"] or 0).quantize(Decimal("0.01")),
        rating_count=agg["n"],
    )


@receiver(post_save, sender=ProductReview)
def _review_saved(sender, instance, raw=False, **kwargs):
    if not raw:
        refresh_rating(instance.product_id)


@receiver(post_delete, sender=ProductReview)
def _review_deleted(sender, instance, **kwargs):
    refresh_rating(instance.product_id)


def sync_product_price(product_id):
    """Product.base/store_price always mirror the cheapest active option."""
    prices = list(ProductPrice.objects.filter(product_id=product_id, is_active=True))
    if not prices:
        return
    cheapest = min(prices, key=lambda p: p.store_price)
    if not any(p.is_default for p in prices):
        ProductPrice.objects.filter(pk=cheapest.pk).update(is_default=True)
    Product.objects.filter(pk=product_id).update(
        base_price=cheapest.base_price, store_price=cheapest.store_price,
    )


@receiver(post_save, sender=ProductPrice)
def _price_saved(sender, instance, raw=False, **kwargs):
    if not raw:
        sync_product_price(instance.product_id)


@receiver(post_delete, sender=ProductPrice)
def _price_deleted(sender, instance, **kwargs):
    sync_product_price(instance.product_id)

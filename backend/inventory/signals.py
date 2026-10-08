from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from simple_history.models import HistoricalRecords

from inventory.models import ProductStock, StockTransactionLog


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
        performed_by=user if getattr(user, "is_authenticated", False) else None,
        note=f"Stock changed manually: {old} → {instance.quantity}.",
    )
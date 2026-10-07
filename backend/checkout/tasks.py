from datetime import timedelta

from celery import shared_task
from django.core.cache import cache
from django.db.models import ExpressionWrapper, F, IntegerField
from django.utils import timezone

from checkout import emails, events
from checkout.models import Order, OrderPayment, OrderShipment
from checkout.payments import stripe_provider
from checkout.services.orders import OrderService
from checkout.services.payments import PaymentService
from inventory.models import ProductStock, StockReservation

from core.logging import get_logger

log = get_logger(__name__)

S, P = Order.StatusChoices, OrderPayment.StatusChoices


@shared_task(
    autoretry_for=(Exception,), dont_autoretry_for=(Order.DoesNotExist,),
    retry_backoff=30, retry_backoff_max=900, retry_jitter=True, max_retries=6,
)
def send_order_email(order_id, event, audience, extra=None):
    return emails.send(order_id, event, audience, extra)


@shared_task
def process_paid_order(order_id):
    """Work that doesn't belong in the webhook request: low-stock alerts for what was just sold."""
    order = Order.objects.prefetch_related("items").get(pk=order_id)
    stocks = (
        ProductStock.objects.filter(product_id__in=[i.product_id for i in order.items.all()])
        .annotate(avail=ExpressionWrapper(F("quantity") - F("reserved_quantity"), output_field=IntegerField()))
        .filter(avail__lte=F("low_stock_threshold")).select_related("product")
    )
    # alert once per product per 6 hours
    rows = [(s.product.name, f"{max(s.avail, 0)} left (alert at {s.low_stock_threshold})")
            for s in stocks if cache.add(f"lowstock:{s.pk}", 1, 6 * 3600)]
    if rows:
        emails.send_admin_message("Low stock alert", "Products running low",
                                  "These products dropped to or below their alert level.", rows=rows)


@shared_task
def expire_unpaid_orders():
    return OrderService.expire_due_orders()


@shared_task
def send_payment_reminders():
    now = timezone.now()
    ids = (
        Order.objects.filter(
            status=S.PAYMENT,
            stock_reservations__status=StockReservation.ReservationStatus.ACTIVE,
            stock_reservations__expires_at__gt=now,
            stock_reservations__expires_at__lte=now + timedelta(minutes=15),
        )
        .exclude(notifications__event="payment_reminder")
        .values_list("id", flat=True).distinct()
    )
    for order_id in ids:
        events.order_event(order_id, "payment_reminder")


@shared_task
def reconcile_stripe_payments():
    """Safety net for a missed webhook: ask Stripe about sessions still pending."""
    pending = (
        OrderPayment.objects.filter(
            provider="stripe", status=P.PENDING, order__status=S.PAYMENT,
            created_at__gte=timezone.now() - timedelta(hours=24),
        ).exclude(provider_reference="")
    )
    for payment in pending:
        try:
            paid, amount, intent = stripe_provider.fetch_status(payment.provider_reference)
        except Exception:
            log.exception("stripe.reconcile_lookup_failed", extra={"order_id": payment.order_id})
            continue
        if paid and amount == int(payment.amount * 100):
            PaymentService.settle_payment(payment.order_id, transaction_id=intent)


@shared_task
def send_admin_digest():
    low = ProductStock.objects.filter(product__is_active=True).annotate(
        avail=ExpressionWrapper(F("quantity") - F("reserved_quantity"), output_field=IntegerField())
    ).filter(avail__lte=F("low_stock_threshold")).count()
    rows = [
        ("Paid orders to review", Order.objects.filter(status=S.PENDING).count()),
        ("Orders in processing", Order.objects.filter(status=S.PROCESSING).count()),
        ("Shipments not sent", OrderShipment.objects.filter(status="pending").count()),
        ("Late payments to resolve",
         OrderPayment.objects.filter(provider_data__late_payment=True).exclude(status=P.REFUNDED).count()),
        ("Products low or out of stock", low),
    ]
    emails.send_admin_message("Daily store digest", "Daily digest", "Where things stand this morning.", rows=rows)
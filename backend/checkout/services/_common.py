from django.shortcuts import get_object_or_404

from checkout.exceptions import CheckoutError
from checkout.models import Order, OrderPayment, PaymentMethod
from checkout.payments import get_provider
from core.logging import get_logger
from core.logging.context import bind
from inventory.models import StockReservation

log = get_logger(__name__)

S = Order.StatusChoices
P = OrderPayment.StatusChoices
ACTIVE = StockReservation.ReservationStatus.ACTIVE


def lock_order(order_id):
    """Row-lock an order. Must be called inside transaction.atomic()."""
    bind(order_id=order_id)  # every later log line in this request/task carries it
    return get_object_or_404(Order.objects.select_for_update(), pk=order_id)


def append_note(order, text):
    order.notes = f"{order.notes}\n{text}".strip() if order.notes else text


def get_method(code):
    method = PaymentMethod.objects.filter(code=code, is_active=True).first()
    if not method:
        raise CheckoutError("This payment method is not available.")
    return method


def check_minimum(method, total):
    if total < method.min_amount:
        raise CheckoutError(f"{method.name} requires a minimum order of ${method.min_amount}.")


def cancel_remote(provider_code, reference):
    """Best-effort close of a gateway session. Never raises."""
    if not reference:
        return
    try:
        get_provider(provider_code).cancel(reference)
    except Exception:
        log.exception("payment.remote_cancel_failed",
                      extra={"provider": provider_code, "reference": reference})
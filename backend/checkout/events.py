from django.db import transaction
from core.logging import get_logger

log = get_logger(__name__)


def order_event(order_id, event, *, extra=None, countdown=0):
    """Queue the emails for an order event once the surrounding transaction commits."""
    from checkout import emails
    from checkout.tasks import send_order_email

    audiences = list(emails.SPEC[event])

    def dispatch():
        try:
            for audience in audiences:
                send_order_email.apply_async(
                    args=[order_id, event, audience, extra],
                    countdown=countdown
                )
        except Exception:  # a broker outage must never fail a payment
            log.exception(
                "email.queue_failed",
                extra={"order_id": order_id, "event": event}
            )

    transaction.on_commit(dispatch)


def order_paid(order_id):
    from checkout.tasks import process_paid_order

    def dispatch():
        try:
            process_paid_order.delay(order_id)
        except Exception:
            log.exception(
                "fulfilment.queue_failed",
                extra={"order_id": order_id}
            )

    transaction.on_commit(dispatch)

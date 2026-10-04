from django.utils import timezone

from checkout.models import PaymentAttempt

S = PaymentAttempt.StatusChoices
OPEN = (S.INITIATED, S.PENDING)
_FIELDS = ["status", "transaction_id", "error", "finished_at", "provider_data", "updated_at"]


def begin(payment, method):
    return PaymentAttempt.objects.create(
        payment=payment, number=payment.attempts.count() + 1,
        provider=method.provider, method=method.name, method_code=method.code,
        asset=method.asset, amount=payment.amount, status=S.INITIATED,
    )


def started(attempt, payment):
    """Copy the gateway references the provider just stored on the payment."""
    attempt.provider_reference = payment.provider_reference
    attempt.provider_data = dict(payment.provider_data)
    attempt.status = S.PENDING
    attempt.save(update_fields=["provider_reference", "provider_data", "status", "updated_at"])


def current(payment):
    return payment.attempts.filter(status__in=OPEN).first()


def close(payment, status, *, transaction_id=None, error=""):
    attempt = current(payment)
    if not attempt:
        return None
    attempt.status = status
    if transaction_id:
        attempt.transaction_id = transaction_id
    if error:
        attempt.error = error
    attempt.finished_at = timezone.now()
    attempt.save(update_fields=_FIELDS)
    return attempt


def record_failure(payment, method, error):
    """Written outside the rolled-back transaction, so failed gateway calls stay visible."""
    return PaymentAttempt.objects.create(
        payment=payment, number=payment.attempts.count() + 1,
        provider=method.provider, method=method.name, method_code=method.code,
        asset=method.asset, amount=payment.amount, status=S.FAILED,
        error=error, finished_at=timezone.now(),
    )


def mark_late(payment, transaction_id):
    attempt = payment.attempts.first()  # latest
    if attempt:
        attempt.status = S.LATE
        attempt.transaction_id = transaction_id
        attempt.finished_at = timezone.now()
        attempt.save(update_fields=_FIELDS)


def mark_refunded(payment):
    for attempt in payment.attempts.filter(status=S.SUCCEEDED):
        attempt.status = S.REFUNDED
        attempt.save(update_fields=_FIELDS)


def sync_data(payment, data):
    attempt = current(payment) or payment.attempts.first()
    if attempt:
        attempt.provider_data = {**attempt.provider_data, **data}
        attempt.save(update_fields=["provider_data", "updated_at"])
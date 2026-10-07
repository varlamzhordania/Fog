from dataclasses import dataclass, field
from datetime import timedelta

from django.utils import timezone


def payment_deadline(order):
    times = [r.expires_at for r in order.stock_reservations.filter(status="active")]
    return max(times) if times else timezone.now() + timedelta(minutes=60)


@dataclass(frozen=True)
class Session:
    """What a gateway returned for a new payment. Nothing is saved until the service persists it."""
    reference: str = ""
    data: dict = field(default_factory=dict)


class PaymentProvider:
    code: str = ""

    def instructions(self, order, payment, method) -> dict:
        """Pure: built only from stored payment data. Safe on every fetch."""
        raise NotImplementedError

    def create_session(self, order, payment, method) -> Session:
        """Call the gateway. Must NOT save anything: the service persists the result."""
        return Session()

    def cancel(self, reference: str) -> None:
        """Best-effort: close the open invoice/session. Default: nothing."""

    def refund(self, payment) -> bool:
        """True = money moved; False = staff must refund by hand."""
        return False
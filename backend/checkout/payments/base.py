from datetime import timedelta
from django.utils import timezone


def payment_deadline(order):
    times = [r.expires_at for r in order.stock_reservations.filter(status="active")]
    return max(times) if times else timezone.now() + timedelta(minutes=60)


class PaymentProvider:
    code: str = ""

    def instructions(self, order, payment, method) -> dict:
        """Pure: built only from stored payment data. Safe on every fetch."""
        raise NotImplementedError

    def initiate(self, order, payment, method) -> dict:
        """May call the gateway. Must fill provider_reference/provider_data."""
        return self.instructions(order, payment, method)

    def cancel(self, reference: str) -> None:
        """Best-effort: close the open invoice/session. Default: nothing."""

    def refund(self, payment) -> bool:
        """Refund through the gateway. True = money moved; False = staff must refund by hand."""
        return False
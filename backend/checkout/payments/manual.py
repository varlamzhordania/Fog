from .base import PaymentProvider
from .registry import register


@register
class ManualProvider(PaymentProvider):
    """Staff confirm the payment by hand in the admin (OrderPayment -> 'Confirm payment')."""
    codes = ("manual",)

    def instructions(self, order, payment, method):
        return {
            "provider": "manual",
            "status": "awaiting_manual_confirmation",
            "method": method.name if method else payment.method,
            "reference": f"ORDER-{order.id}",
            "amount": str(payment.amount),
            "currency": "USD",
            "message": (
                (method.description + " " if method and method.description else "")
                + "Your order is reserved. Payment will be confirmed manually "
                  "by our team. Quote the reference above when contacting support."
            ),
        }
from datetime import timedelta

import stripe
from django.conf import settings
from django.utils import timezone
from constance import config

from core.logging import get_logger
from checkout.exceptions import CheckoutError
from .base import PaymentProvider, Session, payment_deadline
from .registry import register

log = get_logger(__name__)


def _configure():
    stripe.api_key = config.STRIPE_SECRET_KEY
    stripe.max_network_retries = 2
    stripe.default_http_client = stripe._http_client.RequestsClient(
        timeout=15
    )


def fetch_status(reference):
    _configure()
    s = stripe.checkout.Session.retrieve(reference)
    return s.payment_status == "paid", s.amount_total, s.payment_intent


@register
class StripeProvider(PaymentProvider):
    code = "stripe"

    def instructions(self, order, payment, method):
        return {
            "provider": "stripe",
            "status": "awaiting_card_payment",
            "method": payment.method,
            "reference": f"ORDER-{order.id}",
            "amount": str(payment.amount),
            "currency": "USD",
            "checkout_url": payment.provider_data.get("checkout_url"),
            "message": "You will be redirected to Stripe to pay securely by card.",
        }

    def create_session(self, order, payment, method):
        _configure()
        expires = max(
            payment_deadline(order),
            timezone.now() + timedelta(
                minutes=config.PAYMENT_WINDOW_MINUTES
            ),
        )
        order_url = f"{settings.FRONTEND_URL}/checkout/orders/{order.id}/"
        try:
            session = stripe.checkout.Session.create(
                mode="payment",
                client_reference_id=str(order.id),
                customer_email=order.user.email,
                line_items=[{
                    "quantity": 1,
                    "price_data": {
                        "currency": "usd",
                        "unit_amount": int(payment.amount * 100),
                        "product_data": {
                            "name": f"FOG Direct order #{order.id}"},
                    },
                }],
                metadata={"order_id": str(order.id)},
                payment_intent_data={
                    "metadata": {"order_id": str(order.id)}},
                expires_at=int(expires.timestamp()),
                success_url=f"{order_url}?paid=1",
                cancel_url=order_url,
            )
        except stripe.StripeError:
            log.exception(
                "stripe.session_failed",
                extra={"order_id": order.id}
            )
            raise CheckoutError(
                "Card payments are temporarily unavailable."
            )
        return Session(
            reference=session.id,
            data={"checkout_url": session.url}
        )

    def cancel(self, reference):
        _configure()
        try:
            stripe.checkout.Session.expire(reference)
        except stripe.StripeError:
            pass  # already completed or expired

    def refund(self, payment):
        _configure()
        if not payment.transaction_id:
            raise CheckoutError(
                "This payment has no Stripe payment intent to refund."
            )
        try:
            stripe.Refund.create(
                payment_intent=payment.transaction_id,
                idempotency_key=f"refund-order-{payment.order_id}",
            )
        except stripe.StripeError:
            log.exception(
                "stripe.refund_failed",
                extra={"order_id": payment.order_id}
                )
            raise CheckoutError(
                "Stripe refused the refund. Check the Stripe dashboard."
            )
        return True

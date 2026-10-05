import logging
from datetime import timedelta

import stripe
from django.conf import settings
from django.utils import timezone
from constance import config

from checkout.exceptions import CheckoutError
from .base import PaymentProvider, payment_deadline
from .registry import register

logger = logging.getLogger("fog")


def _configure():
    stripe.api_key = settings.STRIPE_SECRET_KEY
    stripe.max_network_retries = 2
    stripe.default_http_client = stripe._http_client.RequestsClient(timeout=15)

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

    def initiate(self, order, payment, method):
        _configure()
        # Stripe requires expires_at to be 30 min to 24 h away.
        expires = max(payment_deadline(order), timezone.now() + timedelta(minutes=config.CRYPTO_PAYMENT_WINDOW_MINUTES))
        front = settings.FRONTEND_URL
        order_url = f"{front}/checkout/orders/{order.id}/"
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
                        "product_data": {"name": f"FOG Direct order #{order.id}"},
                    },
                }],
                metadata={"order_id": str(order.id)},
                payment_intent_data={"metadata": {"order_id": str(order.id)}},
                expires_at=int(expires.timestamp()),
                success_url=f"{order_url}?paid=1",
                cancel_url=order_url,
            )
        except stripe.StripeError:
            logger.exception("Stripe session failed for order %s", order.id)
            raise CheckoutError("Card payments are temporarily unavailable.")

        payment.provider_reference = session.id
        payment.provider_data = {"checkout_url": session.url}
        payment.save(update_fields=["provider_reference", "provider_data", "updated_at"])
        return self.instructions(order, payment, method)

    def cancel(self, reference):
        _configure()
        try:
            stripe.checkout.Session.expire(reference)
        except stripe.StripeError:
            pass  # already completed or expired


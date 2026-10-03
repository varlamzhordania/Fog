import logging

import requests
from django.conf import settings

from checkout.exceptions import CheckoutError
from .base import PaymentProvider
from .registry import register

logger = logging.getLogger("fog")


@register
class SHKeeperProvider(PaymentProvider):
    code = "shkeeper"

    def instructions(self, order, payment, method):
        d = payment.provider_data
        asset = d.get("asset", "")
        return {
            "provider": "shkeeper",
            "status": "awaiting_crypto_payment",
            "method": payment.method,
            "reference": f"ORDER-{order.id}",
            "amount": str(payment.amount),
            "currency": "USD",
            "address": d.get("address"),
            "crypto_amount": d.get("crypto_amount"),
            "asset": asset,
            "exchange_rate": d.get("exchange_rate"),
            "message": (
                f"Send exactly {d.get('crypto_amount')} {asset} to the address above, "
                "on the correct network. The order is confirmed automatically once "
                "the network confirms your payment."
            ),
        }

    def initiate(self, order, payment, method):
        asset = (method.asset or "").upper()
        if not asset:
            raise CheckoutError("This crypto method is not configured.")

        url = f"{settings.SHKEEPER_URL.rstrip('/')}/api/v1/{asset}/payment_request"
        body = {
            "external_id": f"FOG-{order.id}",
            "fiat": "USD",
            "amount": str(payment.amount),
            "callback_url": f"{settings.SHKEEPER_CALLBACK_BASE.rstrip('/')}"
                            "/api/v1/checkout/webhooks/shkeeper/",
        }
        try:
            res = requests.post(
                url, json=body, timeout=15,
                headers={"X-Shkeeper-Api-Key": settings.SHKEEPER_API_KEY},
            )
            res.raise_for_status()
            data = res.json()
        except (requests.RequestException, ValueError):
            logger.exception("SHKeeper request failed for order %s", order.id)
            raise CheckoutError("Crypto payments are temporarily unavailable.")

        if data.get("status") != "success" or not data.get("wallet"):
            logger.error("SHKeeper rejected order %s: %s", order.id, data)
            raise CheckoutError("Crypto payments are temporarily unavailable.")

        payment.provider_reference = body["external_id"]
        payment.provider_data = {
            "address": data["wallet"],
            "crypto_amount": str(data.get("amount")),
            "asset": asset,
            "display_name": data.get("display_name"),
            "exchange_rate": str(data.get("exchange_rate")),
        }
        payment.save(update_fields=["provider_reference", "provider_data", "updated_at"])
        return self.instructions(order, payment, method)
    # cancel(): nothing to do, SHKeeper has no "close invoice" call
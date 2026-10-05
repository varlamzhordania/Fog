import hashlib
import hmac
import json
import logging
import time
import uuid

import requests
from django.conf import settings

from checkout.exceptions import CheckoutError
from .base import PaymentProvider, payment_deadline
from .registry import register

logger = logging.getLogger("fog")


def _generate_signature(hmac_key: str, nonce: str, timestamp: str, raw_body: str = "") -> str:
    message = f"{nonce}{timestamp}{raw_body}"
    return hmac.new(
        hmac_key.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def fetch_status(reference: str) -> dict:
    """Public invoice query; reference is sys_no."""
    api_url = getattr(settings, "XCASH_API_URL", "https://pay.xca.sh").rstrip("/")
    url = f"{api_url}/v1/invoice/{reference}"
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    return response.json()


@register
class XcashProvider(PaymentProvider):
    code = "xcash"

    def instructions(self, order, payment, method):
        data = payment.provider_data or {}
        return {
            "provider": "xcash",
            "status": "awaiting_crypto_payment",
            "method": payment.method,
            "reference": f"FOG-{order.id}",
            "amount": str(payment.amount),
            "currency": "USD",
            "checkout_url": data.get("checkout_url"),
            "sys_no": payment.provider_reference,
            "address": data.get("pay_address"),
            "crypto_amount": data.get("pay_amount"),
            "asset": data.get("crypto"),
            "chain": data.get("chain"),
            "message": "Send the exact cryptocurrency amount or open the secure gateway.",
        }

    def initiate(self, order, payment, method):
        api_url = getattr(settings, "XCASH_API_URL", "https://pay.xca.sh").rstrip("/")
        appid = getattr(settings, "XCASH_APPID", "")
        hmac_key = getattr(settings, "XCASH_HMAC_KEY", "")

        if not appid or not hmac_key:
            logger.error("Xcash credentials missing from configuration.")
            raise CheckoutError("Cryptocurrency payments are temporarily unavailable.")

        front = settings.FRONTEND_URL.rstrip("/")
        order_url = f"{front}/checkout/orders/{order.id}/"
        notify_url = getattr(
            settings,
            "XCASH_NOTIFY_URL",
            f"{settings.BACKEND_URL.rstrip('/')}/api/v1/checkout/webhooks/xcash",
        )

        # Enforce server-side payment window
        deadline = payment_deadline(order)
        minutes_remaining = max(5, int((deadline - payment.created_at).total_seconds() / 60))
        duration = min(30, max(5, getattr(settings, "XCASH_INVOICE_DURATION", minutes_remaining)))

        out_no = f"FOG-{order.id}-{payment.id}"
        payload = {
            "out_no": out_no,
            "title": f"FOG Direct Order #{order.id}",
            "currency": "USD",
            "amount": f"{payment.amount:.2f}",
            "duration": duration,
            "notify_url": notify_url,
            "return_url": f"{order_url}?paid=1",
        }

        methods = getattr(settings, "XCASH_METHODS", None)
        if methods:
            payload["methods"] = methods

        raw_body = json.dumps(payload, separators=(",", ":"), ensure_ascii=False)
        timestamp = str(int(time.time()))
        nonce = str(uuid.uuid4())
        signature = _generate_signature(hmac_key, nonce, timestamp, raw_body)

        headers = {
            "XC-Appid": appid,
            "XC-Timestamp": timestamp,
            "XC-Nonce": nonce,
            "XC-Signature": signature,
            "Content-Type": "application/json",
        }

        try:
            res = requests.post(
                f"{api_url}/v1/invoice",
                data=raw_body,
                headers=headers,
                timeout=15,
            )
            res.raise_for_status()
            data = res.json()
        except requests.RequestException:
            logger.exception("Xcash invoice creation failed for order %s", order.id)
            raise CheckoutError("Cryptocurrency payment gateway is temporarily unreachable.")

        sys_no = data.get("sys_no")
        pay_url = data.get("pay_url")

        payment.provider_reference = sys_no
        payment.provider_data = {
            "checkout_url": pay_url,
            "out_no": out_no,
            "pay_address": data.get("pay_address"),
            "pay_amount": data.get("pay_amount"),
            "crypto": data.get("crypto"),
            "chain": data.get("chain"),
            "status": data.get("status", "waiting"),
        }
        payment.save(update_fields=["provider_reference", "provider_data", "updated_at"])
        return self.instructions(order, payment, method)

    def cancel(self, reference):
        pass
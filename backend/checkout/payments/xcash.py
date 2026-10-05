import hashlib
import hmac
import json
import logging
import re
import secrets
import time
import uuid

import requests
from django.conf import settings
from constance import config
from django.utils import timezone

from checkout.exceptions import CheckoutError
from .base import PaymentProvider, payment_deadline
from .registry import register

logger = logging.getLogger("fog")

MIN_DURATION = 5
MAX_DURATION = 30

_ASSET_RE = re.compile(r"^(?P<crypto>[A-Za-z0-9]{2,12})@(?P<chain>[a-z0-9-]{2,30})$")

_UNAVAILABLE = (
    "This token or network is not available right now. "
    "Please choose another payment method."
)
_GENERIC = "Cryptocurrency payments are temporarily unavailable."
_USER_ERRORS = {
    "2000": _UNAVAILABLE,
    "2001": _UNAVAILABLE,
    "2002": _UNAVAILABLE,
    "5008": _UNAVAILABLE,
    "5009": "Too many unpaid crypto invoices are open. Please try again in a few minutes.",
}


# ----------------------------------------------------------------------
# Helpers shared with the webhook / reconciliation code
# ----------------------------------------------------------------------

def sign(hmac_key: str, nonce: str, timestamp: str, raw_body: str = "") -> str:
    """HMAC-SHA256(nonce + timestamp + body), lowercase hex (same for API calls and webhooks)."""
    return hmac.new(
        hmac_key.encode("utf-8"),
        f"{nonce}{timestamp}{raw_body}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def _api_url() -> str:
    return getattr(settings, "XCASH_API_URL", "https://pay.xca.sh").rstrip("/")


def parse_asset(asset: str):
    """'USDT@ethereum' -> ('USDT', 'ethereum'); anything else -> (None, None)."""
    match = _ASSET_RE.match((asset or "").strip())
    if not match:
        return None, None
    return match["crypto"].upper(), match["chain"].lower()


def fetch_status(reference: str) -> dict:
    """Public invoice query (no signature). `reference` is the Xcash sys_no."""
    response = requests.get(f"{_api_url()}/v1/invoice/{reference}", timeout=10)
    response.raise_for_status()
    return response.json()


def status_data(data: dict) -> dict:
    """Normalise an invoice query response into what we keep in payment.provider_data."""
    payment = data.get("payment") or {}
    pay_amount = data.get("pay_amount")
    values = {
        "xcash_status": data.get("status"),
        "sys_no": data.get("sys_no"),
        "crypto": data.get("crypto"),
        "chain": data.get("chain"),
        "pay_address": data.get("pay_address"),
        "pay_amount": None if pay_amount in (None, "") else str(pay_amount),
        "payment_uri": data.get("payment_uri"),
        "expires_at": data.get("expires_at"),
        "hash": payment.get("hash"),
        "confirm_progress": payment.get("confirm_progress"),
        "risk_level": data.get("risk_level"),
        "risk_score": data.get("risk_score"),
    }
    return {key: value for key, value in values.items() if value is not None}


def _contract_chains() -> set:
    raw = getattr(settings, "XCASH_CONTRACT_CHAINS", "") or ""
    if isinstance(raw, str):
        raw = raw.split(",")
    return {str(c).strip().lower() for c in raw if str(c).strip()}


def _invoice_minutes(order) -> int:
    """Invoice lifetime: never longer than the order's own payment window."""
    remaining = int((payment_deadline(order) - timezone.now()).total_seconds() // 60)
    configured = int(config.CRYPTO_PAYMENT_WINDOW_MINUTES)
    return max(MIN_DURATION, min(MAX_DURATION, configured, remaining))


def _create_invoice(payload: dict) -> dict:
    appid = getattr(settings, "XCASH_APPID", "")
    hmac_key = getattr(settings, "XCASH_HMAC_KEY", "")
    if not appid or not hmac_key:
        logger.error("Xcash credentials missing from configuration.")
        raise CheckoutError(_GENERIC)

    raw_body = json.dumps(payload, separators=(",", ":"), ensure_ascii=False)
    timestamp = str(int(time.time()))
    nonce = str(uuid.uuid4())
    headers = {
        "XC-Appid": appid,
        "XC-Timestamp": timestamp,
        "XC-Nonce": nonce,
        "XC-Signature": sign(hmac_key, nonce, timestamp, raw_body),
        "Content-Type": "application/json",
    }

    try:
        res = requests.post(
            f"{_api_url()}/v1/invoice",
            data=raw_body.encode("utf-8"),  # must be byte-identical to what was signed
            headers=headers,
            timeout=15,
        )
    except requests.RequestException:
        logger.exception("Xcash is unreachable (out_no=%s)", payload.get("out_no"))
        raise CheckoutError("The cryptocurrency payment gateway is temporarily unreachable.")

    if not res.ok:
        code = ""
        try:
            code = str(res.json().get("code", ""))
        except ValueError:
            pass
        # Details go to the log, never to the customer.
        logger.error(
            "Xcash rejected invoice %s: HTTP %s code=%s body=%s",
            payload.get("out_no"), res.status_code, code, res.text[:500],
        )
        raise CheckoutError(_USER_ERRORS.get(code, _GENERIC))

    try:
        return res.json()
    except ValueError:
        logger.error("Xcash returned a non-JSON response for %s", payload.get("out_no"))
        raise CheckoutError(_GENERIC)


@register
class XcashProvider(PaymentProvider):
    code = "xcash"

    # Pure: built only from stored data, safe to call on every fetch.
    def instructions(self, order, payment, method):
        data = payment.provider_data or {}
        chain = data.get("chain")
        if not chain:
            settlement = None
        elif str(chain).lower() in _contract_chains():
            settlement = "smart_contract"
        else:
            settlement = "direct"

        has_address = bool(data.get("pay_address"))
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
            "chain": chain,
            "payment_uri": data.get("payment_uri"),
            "invoice_expires_at": data.get("expires_at"),
            "invoice_status": data.get("xcash_status"),
            "tx_hash": data.get("hash"),
            "confirm_progress": data.get("confirm_progress"),
            "settlement": settlement,
            "message": (
                "Send the exact amount shown to the address below, on the network shown."
                if has_address
                else "Open the secure gateway to choose your coin and network. "
                     "This page updates automatically once your payment is confirmed."
            ),
        }

    def initiate(self, order, payment, method):
        crypto, chain = parse_asset(getattr(method, "asset", ""))
        methods = {crypto: [chain]} if crypto else getattr(settings, "XCASH_METHODS", None)

        front = settings.FRONTEND_URL.rstrip("/")
        order_url = f"{front}/checkout/orders/{order.id}/"

        # Xcash requires out_no to be unique per project. A random suffix keeps
        # retries, method switches and invoice refreshes from hitting error 1007.
        out_no = f"FOG-{order.id}-{payment.id}-{secrets.token_hex(3)}"

        payload = {
            "out_no": out_no,
            "title": f"FOG Direct Order #{order.id}"[:32],
            "currency": "USD",
            "amount": f"{payment.amount:.2f}",
            "duration": _invoice_minutes(order),
            "notify_url": settings.XCASH_NOTIFY_URL,
            "return_url": f"{order_url}?paid=1",
        }
        if methods:
            payload["methods"] = methods

        created = _create_invoice(payload)
        sys_no = created.get("sys_no")
        if not sys_no:
            logger.error("Xcash response for %s has no sys_no: %s", out_no, created)
            raise CheckoutError(_GENERIC)

        # With a single token/chain Xcash picks it for us; the public query adds
        # the EIP-681 payment_uri (wallet-scannable, amount + token prefilled).
        merged = dict(created)
        if crypto:
            try:
                fetched = fetch_status(sys_no)
                merged.update({k: v for k, v in fetched.items() if v is not None})
            except Exception:
                logger.warning("Could not enrich Xcash invoice %s", sys_no, exc_info=True)

        payment.provider_reference = sys_no
        payment.provider_data = {
            "checkout_url": created.get("pay_url"),
            "out_no": out_no,
            **status_data(merged),
        }
        payment.provider_data.setdefault("xcash_status", "waiting")
        payment.save(update_fields=["provider_reference", "provider_data", "updated_at"])
        return self.instructions(order, payment, method)

    def cancel(self, reference):
        """Xcash has no cancel call: unpaid invoices simply expire."""
        return None
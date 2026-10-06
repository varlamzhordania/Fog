import time
import hmac
import json
import logging

import stripe
from django.conf import settings
from django.core.cache import cache
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from constance import config

from checkout.models import OrderPayment
from checkout.payments.xcash import sign as xcash_sign
from checkout.services.order import OrderService
from checkout import events

logger = logging.getLogger("fog")

XCASH_NONCE_TTL = 15 * 60  # longer than the 300s timestamp window


@csrf_exempt
@require_POST
def stripe_webhook(request):
    try:
        event = stripe.Webhook.construct_event(
            request.body,
            request.META.get("HTTP_STRIPE_SIGNATURE", ""),
            config.STRIPE_WEBHOOK_KEY,
        )
    except (ValueError, stripe.SignatureVerificationError):
        return HttpResponse(status=400)

    if event["type"] in ("checkout.session.completed",
                         "checkout.session.async_payment_succeeded"):
        session = event["data"]["object"].to_dict()
        if session.get("payment_status") == "paid":
            order_id = int(
                (session.get("metadata") or {}).get("order_id", 0)
            )
            payment = OrderPayment.objects.filter(
                order_id=order_id
            ).first()
            if not payment:
                logger.error(
                    "Stripe paid session for unknown order %s",
                    order_id
                )
            elif session.get("amount_total") != int(payment.amount * 100):
                logger.error(
                    "Stripe amount mismatch on order %s",
                    order_id
                )
                events.order_event(
                    order_id, "payment_mismatch", extra={
                        "expected_cents": int(payment.amount * 100),
                        "received_cents": session.get("amount_total"),
                    }
                )
            else:
                OrderService.settle_payment(
                    order_id,
                    transaction_id=session.get("payment_intent"),
                    data={"stripe_session": session.get("id")},
                )
    return HttpResponse(status=200)


@csrf_exempt
@require_POST
def shkeeper_webhook(request):
    key = request.headers.get("X-Shkeeper-Api-Key", "")
    expected = settings.SHKEEPER_API_KEY
    if not expected or not hmac.compare_digest(
            key.encode(),
            expected.encode()
    ):
        return HttpResponse(status=403)

    try:
        payload = json.loads(request.body)
        order_id = int(str(payload["external_id"]).removeprefix("FOG-"))
    except (ValueError, KeyError):
        logger.error("Malformed SHKeeper callback")
        return HttpResponse(status=202)  # never retry garbage

    txs = payload.get("transactions") or []
    data = {
        "shkeeper_status": payload.get("status"),
        "balance_fiat": str(payload.get("balance_fiat")),
        "balance_crypto": str(payload.get("balance_crypto")),
        "overpaid_fiat": str(payload.get("overpaid_fiat")),
        "transactions": txs,
    }
    if payload.get("paid"):
        OrderService.settle_payment(
            order_id,
            transaction_id=(txs[0].get("txid") if txs else None),
            data=data
        )
    else:
        OrderService.update_provider_data(
            order_id,
            data
        )  # partial payment etc.
    return HttpResponse(status=202)  # SHKeeper retries until it gets 202


def _xcash_ok():
    # Xcash needs HTTP 200 with the body "ok". Anything else 2xx/3xx/4xx is
    # treated as final (not retried); only 5xx and network errors are retried.
    return HttpResponse("ok", content_type="text/plain", status=200)


@csrf_exempt
@require_POST
def xcash_webhook(request):
    appid = request.headers.get("XC-Appid", "")
    timestamp = request.headers.get("XC-Timestamp", "")
    nonce = request.headers.get("XC-Nonce", "")
    signature = request.headers.get("XC-Signature", "")

    expected_appid = getattr(config, "XCASH_APPID", "")
    secret_key = getattr(config, "XCASH_HMAC_KEY", "")

    if not expected_appid or not secret_key:
        logger.error("Xcash webhook received but server credentials are not configured.")
        return HttpResponse(status=403)

    if not all([appid, timestamp, nonce, signature]):
        return HttpResponse(status=403)

    if not hmac.compare_digest(appid.encode(), expected_appid.encode()):
        return HttpResponse(status=403)

    try:
        if abs(time.time() - int(timestamp)) > 300:
            return HttpResponse(status=403)
    except (ValueError, TypeError):
        return HttpResponse(status=403)

    try:
        raw_body = request.body.decode("utf-8")
    except UnicodeDecodeError:
        return HttpResponse(status=403)

    expected_sig = xcash_sign(secret_key, nonce, timestamp, raw_body)
    if not hmac.compare_digest(expected_sig.lower().encode(), signature.lower().encode()):
        return HttpResponse(status=403)

    # --- authenticated from here on ------------------------------------
    # The docs ask merchants to handle the same XC-Nonce idempotently. The key is
    # released again if processing fails so Xcash's 5xx retry can succeed.
    nonce_key = f"xcash:nonce:{appid}:{nonce}"
    if not cache.add(nonce_key, 1, XCASH_NONCE_TTL):
        return _xcash_ok()

    try:
        try:
            payload = json.loads(raw_body)
            event_type = payload.get("type")
            data = payload.get("data") or {}
        except (ValueError, AttributeError):
            logger.error("Malformed Xcash callback payload")
            return _xcash_ok()

        if event_type != "invoice":
            return _xcash_ok()

        out_no = str(data.get("out_no", ""))
        try:
            # Format: FOG-{order_id}-{payment_id}-{suffix}
            order_id = int(out_no.split("-")[1])
        except (IndexError, ValueError):
            logger.error("Malformed out_no in Xcash callback: %s", out_no)
            return _xcash_ok()

        payment = OrderPayment.objects.filter(order_id=order_id).first()
        if not payment:
            logger.error("Xcash callback for unknown order %s", order_id)
            return _xcash_ok()

        if payment.provider != "xcash":
            # The customer switched to another provider; the stray invoice is
            # logged for staff instead of settling the order with a mismatch.
            logger.error(
                "Xcash callback for order %s, but its payment provider is %s",
                order_id, payment.provider,
            )
            return _xcash_ok()

        if data.get("sys_no") != payment.provider_reference:
            # Paid an older invoice of the same order (e.g. before refreshing it).
            # The money is real and the amount is the same, so we still settle.
            logger.warning(
                "Xcash invoice %s paid for order %s, current invoice is %s",
                data.get("sys_no"), order_id, payment.provider_reference,
            )

        tx_hash = data.get("hash")
        confirmed = bool(data.get("confirmed", False))
        provider_data = {
            "xcash_status": "completed" if confirmed else "waiting",
            "sys_no": data.get("sys_no"),
            "crypto": data.get("crypto"),
            "chain": data.get("chain"),
            "pay_address": data.get("pay_address"),
            "pay_amount": str(data.get("pay_amount", "")),
            "block": data.get("block"),
            "hash": tx_hash,
            "confirmed": confirmed,
            # Risk scoring is asynchronous, so these can still be null here.
            "risk_level": data.get("risk_level"),
            "risk_score": data.get("risk_score"),
        }

        if confirmed:
            OrderService.settle_payment(order_id, transaction_id=tx_hash, data=provider_data)
        else:
            OrderService.update_provider_data(order_id, provider_data)
    except Exception:
        cache.delete(nonce_key)
        logger.exception("Xcash webhook processing failed")
        return HttpResponse(status=500)  # 5xx -> Xcash retries with backoff

    return _xcash_ok()
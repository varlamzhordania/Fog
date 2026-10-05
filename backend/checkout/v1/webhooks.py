import hashlib
import time
import hmac
import json
import logging

import stripe
from django.conf import settings
from django.http import (
    HttpResponse, HttpResponseBadRequest,
    HttpResponseForbidden,
)
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from checkout.models import OrderPayment
from checkout.services.order import OrderService
from checkout import events

logger = logging.getLogger("fog")


@csrf_exempt
@require_POST
def stripe_webhook(request):
    try:
        event = stripe.Webhook.construct_event(
            request.body,
            request.META.get("HTTP_STRIPE_SIGNATURE", ""),
            settings.STRIPE_WEBHOOK_KEY,
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


@csrf_exempt
@require_POST
def xcash_webhook(request):
    appid = request.headers.get("XC-Appid", "")
    timestamp = request.headers.get("XC-Timestamp", "")
    nonce = request.headers.get("XC-Nonce", "")
    signature = request.headers.get("XC-Signature", "")

    expected_appid = getattr(settings, "XCASH_APPID", "")
    secret_key = getattr(settings, "XCASH_HMAC_KEY", "")

    if not expected_appid or not secret_key:
        logger.error("Xcash webhook received but server credentials unconfigured.")
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

    raw_body_str = request.body.decode("utf-8")
    message = f"{nonce}{timestamp}{raw_body_str}"
    expected_sig = hmac.new(
        secret_key.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected_sig.lower().encode(), signature.lower().encode()):
        return HttpResponse(status=403)

    try:
        payload = json.loads(request.body)
        event_type = payload.get("type")
        data = payload.get("data") or {}
    except (ValueError, KeyError):
        logger.error("Malformed Xcash callback payload")
        return HttpResponse("ok", content_type="text/plain", status=200)

    if event_type != "invoice":
        return HttpResponse("ok", content_type="text/plain", status=200)

    out_no = str(data.get("out_no", ""))
    try:
        # Format: FOG-{order_id}-{payment_id}
        parts = out_no.split("-")
        order_id = int(parts[1])
    except (IndexError, ValueError):
        logger.error("Malformed out_no in Xcash callback: %s", out_no)
        return HttpResponse("ok", content_type="text/plain", status=200)

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
        "risk_level": data.get("risk_level"),
        "risk_score": data.get("risk_score"),
    }

    if confirmed:
        OrderService.settle_payment(
            order_id,
            transaction_id=tx_hash,
            data=provider_data,
        )
    else:
        OrderService.update_provider_data(
            order_id,
            provider_data,
        )

    # Xcash requires HTTP 200 with text 'ok'
    return HttpResponse("ok", content_type="text/plain", status=200)
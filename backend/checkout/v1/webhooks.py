import hmac
import json
import logging

import stripe
from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from checkout.models import OrderPayment
from checkout.services.order import OrderService

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
            order_id = int((session.get("metadata") or {}).get("order_id", 0))
            payment = OrderPayment.objects.filter(order_id=order_id).first()
            if not payment:
                logger.error("Stripe paid session for unknown order %s", order_id)
            elif session.get("amount_total") != int(payment.amount * 100):
                logger.error("Stripe amount mismatch on order %s", order_id)  # needs staff
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
    if not expected or not hmac.compare_digest(key.encode(), expected.encode()):
        return HttpResponse(status=403)

    try:
        payload = json.loads(request.body)
        order_id = int(str(payload["external_id"]).removeprefix("FOG-"))
    except (ValueError, KeyError):
        logger.error("Malformed SHKeeper callback")
        return HttpResponse(status=202)      # never retry garbage

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
            order_id, transaction_id=(txs[0].get("txid") if txs else None), data=data
        )
    else:
        OrderService.update_provider_data(order_id, data)   # partial payment etc.
    return HttpResponse(status=202)   # SHKeeper retries until it gets 202
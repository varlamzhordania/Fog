from constance import config
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import EmailMultiAlternatives
from django.db import transaction
from django.template.loader import render_to_string
from django.urls import reverse
from django.utils import timezone

from core.logging import get_logger
from core.branding import APP_NAME
from checkout.models import Order, OrderNotification as N

log = get_logger(__name__)

CUSTOMER, ADMIN = N.Audience.CUSTOMER, N.Audience.ADMIN

SPEC = {
    "order_created": {
        CUSTOMER: ("Order #{id} received", "We received your order",
                   "Your order is reserved. Complete payment before the timer on the order page "
                   "runs out, otherwise it is released automatically."),
        ADMIN: ("New order #{id}", "New order placed",
                "Waiting for payment."),
    },
    "payment_reminder": {
        CUSTOMER: ("Order #{id}: payment window closing",
                   "Your payment window is closing",
                   "Your order will be released soon if payment isn't completed."),
    },
    "payment_received": {
        CUSTOMER: ("Payment received for order #{id}", "Payment received",
                   "Thank you. We're preparing your order and will email you when it ships."),
        ADMIN: ("Paid order #{id} to review", "Paid order to review",
                "Payment confirmed. Review it and start processing."),
    },
    "order_processing": {
        CUSTOMER: ("Order #{id} is being prepared",
                   "We're preparing your order",
                   "Your order is being packed."),
    },
    "order_shipped": {
        CUSTOMER: ("Order #{id} has shipped", "Your order is on its way",
                   "Your order has been handed to the carrier."),
    },
    "order_delivered": {
        CUSTOMER: ("Order #{id} delivered", "Delivered",
                   "Your order is marked as delivered."),
    },
    "order_expired": {
        CUSTOMER: ("Order #{id} was released", "Your order was released",
                   "The payment window ended before payment was received, so the order was "
                   "cancelled and the items released. If you already paid, contact support."),
    },
    "order_cancelled": {
        CUSTOMER: ("Order #{id} cancelled", "Your order was cancelled",
                   "This order has been cancelled."),
    },
    "order_refunded": {
        CUSTOMER: ("Order #{id} refunded", "Your order was refunded",
                   "The order was cancelled before dispatch and refunded."),
        ADMIN: ("Order #{id} refunded", "Order refunded",
                "A paid order was refunded and restocked."),
    },
    "late_payment": {
        ADMIN: ("ACTION: late payment on order #{id}",
                "Payment arrived after the order closed",
                "The stock was already released. Refund the customer or re-open the order manually."),
    },
    "payment_mismatch": {
        ADMIN: ("ACTION: payment amount mismatch on order #{id}",
                "Payment amount mismatch",
                "The gateway reported a paid session whose amount differs from the order. "
                "The order was NOT confirmed."),
    },
}


class EmailDeliveryError(Exception):
    pass


def admin_emails():
    raw = getattr(config, "ORDER_ADMIN_EMAILS", "") or ""
    configured = [e.strip() for e in raw.replace(";", ",").split(",") if
                  e.strip()]
    if configured:
        return configured
    User = get_user_model()
    return list(
        User.objects.filter(
            is_active=True,
            is_staff=True,
            groups__name__in=["admin", "support"]
        )
        .values_list("email", flat=True).distinct()
    )


def _money(value):
    return f"${float(value):,.2f}"


def _order_context(order, audience, extra):
    payment = getattr(order, "payment", None)
    shipment = getattr(order, "shipment", None)

    rows = [("Order", f"#{order.id}"),
            ("Total", _money(order.total_price))]
    if payment:
        rows.append(
            ("Payment",
             f"{payment.method} ({payment.get_status_display()})")
        )
    if shipment and shipment.tracking_number:
        rows.append(
            ("Tracking",
             f"{shipment.carrier or ''} {shipment.tracking_number}".strip())
        )

    if audience == ADMIN:
        rows.append(("Customer", order.user.email))
        if payment:
            rows.append(
                ("Gateway",
                 f"{payment.provider} {payment.provider_reference}".strip())
            )
        for key, value in (extra or {}).items():
            rows.append((key.replace("_", " ").capitalize(), value))
        url = f"{settings.ADMIN_BASE_URL}{reverse('admin:checkout_order_change', args=[order.id])}"
        label = "Open in admin"
    else:
        url = f"{settings.FRONTEND_URL}/checkout/orders/{order.id}/"
        label = "View order"

    items = [
        (i.product.name if i.product else "Removed product", i.quantity,
         _money(i.total_price))
        for i in order.items.all()
    ]
    return {"rows": rows, "items": items, "cta_url": url,
            "cta_label": label}


def _build(
        subject,
        headline,
        intro,
        rows=(),
        items=(),
        cta_url=None,
        cta_label=None
):
    ctx = {"app_name": APP_NAME, "headline": headline, "intro": intro,
           "rows": list(rows),
           "items": list(items), "cta_url": cta_url,
           "cta_label": cta_label}
    html = render_to_string("emails/message.html", ctx)
    text = "\n".join(
        [
            headline, "", intro, "",
            *[f"{k}: {v}" for k, v in ctx["rows"]],
            *[f"- {n} x{q}  {t}" for n, q, t in ctx["items"]],
            *([f"\n{cta_label}: {cta_url}"] if cta_url else []),
        ]
    )
    return subject, text, html


def _deliver(subject, text, html, to):
    msg = EmailMultiAlternatives(
        subject,
        text,
        settings.DEFAULT_FROM_EMAIL,
        to
    )
    msg.attach_alternative(html, "text/html")
    msg.send()


def send(order_id, event, audience, extra=None):
    order = (Order.objects.select_related("user", "payment", "shipment")
             .prefetch_related("items__product").get(pk=order_id))
    subject_t, headline, intro = SPEC[event][audience]

    with transaction.atomic():
        log, _ = N.objects.select_for_update().get_or_create(
            order=order, event=event, audience=audience
        )
        if log.status in (N.Status.SENT, N.Status.SKIPPED):
            return "duplicate"

        if audience == CUSTOMER:
            to = [order.user.email] if getattr(
                config,
                "NOTIFY_CUSTOMERS",
                True
            ) else []
        else:
            to = admin_emails()
        if not to:
            log.status = N.Status.SKIPPED
            log.save(update_fields=["status", "updated_at"])
            return "skipped"

        subject, text, html = _build(
            subject_t.format(id=order.id),
            headline,
            intro,
            **_order_context(order, audience, extra)
        )
        error = ""
        try:
            _deliver(subject, text, html, to)
        except Exception as exc:
            error = str(exc)[:500]
            log.exception(
                "email.send_failed",
                extra={"order_id": order_id, "event": event,
                       "audience": audience}
            )

        log.recipients, log.subject, log.error = ", ".join(
            to
        ), subject, error
        log.status = N.Status.FAILED if error else N.Status.SENT
        log.sent_at = None if error else timezone.now()
        log.save()

    if error:
        raise EmailDeliveryError(
            error
        )  # outside the atomic block, so the log row is kept
    return "sent"


def send_admin_message(
        subject,
        headline,
        intro,
        rows=(),
        items=(),
        url=None,
        label=None
):
    to = admin_emails()
    if to:
        _deliver(
            *_build(subject, headline, intro, rows, items, url, label),
            to
        )

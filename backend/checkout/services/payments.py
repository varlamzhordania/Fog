from django.db import transaction
from django.db.models import F
from django.shortcuts import get_object_or_404

from checkout import events
from checkout.exceptions import CheckoutError, Conflict, GatewayError
from checkout.models import Order, OrderPayment, OrderShipment, PaymentMethod
from checkout.payments import get_provider
from checkout.services import attempts
from checkout.services._common import (
    ACTIVE, P, S, append_note, cancel_remote, check_minimum, get_method, lock_order,
)
from checkout.services.orders import OrderService
from core.logging import get_logger
from core.logging.audit import audit, audit_on_commit
from inventory.models import ProductStock, StockTransactionLog

log = get_logger(__name__)
_EXPIRED = "The payment window expired and the order was cancelled."


class PaymentService:
    """Everything that talks to a gateway or changes payment state."""

    # ── Reads ─────────────────────────────────────────────────────────
    @staticmethod
    def instructions(order):
        payment = getattr(order, "payment", None)
        if order.status != S.PAYMENT or not payment or payment.status != P.PENDING:
            return None
        method = (
            PaymentMethod.objects.filter(code=payment.method_code).first()
            or PaymentMethod.objects.filter(name=payment.method).first()
        )
        return get_provider(payment.provider).instructions(order, payment, method)

    # ── Start / switch ────────────────────────────────────────────────
    @classmethod
    def start(cls, order_id, method):
        """
        Open a gateway session for the order's payment and attach it.
        The gateway is called with no DB locks held; state is re-checked under
        the lock before the session is saved, so a payment or expiry that
        happened in the meantime wins and the new session is cancelled.
        """
        order = Order.objects.select_related("payment", "user").get(pk=order_id)
        payment = order.payment
        expected_reference = payment.provider_reference

        try:
            session = cls._create_session(order, payment, method)
        except GatewayError as exc:
            attempts.record_failure(payment, method, str(exc.detail))
            log.warning("payment.gateway_failed",
                        extra={"order_id": order_id, "provider": method.provider})
            raise

        try:
            cls._attach(order_id, method, session, expected_reference)
        except Exception:
            cancel_remote(method.provider, session.reference)
            raise

        audit("payment.session_created", order_id=order_id,
              provider=method.provider, method=method.code)
        fresh = Order.objects.select_related("payment").get(pk=order_id)
        return fresh, cls.instructions(fresh)

    @classmethod
    def start_payment(cls, order_id, user, payment_method_code):
        """(Re)start payment while the window is open, e.g. switching coin or provider."""
        order = get_object_or_404(Order, pk=order_id, user=user)
        if OrderService.expire_if_needed(order.pk):
            raise CheckoutError(_EXPIRED)
        method = get_method(payment_method_code)
        if order.status != S.PAYMENT:
            raise CheckoutError("This order is not awaiting payment.")
        check_minimum(method, order.total_price)
        return cls.start(order.pk, method)

    @staticmethod
    def _create_session(order, payment, method):
        try:
            return get_provider(method.provider).create_session(order, payment, method)
        except CheckoutError as exc:
            raise GatewayError(exc.detail)

    @classmethod
    @transaction.atomic
    def _attach(cls, order_id, method, session, expected_reference):
        order = lock_order(order_id)
        payment = order.payment
        if order.status != S.PAYMENT:
            raise Conflict("This order is no longer awaiting payment.")
        if payment.provider_reference != expected_reference:
            raise Conflict("The payment was changed by another request. Please try again.")

        old_provider, old_reference = payment.provider, payment.provider_reference
        attempts.close(payment, attempts.S.SUPERSEDED)

        payment.method, payment.method_code = method.name, method.code
        payment.provider = method.provider
        payment.provider_reference = session.reference
        payment.provider_data = dict(session.data)
        payment.status = P.PENDING
        payment.save(update_fields=[
            "method", "method_code", "provider", "provider_reference",
            "provider_data", "status", "updated_at",
        ])
        attempts.started(attempts.begin(payment, method), payment)

        if old_reference:  # the superseded session must not stay payable
            transaction.on_commit(lambda: cancel_remote(old_provider, old_reference))

    # ── Confirm / settle ──────────────────────────────────────────────
    @classmethod
    def confirm_payment(cls, order_id, transaction_id=None):
        if OrderService.expire_if_needed(order_id):
            raise CheckoutError(_EXPIRED)

        with transaction.atomic():
            order = lock_order(order_id)
            if order.status != S.PAYMENT:
                raise CheckoutError("This order is not awaiting payment.")
            for reservation in order.stock_reservations.filter(status=ACTIVE):
                reservation.commit()
            order.payment.mark_completed(transaction_id)
            attempts.close(order.payment, attempts.S.SUCCEEDED, transaction_id=transaction_id)
            OrderShipment.objects.get_or_create(order=order)
            order.status = S.PENDING
            order.save(update_fields=["status", "updated_at"])
            events.order_event(order.id, "payment_received")
            events.order_paid(order.id)
            audit_on_commit("order.paid", order_id=order.id, transaction_id=transaction_id,
                            provider=order.payment.provider)
        return order

    @classmethod
    def settle_payment(cls, order_id, transaction_id=None, data=None):
        """Idempotent. Returns 'confirmed' | 'duplicate' | 'late' | 'unknown'."""
        order = Order.objects.select_related("payment").filter(pk=order_id).first()
        payment = getattr(order, "payment", None) if order else None
        if not payment:
            log.error("payment.unknown_order", extra={"order_id": order_id})
            return "unknown"
        if payment.status == P.COMPLETED:
            return "duplicate"
        if data:
            payment.provider_data = {**payment.provider_data, **data}
            payment.save(update_fields=["provider_data", "updated_at"])
        try:
            cls.confirm_payment(order_id, transaction_id)
        except CheckoutError:
            return cls.record_late_payment(order_id, transaction_id)
        return "confirmed"

    @classmethod
    @transaction.atomic
    def record_late_payment(cls, order_id, transaction_id=None):
        """Money arrived for an order that is already cancelled/expired: flag for staff."""
        order = lock_order(order_id)
        payment = order.payment
        if payment.status == P.COMPLETED:
            return "duplicate"  # lost a race with a parallel webhook
        if payment.provider_data.get("late_payment"):
            return "late"
        payment.provider_data = {
            **payment.provider_data, "late_payment": True, "late_transaction_id": transaction_id,
        }
        payment.save(update_fields=["provider_data", "updated_at"])
        attempts.mark_late(payment, transaction_id)
        append_note(
            order,
            f"LATE PAYMENT received ({transaction_id or 'no tx id'}) "
            "after the order was closed. Refund or re-open manually.",
        )
        order.save(update_fields=["notes", "updated_at"])
        events.order_event(order_id, "late_payment", extra={"transaction_id": transaction_id})
        audit_on_commit("payment.late", order_id=order_id, transaction_id=transaction_id)
        return "late"

    @classmethod
    def update_provider_data(cls, order_id, data):
        payment = OrderPayment.objects.filter(order_id=order_id).first()
        if payment:
            payment.provider_data = {**payment.provider_data, **data}
            payment.save(update_fields=["provider_data", "updated_at"])
            attempts.sync_data(payment, data)

    # ── Refund ────────────────────────────────────────────────────────
    @staticmethod
    def _assert_refundable(order):
        payment = getattr(order, "payment", None)
        if order.status not in (S.PENDING, S.PROCESSING) or not payment or payment.status != P.COMPLETED:
            raise CheckoutError("Only paid orders that have not shipped can be refunded.")

    @classmethod
    def refund_order(cls, order_id, performed_by=None):
        """Refund a paid order before dispatch and return the units to stock."""
        order = get_object_or_404(Order.objects.select_related("payment"), pk=order_id)
        cls._assert_refundable(order)
        # Gateway first, with no DB lock held. The idempotency key makes a retry safe.
        automatic = get_provider(order.payment.provider).refund(order.payment)

        try:
            with transaction.atomic():
                order = lock_order(order_id)
                cls._assert_refundable(order)
                cls._restock(order, performed_by)
                payment = order.payment
                payment.status = P.REFUNDED
                payment.save(update_fields=["status", "updated_at"])
                order.status = S.CANCELLED
                append_note(order, "Refunded before dispatch.")
                if not automatic:
                    append_note(order, "ACTION: refund the customer manually (provider has no refund API).")
                order.save(update_fields=["status", "notes", "updated_at"])
                attempts.mark_refunded(payment)
                events.order_event(order.id, "order_refunded")
        except Exception:
            if automatic:  # money moved but our state didn't: staff must reconcile
                log.critical("payment.refund_orphaned", extra={"order_id": order_id}, exc_info=True)
            raise

        audit("order.refunded", order_id=order_id, automatic=automatic,
              by=getattr(performed_by, "pk", None))
        return order

    @staticmethod
    def _restock(order, performed_by):
        for item in order.items.all():
            stock = ProductStock.objects.filter(product_id=item.product_id).first()
            if not stock:
                continue
            ProductStock.objects.filter(pk=stock.pk).update(quantity=F("quantity") + item.quantity)
            StockTransactionLog.objects.create(
                product_stock=stock,
                action=StockTransactionLog.ActionChoices.RESTOCK,
                quantity=item.quantity, performed_by=performed_by,
                note=f"Order #{order.id} refunded before dispatch: units returned to stock.",
            )
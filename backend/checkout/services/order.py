import logging
from datetime import timedelta
from decimal import Decimal

from constance import config
from django.db import transaction
from django.db.models import F
from django.shortcuts import get_object_or_404
from django.utils import timezone

from account.models import Address
from checkout.exceptions import CheckoutError
from checkout.models import (
    Order, OrderItem, OrderPayment, OrderShipment, PaymentMethod,
)
from checkout.payments import get_provider
from checkout.services.cart import CartService

from inventory.models import (
    ProductStock, StockReservation, StockTransactionLog,
)

logger = logging.getLogger("fog")

S = Order.StatusChoices
P = OrderPayment.StatusChoices
ACTIVE = StockReservation.ReservationStatus.ACTIVE
EXPIRED_REASON = "Payment window expired."


def _window_minutes():
    return int(getattr(config, "CRYPTO_PAYMENT_WINDOW_MINUTES", 60) or 60)


def _lock(order_id):
    return get_object_or_404(
        Order.objects.select_for_update(),
        pk=order_id
    )


def _cancel_remote(provider_code, reference):
    if not reference:
        return
    try:
        get_provider(provider_code).cancel(reference)
    except Exception:
        logger.exception(
            "Remote cancel failed (%s %s)",
            provider_code,
            reference
        )


def _append_note(order, text):
    order.notes = f"{order.notes}\n{text}".strip() if order.notes else text


class OrderService:
    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    @staticmethod
    def _get_method(code):
        method = PaymentMethod.objects.filter(
            code=code,
            is_active=True
        ).first()
        if not method:
            raise CheckoutError("This payment method is not available.")
        return method

    @staticmethod
    def _check_min(method, total):
        if total < method.min_amount:
            raise CheckoutError(
                f"{method.name} requires a minimum order of ${method.min_amount}."
            )

    @staticmethod
    def expires_at(order):
        """Payment deadline. Uses prefetched reservations when available."""
        if order.status != S.PAYMENT:
            return None
        times = [
            r.expires_at for r in order.stock_reservations.all()
            if r.status == ACTIVE
        ]
        return max(times) if times else None

    @staticmethod
    def payment_instructions(order):
        payment = getattr(order, "payment", None)
        if order.status != S.PAYMENT or not payment or payment.status != P.PENDING:
            return None
        method = (PaymentMethod.objects.filter(
            code=payment.method_code
        ).first() or PaymentMethod.objects.filter(
            name=payment.method
        ).first())
        return get_provider(payment.provider).instructions(
            order,
            payment,
            method
        )

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------
    @classmethod
    @transaction.atomic
    def create_order(
            cls, user, payment_method_code, address_id=None,
            address_data=None, save_address=True, notes=""
    ):
        if getattr(config, "STORE_MAINTENANCE_MODE", False):
            raise CheckoutError(
                "Checkout is temporarily disabled for maintenance."
            )

        method = cls._get_method(payment_method_code)

        cart = CartService.get_or_create_cart(user)
        items = list(cart.items.select_related("product"))
        if not items:
            raise CheckoutError("Your cart is empty.")

        # Lock stock rows so two checkouts can't oversell the same units.
        stocks = {
            s.product_id: s
            for s in ProductStock.objects.select_for_update().filter(
                product_id__in=[i.product_id for i in items]
            )
        }

        total = Decimal("0.00")
        for item in items:
            product, stock = item.product, stocks.get(item.product_id)
            if not product.is_active or not stock or not stock.is_available:
                raise CheckoutError(
                    f"“{product.name}” is no longer available."
                )
            if stock.available_quantity < item.quantity:
                raise CheckoutError(
                    f"Only {stock.available_quantity} of “{product.name}” left in stock."
                )
            total += product.final_price * item.quantity

        minimum = Decimal(
            str(getattr(config, "MINIMUM_ORDER_AMOUNT_USD", 0) or 0)
        )
        if total < minimum:
            raise CheckoutError(
                f"The minimum order amount is ${minimum:.2f}."
            )
        cls._check_min(method, total)

        # Address: saved one, or a new one (kept inactive if the user
        # doesn't want it saved; the FK on Order is required).
        if address_id:
            address = Address.objects.filter(
                pk=address_id, user=user, is_active=True
            ).first()
            if not address:
                raise CheckoutError("Selected address was not found.")
        else:
            address = Address.objects.create(
                user=user,
                is_active=save_address,
                is_default=save_address and not Address.objects.filter(
                    user=user, is_active=True
                ).exists(),
                **address_data,
            )

        order = Order.objects.create(
            user=user, delivery_address=address, status=S.PAYMENT,
            total_price=total, notes=notes or None,
        )
        OrderItem.objects.bulk_create(
            [
                OrderItem(
                    order=order, product=i.product, quantity=i.quantity,
                    unit_price=i.product.final_price,
                    total_price=i.product.final_price * i.quantity,
                ) for i in items
            ]
        )
        payment = OrderPayment.objects.create(
            order=order,
            amount=total,
            method=method.name,
            status=P.PENDING,
            provider=method.provider,
            method_code=method.code,
        )

        expires_at = timezone.now() + timedelta(minutes=_window_minutes())
        for item in items:
            stock = stocks[item.product_id]
            reservation = StockReservation.objects.create(
                order=order, product_stock=stock,
                quantity=item.quantity, expires_at=expires_at,
            )
            ProductStock.objects.filter(pk=stock.pk).update(
                reserved_quantity=F("reserved_quantity") + item.quantity
            )
            StockTransactionLog.objects.create(
                product_stock=stock,
                action=StockTransactionLog.ActionChoices.RESERVE,
                quantity=item.quantity,
                note=f"Reservation {reservation.id} created for Order #{order.id}",
            )

        cart.items.all().delete()

        instructions = get_provider(method.provider).initiate(
            order,
            payment,
            method
            )
        return order, instructions

    # ------------------------------------------------------------------
    # (Re)start payment with a provider while the window is open
    # ------------------------------------------------------------------
    @classmethod
    def start_payment(cls, order_id, user, payment_method_code):
        order = get_object_or_404(Order, pk=order_id, user=user)
        if cls.expire_if_needed(order.pk):
            raise CheckoutError(
                "The payment window expired and the order was cancelled."
            )
        method = cls._get_method(payment_method_code)

        with transaction.atomic():
            order = _lock(order.pk)
            if order.status != S.PAYMENT:
                raise CheckoutError("This order is not awaiting payment.")
            cls._check_min(method, order.total_price)
            payment = order.payment
            old_provider, old_ref = payment.provider, payment.provider_reference

            payment.method = method.name
            payment.method_code = method.code
            payment.provider = method.provider
            payment.provider_reference = ""
            payment.provider_data = {}
            payment.status = P.PENDING
            payment.save(
                update_fields=[
                    "method", "method_code", "provider",
                    "provider_reference",
                    "provider_data", "status", "updated_at",
                ]
            )
            instructions = get_provider(method.provider).initiate(
                order,
                payment,
                method
                )
            transaction.on_commit(
                lambda: _cancel_remote(old_provider, old_ref)
                )
            return order, instructions

    # ------------------------------------------------------------------
    # Payment confirmation (called by admin now, webhooks later)
    # ------------------------------------------------------------------
    @classmethod
    def confirm_payment(cls, order_id, transaction_id=None):
        if cls.expire_if_needed(order_id):
            raise CheckoutError(
                "The payment window expired and the order was cancelled."
            )

        with transaction.atomic():
            order = _lock(order_id)
            if order.status != S.PAYMENT:
                raise CheckoutError("This order is not awaiting payment.")

            for reservation in order.stock_reservations.filter(
                    status=ACTIVE
            ):
                reservation.commit()

            order.payment.mark_completed(transaction_id)
            OrderShipment.objects.get_or_create(order=order)
            order.status = S.PENDING  # paid, waiting for staff review
            order.save(update_fields=["status", "updated_at"])
        return order

    # ------------------------------------------------------------------
    # Cancellation / expiry
    # ------------------------------------------------------------------
    @classmethod
    @transaction.atomic
    def cancel_order(cls, order_id, reason):
        """Cancel an unpaid order and release its stock. Returns True if cancelled."""
        order = _lock(order_id)
        if order.status != S.PAYMENT:
            return False

        for reservation in order.stock_reservations.select_related(
                "product_stock"
        ).filter(status=ACTIVE):
            reservation.release(reason=reason)

        order.status = S.CANCELLED
        _append_note(order, reason)
        order.save(update_fields=["status", "notes", "updated_at"])

        payment = getattr(order, "payment", None)
        if payment:
            transaction.on_commit(
                lambda
                    p=payment.provider,
                    r=payment.provider_reference: _cancel_remote(p, r)
            )
        return True

    @classmethod
    def customer_cancel(cls, order_id, user):
        order = get_object_or_404(Order, pk=order_id, user=user)
        if not cls.cancel_order(order.pk, "Cancelled by customer."):
            raise CheckoutError(
                "Only orders awaiting payment can be cancelled."
            )
        return Order.objects.get(pk=order.pk)

    @classmethod
    def expire_if_needed(cls, order_id):
        due = Order.objects.filter(
            pk=order_id, status=S.PAYMENT,
            stock_reservations__status=ACTIVE,
            stock_reservations__expires_at__lte=timezone.now(),
        ).exists()
        return bool(due and cls.cancel_order(order_id, EXPIRED_REASON))

    @classmethod
    def expire_due_orders(cls, user=None):
        qs = Order.objects.filter(
            status=S.PAYMENT,
            stock_reservations__status=ACTIVE,
            stock_reservations__expires_at__lte=timezone.now(),
        )
        if user is not None:
            qs = qs.filter(user=user)
        count = 0
        for order_id in set(qs.values_list("id", flat=True)):
            try:
                count += bool(cls.cancel_order(order_id, EXPIRED_REASON))
            except Exception:
                logger.exception("Failed to expire order %s", order_id)
        return count

    # ------------------------------------------------------------------
    # Fulfilment
    # ------------------------------------------------------------------
    @classmethod
    @transaction.atomic
    def start_processing(cls, order_id):
        order = _lock(order_id)
        if order.status != S.PENDING:
            raise CheckoutError(
                "Only paid orders in review can start processing."
            )
        order.status = S.PROCESSING
        order.save(update_fields=["status", "updated_at"])
        return order

    @classmethod
    @transaction.atomic
    def mark_shipped(
            cls,
            order_id,
            tracking_number=None,
            carrier=None,
            notes=None
    ):
        order = _lock(order_id)
        if order.status not in (S.PENDING, S.PROCESSING):
            raise CheckoutError("Only paid orders can be shipped.")
        shipment, _ = OrderShipment.objects.get_or_create(order=order)
        shipment.mark_shipped(tracking_number, carrier, notes)
        order.status = S.SHIPPED
        order.save(update_fields=["status", "updated_at"])
        return order

    @classmethod
    @transaction.atomic
    def mark_delivered(cls, order_id):
        order = _lock(order_id)
        if order.status != S.SHIPPED:
            raise CheckoutError(
                "Only shipped orders can be marked as delivered."
            )
        order.shipment.mark_delivered()
        order.status = S.DELIVERED
        order.save(update_fields=["status", "updated_at"])
        return order

    @classmethod
    @transaction.atomic
    def refund_order(cls, order_id, performed_by=None):
        """Refund a paid order before dispatch and return the units to stock."""
        order = _lock(order_id)
        payment = getattr(order, "payment", None)
        if order.status not in (S.PENDING, S.PROCESSING) or not payment \
                or payment.status != P.COMPLETED:
            raise CheckoutError(
                "Only paid orders that have not shipped can be refunded."
            )

        for item in order.items.all():
            stock = ProductStock.objects.filter(
                product_id=item.product_id
            ).first()
            if not stock:
                continue
            ProductStock.objects.filter(pk=stock.pk).update(
                quantity=F("quantity") + item.quantity
            )
            StockTransactionLog.objects.create(
                product_stock=stock,
                action=StockTransactionLog.ActionChoices.RESTOCK,
                quantity=item.quantity, performed_by=performed_by,
                note=f"Order #{order.id} refunded before dispatch: units returned to stock.",
            )

        payment.status = P.REFUNDED
        payment.save(update_fields=["status", "updated_at"])
        order.status = S.CANCELLED
        _append_note(order, "Refunded before dispatch.")
        order.save(update_fields=["status", "notes", "updated_at"])
        return order

    @classmethod
    def settle_payment(cls, order_id, transaction_id=None, data=None):
        """Idempotent. Returns 'confirmed' | 'duplicate' | 'late' | 'unknown'."""
        order = Order.objects.select_related("payment").filter(pk=order_id).first()
        payment = getattr(order, "payment", None) if order else None
        if not payment:
            logger.error("Payment callback for unknown order %s", order_id)
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
        order = _lock(order_id)
        payment = order.payment
        if payment.status == P.COMPLETED:
            return "duplicate"           # lost a race with a parallel webhook
        if payment.provider_data.get("late_payment"):
            return "late"
        payment.provider_data = {
            **payment.provider_data, "late_payment": True,
            "late_transaction_id": transaction_id,
        }
        payment.save(update_fields=["provider_data", "updated_at"])
        _append_note(order, f"LATE PAYMENT received ({transaction_id or 'no tx id'}) "
                            "after the order was closed. Refund or re-open manually.")
        order.save(update_fields=["notes", "updated_at"])
        logger.error("Late payment for order %s (%s)", order_id, transaction_id)
        return "late"

    @classmethod
    def update_provider_data(cls, order_id, data):
        payment = OrderPayment.objects.filter(order_id=order_id).first()
        if payment:
            payment.provider_data = {**payment.provider_data, **data}
            payment.save(update_fields=["provider_data", "updated_at"])
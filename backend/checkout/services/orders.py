from datetime import timedelta
from decimal import Decimal

from constance import config
from django.db import transaction
from django.db.models import F
from django.shortcuts import get_object_or_404
from django.utils import timezone

from account.models import Address
from checkout import events
from checkout.exceptions import CheckoutError
from checkout.models import Order, OrderItem, OrderPayment
from checkout.services import attempts
from checkout.services._common import (
    ACTIVE, P, S, append_note, cancel_remote, check_minimum, lock_order,
)
from checkout.services.cart import CartService
from core.logging import get_logger
from core.logging.audit import audit_on_commit
from inventory.models import ProductStock, StockReservation, StockTransactionLog

log = get_logger(__name__)
EXPIRED_REASON = "Payment window expired."


def _window_minutes():
    return int(getattr(config, "CRYPTO_PAYMENT_WINDOW_MINUTES", 60) or 60)


class OrderService:
    """Order lifecycle up to payment: place, cancel, expire. No gateway calls here."""

    @staticmethod
    def expires_at(order):
        """Payment deadline. Uses prefetched reservations when available."""
        if order.status != S.PAYMENT:
            return None
        times = [r.expires_at for r in order.stock_reservations.all() if r.status == ACTIVE]
        return max(times) if times else None

    @classmethod
    @transaction.atomic
    def place(cls, user, method, *, address_id=None, address_data=None,
              save_address=True, notes=""):
        """Validate the cart, reserve stock, create order + payment. DB work only."""
        cart = CartService.get_or_create_cart(user)
        items = list(cart.items.select_related("product"))
        if not items:
            raise CheckoutError("Your cart is empty.")

        # Lock in pk order so two overlapping carts can't deadlock each other.
        stocks = {
            s.product_id: s
            for s in ProductStock.objects.select_for_update()
            .filter(product_id__in=[i.product_id for i in items]).order_by("pk")
        }

        total = cls._price(items, stocks)
        minimum = Decimal(str(getattr(config, "MINIMUM_ORDER_AMOUNT_USD", 0) or 0))
        if total < minimum:
            raise CheckoutError(f"The minimum order amount is ${minimum:.2f}.")
        check_minimum(method, total)

        address = cls._resolve_address(user, address_id, address_data, save_address)
        order = Order.objects.create(
            user=user, delivery_address=address, status=S.PAYMENT,
            total_price=total, notes=notes or None,
        )
        OrderItem.objects.bulk_create([
            OrderItem(
                order=order, product=i.product, quantity=i.quantity,
                unit_price=i.product.final_price,
                total_price=i.product.final_price * i.quantity,
            ) for i in items
        ])
        payment = OrderPayment.objects.create(
            order=order, amount=total, method=method.name, status=P.PENDING,
            provider=method.provider, method_code=method.code,
        )
        cls._reserve(order, items, stocks)
        return order, payment

    @staticmethod
    def _price(items, stocks):
        total = Decimal("0.00")
        for item in items:
            product, stock = item.product, stocks.get(item.product_id)
            if not product.is_active or not stock or not stock.is_available:
                raise CheckoutError(f"“{product.name}” is no longer available.")
            if stock.available_quantity < item.quantity:
                raise CheckoutError(
                    f"Only {stock.available_quantity} of “{product.name}” left in stock."
                )
            total += product.final_price * item.quantity
        return total

    @staticmethod
    def _resolve_address(user, address_id, address_data, save_address):
        if address_id:
            address = Address.objects.filter(pk=address_id, user=user, is_active=True).first()
            if not address:
                raise CheckoutError("Selected address was not found.")
            return address
        # An unsaved address stays inactive: the FK on Order is required.
        return Address.objects.create(
            user=user,
            is_active=save_address,
            is_default=save_address and not Address.objects.filter(user=user, is_active=True).exists(),
            **address_data,
        )

    @staticmethod
    def _reserve(order, items, stocks):
        expires_at = timezone.now() + timedelta(minutes=_window_minutes())
        for item in items:
            stock = stocks[item.product_id]
            reservation = StockReservation.objects.create(
                order=order, product_stock=stock, quantity=item.quantity, expires_at=expires_at,
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

    @classmethod
    @transaction.atomic
    def cancel_order(cls, order_id, reason, notify=True):
        """Cancel an unpaid order and release its stock. Returns True if cancelled."""
        order = lock_order(order_id)
        if order.status != S.PAYMENT:
            return False

        for reservation in order.stock_reservations.select_related("product_stock").filter(status=ACTIVE):
            reservation.release(reason=reason)

        order.status = S.CANCELLED
        append_note(order, reason)
        order.save(update_fields=["status", "notes", "updated_at"])

        expired = reason == EXPIRED_REASON
        payment = getattr(order, "payment", None)
        if payment:
            payment.mark_failed()
            attempts.close(
                payment,
                attempts.S.EXPIRED if expired else attempts.S.CANCELLED,
                error=reason,
            )
            provider, reference = payment.provider, payment.provider_reference
            transaction.on_commit(lambda: cancel_remote(provider, reference))

        if notify:
            events.order_event(order_id, "order_expired" if expired else "order_cancelled")
        audit_on_commit("order.expired" if expired else "order.cancelled",
                        order_id=order_id, reason=reason)
        return True

    @classmethod
    def customer_cancel(cls, order_id, user):
        order = get_object_or_404(Order, pk=order_id, user=user)
        if not cls.cancel_order(order.pk, "Cancelled by customer."):
            raise CheckoutError("Only orders awaiting payment can be cancelled.")
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
                log.exception("order.expire_failed", extra={"order_id": order_id})
        if count:
            log.info("order.expire_batch", extra={"count": count})
        return count
from datetime import timedelta
from decimal import Decimal

from constance import config
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone

from account.models import Address
from checkout import events
from checkout.exceptions import CheckoutError
from checkout.models import Order, OrderItem, OrderPayment
from checkout.services import attempts
from checkout.services.pricing import compute_totals
from checkout.services.shipping import ShippingService
from checkout.services._common import (
    ACTIVE, P, S, append_note, cancel_remote, check_minimum, lock_order,
)
from checkout.services.cart import CartService
from core.logging import get_logger
from core.logging.audit import audit_on_commit

from inventory.services.stock import StockService

log = get_logger(__name__)

EXPIRED_REASON = "Payment window expired."


def _window_minutes():
    return int(getattr(config, "PAYMENT_WINDOW_MINUTES", 60) or 60)


class OrderService:

    @staticmethod
    def expires_at(order):
        """Payment deadline. Uses prefetched reservations when available."""
        if order.status != S.PAYMENT:
            return None
        times = [r.expires_at for r in order.stock_reservations.all() if
                 r.status == ACTIVE]
        return max(times) if times else None

    @classmethod
    @transaction.atomic
    def place(
            cls, user, method, *, address_id=None, address_data=None,
            save_address=True, notes="", shipping_method_code=None
    ):
        """Validate the cart, reserve stock, create order + payment. DB work only."""
        cart = CartService.get_or_create_cart(user)
        items = list(cart.items.select_related("product"))
        if not items:
            raise CheckoutError("Your cart is empty.")

        # Lock in pk order so two overlapping carts can't deadlock each other.
        stocks = StockService.lock([i.product_id for i in items])

        subtotal = cls._price(items, stocks)
        minimum = Decimal(
            str(getattr(config, "MINIMUM_ORDER_AMOUNT_USD", 0) or 0)
        )
        if subtotal < minimum:  # store minimum applies to goods
            raise CheckoutError(
                f"The minimum order amount is ${minimum:.2f}."
            )

        address = cls._resolve_address(
            user,
            address_id,
            address_data,
            save_address
        )

        shipping_method, shipping_cost = None, Decimal("0.00")
        if ShippingService.requires_shipping(i.product for i in items):
            shipping_method, shipping_cost = ShippingService.resolve(
                shipping_method_code, address.country, subtotal
            )

        totals = compute_totals(subtotal, shipping_cost)
        check_minimum(
            method,
            totals.total
        )  # method minimum applies to what is actually paid

        order = Order.objects.create(
            user=user, delivery_address=address, status=S.PAYMENT,
            total_price=totals.total, subtotal=totals.subtotal,
            tax_amount=totals.tax_amount, tax_rate=totals.tax_rate,
            tax_name=totals.tax_name, tax_included=totals.tax_included,
            shipping_method=shipping_method,
            shipping_method_name=shipping_method.name if shipping_method else "",
            shipping_cost=totals.shipping,
            notes=notes or None,
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
            amount=totals.total,
            method=method.name,
            status=P.PENDING,
            provider=method.provider,
            method_code=method.code,
        )
        expires_at = timezone.now() + timedelta(minutes=_window_minutes())
        StockService.reserve(order, items, stocks, expires_at)
        return order, payment

    @staticmethod
    def _price(items, stocks):
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
        return total

    @staticmethod
    def _resolve_address(user, address_id, address_data, save_address):
        if address_id:
            address = Address.objects.filter(
                pk=address_id,
                user=user,
                is_active=True
            ).first()
            if not address:
                raise CheckoutError("Selected address was not found.")
            return address
        # An unsaved address stays inactive: the FK on Order is required.
        return Address.objects.create(
            user=user,
            is_active=save_address,
            is_default=save_address and not Address.objects.filter(
                user=user,
                is_active=True
            ).exists(),
            **address_data,
        )

    @classmethod
    @transaction.atomic
    def cancel_order(cls, order_id, reason, notify=True):
        """Cancel an unpaid order and release its stock. Returns True if cancelled."""
        order = lock_order(order_id)
        if order.status != S.PAYMENT:
            return False

        for reservation in order.stock_reservations.select_related(
                "product_stock"
        ).filter(status=ACTIVE):
            StockService.release(reservation, reason)

        order.status = S.CANCELLED
        append_note(order, reason)
        order.save(update_fields=["status", "internal_notes", "updated_at"])

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
            transaction.on_commit(
                lambda: cancel_remote(provider, reference)
            )

        if notify:
            events.order_event(
                order_id,
                "order_expired" if expired else "order_cancelled"
            )
        audit_on_commit(
            "order.expired" if expired else "order.cancelled",
            order_id=order_id, reason=reason
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
                log.exception(
                    "order.expire_failed",
                    extra={"order_id": order_id}
                )
        if count:
            log.info("order.expire_batch", extra={"count": count})
        return count

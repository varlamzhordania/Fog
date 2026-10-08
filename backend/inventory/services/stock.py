from django.db import transaction
from django.db.models import F

from core.logging import get_logger
from inventory.models import ProductStock, StockReservation, StockTransactionLog

log = get_logger(__name__)

A = StockTransactionLog.ActionChoices
R = StockReservation.ReservationStatus


class StockService:

    @staticmethod
    def lock(product_ids):
        """Row-lock stock for these products in pk order (two carts can't deadlock)."""
        return {
            s.product_id: s
            for s in ProductStock.objects.select_for_update()
            .filter(product_id__in=product_ids).order_by("pk")
        }

    @staticmethod
    def _log(stock, action, quantity, note, user=None):
        if quantity > 0:
            StockTransactionLog.objects.create(
                product_stock=stock, action=action, quantity=quantity,
                performed_by=user, note=note,
            )

    @classmethod
    def reserve(cls, order, items, stocks, expires_at):
        """Hold stock for an unpaid order. `items` need .product_id and .quantity."""
        for item in items:
            stock = stocks[item.product_id]
            reservation = StockReservation.objects.create(
                order=order, product_stock=stock,
                quantity=item.quantity, expires_at=expires_at,
            )
            ProductStock.objects.filter(pk=stock.pk).update(
                reserved_quantity=F("reserved_quantity") + item.quantity
            )
            cls._log(stock, A.RESERVE, item.quantity,
                     f"Reservation {reservation.id} created for Order #{order.id}")

    @classmethod
    @transaction.atomic
    def release(cls, reservation, reason):
        """Give a held reservation back. Returns False if it was no longer active."""
        if reservation.status != R.ACTIVE:
            return False
        ProductStock.objects.filter(pk=reservation.product_stock_id).update(
            reserved_quantity=F("reserved_quantity") - reservation.quantity
        )
        reservation.status = R.RELEASED
        reservation.save(update_fields=["status", "updated_at"])
        cls._log(reservation.product_stock, A.RELEASE_RESERVATION, reservation.quantity,
                 f"Reservation {reservation.id} released: {reason}")
        return True

    @classmethod
    @transaction.atomic
    def commit(cls, reservation):
        """Turn a hold into a permanent deduction once the order is paid."""
        if reservation.status != R.ACTIVE:
            return False
        ProductStock.objects.filter(pk=reservation.product_stock_id).update(
            quantity=F("quantity") - reservation.quantity,
            reserved_quantity=F("reserved_quantity") - reservation.quantity,
        )
        reservation.status = R.COMMITTED
        reservation.save(update_fields=["status", "updated_at"])
        cls._log(reservation.product_stock, A.ORDER_DEDUCTION, reservation.quantity,
                 f"Reservation {reservation.id} committed for Order #{reservation.order_id}")
        return True

    @classmethod
    def restock(cls, order, performed_by=None):
        """Return a refunded order's units to stock."""
        product_ids = [i.product_id for i in order.items.all() if i.product_id]
        stocks = cls.lock(product_ids)
        for item in order.items.all():
            stock = stocks.get(item.product_id)
            if not stock:
                continue
            ProductStock.objects.filter(pk=stock.pk).update(
                quantity=F("quantity") + item.quantity
            )
            cls._log(stock, A.RESTOCK, item.quantity,
                     f"Order #{order.id} refunded before dispatch: units returned to stock.",
                     performed_by)
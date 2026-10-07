from django.db import transaction

from checkout import events
from checkout.exceptions import CheckoutError
from checkout.models import OrderShipment
from checkout.services._common import S, lock_order
from core.logging.audit import audit_on_commit


class FulfilmentService:
    """Paid → processing → shipped → delivered."""

    @staticmethod
    def _locked(order_id, allowed, message):
        order = lock_order(order_id)
        if order.status not in allowed:
            raise CheckoutError(message)
        return order

    @classmethod
    @transaction.atomic
    def start_processing(cls, order_id):
        order = cls._locked(order_id, (S.PENDING,), "Only paid orders in review can start processing.")
        order.status = S.PROCESSING
        order.save(update_fields=["status", "updated_at"])
        events.order_event(order.id, "order_processing")
        audit_on_commit("order.processing", order_id=order.id)
        return order

    @classmethod
    @transaction.atomic
    def mark_shipped(cls, order_id, tracking_number=None, carrier=None, notes=None):
        order = cls._locked(order_id, (S.PENDING, S.PROCESSING), "Only paid orders can be shipped.")
        shipment, _ = OrderShipment.objects.get_or_create(order=order)
        shipment.mark_shipped(tracking_number, carrier, notes)
        order.status = S.SHIPPED
        order.save(update_fields=["status", "updated_at"])
        events.order_event(order.id, "order_shipped", countdown=120)
        audit_on_commit("order.shipped", order_id=order.id, carrier=carrier)
        return order

    @classmethod
    @transaction.atomic
    def mark_delivered(cls, order_id):
        order = cls._locked(order_id, (S.SHIPPED,), "Only shipped orders can be marked as delivered.")
        shipment, _ = OrderShipment.objects.get_or_create(order=order)
        shipment.mark_delivered()
        order.status = S.DELIVERED
        order.save(update_fields=["status", "updated_at"])
        events.order_event(order.id, "order_delivered", countdown=120)
        audit_on_commit("order.delivered", order_id=order.id)
        return order
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase

from account.models import Address
from checkout.models import Order, OrderPayment
from checkout.services.order import OrderService

User = get_user_model()


class SettlePaymentTests(TestCase):
    def setUp(self):
        user = User.objects.create_user(email="a@x.com", password="Str0ng-pass-123")
        address = Address.objects.create(
            user=user, full_name="A", line1="1 St", city="C", postal_code="1", country="X"
        )
        self.order = Order.objects.create(
            user=user, delivery_address=address,
            status=Order.StatusChoices.PAYMENT, total_price=Decimal("10.00"),
        )
        OrderPayment.objects.create(
            order=self.order, amount=Decimal("10.00"), method="Manual", provider="manual"
        )

    def _events(self, mock_events):
        return [c.args[1] for c in mock_events.order_event.call_args_list]

    @patch("checkout.services.order.events")
    def test_normal_payment_is_not_flagged_late(self, events):
        result = OrderService.settle_payment(self.order.pk, "tx1", data={"k": "v"})
        self.assertEqual(result, "confirmed")
        self.assertNotIn("late_payment", self._events(events))
        self.assertEqual(self.order.payment.__class__.objects.get(order=self.order).status, "COMPLETED")

    @patch("checkout.services.order.events")
    def test_payment_after_cancel_is_late_exactly_once(self, events):
        Order.objects.filter(pk=self.order.pk).update(status=Order.StatusChoices.CANCELLED)
        self.assertEqual(OrderService.settle_payment(self.order.pk, "tx2"), "late")
        self.assertEqual(OrderService.settle_payment(self.order.pk, "tx2"), "late")
        self.assertEqual(self._events(events).count("late_payment"), 1)
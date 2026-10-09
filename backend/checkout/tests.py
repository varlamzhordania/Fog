from decimal import Decimal
from unittest.mock import patch

from constance.test import override_config
from django.contrib.auth import get_user_model
from django.test import TestCase

from account.models import Address
from checkout.exceptions import CheckoutError, GatewayError
from checkout.models import Order, OrderPayment, PaymentMethod, ShippingMethod
from checkout.payments.manual import ManualProvider
from checkout.services.cart import CartService
from checkout.services.checkout import CheckoutService
from checkout.services.payments import PaymentService
from checkout.services.pricing import compute_totals
from inventory.models import Product, ProductStock

User = get_user_model()


@override_config(MINIMUM_ORDER_AMOUNT_USD=0.0)
class CheckoutFlowTests(TestCase):
    URL = "/api/v1/checkout/orders/create/"

    def setUp(self):
        self.order_event = patch("checkout.events.order_event").start()
        patch("checkout.events.order_paid").start()
        self.addCleanup(patch.stopall)
        self.user = User.objects.create_user(email="api@x.com", password="Str0ng-pass-123")
        self.address = Address.objects.create(user=self.user, full_name="A", line1="1 St",
                                              city="C", postal_code="1", country="X")
        PaymentMethod.objects.create(name="Manual", code="manual", provider="manual")
        PaymentMethod.objects.create(name="Other", code="other", provider="manual")
        ShippingMethod.objects.create(name="Standard", code="standard", price=5)
        product = Product.objects.create(name="P", sku="S1", base_price=20, store_price=20)
        self.stock = ProductStock.objects.create(product=product, quantity=10)
        CartService.add_to_cart(self.user, product.id, 2)
        self.client.login(email="api@x.com",password="Str0ng-pass-123")

    def _create(self):
        return CheckoutService.create_order(
            self.user, "manual", address_id=self.address.id, shipping_method_code="standard"
        )

    def _events(self):
        return [c.args[1] for c in self.order_event.call_args_list]

    def test_create_order_reserves_stock_and_clears_cart(self):
        order, _ = self._create()
        self.stock.refresh_from_db()
        self.assertEqual(self.stock.reserved_quantity, 2)
        self.assertEqual(order.status, Order.StatusChoices.PAYMENT)
        self.assertEqual(order.payment.attempts.count(), 1)
        self.assertFalse(
            CartService.get_or_create_cart(self.user).items.exists()
            )
        self.assertIn("order_created", self._events())

    def test_gateway_failure_releases_stock_keeps_cart_and_sends_no_email(
            self
            ):
        with patch.object(
                ManualProvider,
                "create_session",
                side_effect=GatewayError("down")
                ):
            with self.assertRaises(GatewayError):
                self._create()
        order = Order.objects.get()
        self.stock.refresh_from_db()
        self.assertEqual(order.status, Order.StatusChoices.CANCELLED)
        self.assertEqual(self.stock.reserved_quantity, 0)
        self.assertEqual(order.payment.attempts.get().status, "failed")
        self.assertTrue(
            CartService.get_or_create_cart(self.user).items.exists()
            )
        self.assertEqual(self._events(), [])

    def test_switch_method_supersedes_previous_attempt(self):
        order, _ = self._create()
        PaymentService.start_payment(order.pk, self.user, "other")
        payment = OrderPayment.objects.get(order=order)
        self.assertEqual(payment.method, "Other")
        self.assertEqual(
            list(
                payment.attempts.order_by("number").values_list(
                    "status",
                    flat=True
                    )
                ),
            ["superseded", "pending"],
        )

    def test_switch_gateway_failure_leaves_existing_payment_untouched(
            self
            ):
        order, _ = self._create()
        with patch.object(
                ManualProvider,
                "create_session",
                side_effect=GatewayError("down")
                ):
            with self.assertRaises(GatewayError):
                PaymentService.start_payment(order.pk, self.user, "other")
        payment = OrderPayment.objects.get(order=order)
        self.assertEqual(payment.method, "Manual")
        self.assertEqual(
            payment.attempts.filter(status="pending").count(),
            1
            )

    def test_refund_restocks_and_flags_manual_refund(self):
        order, _ = self._create()
        PaymentService.confirm_payment(order.pk, "tx-1")
        self.stock.refresh_from_db()
        self.assertEqual(
            (self.stock.quantity, self.stock.reserved_quantity),
            (8, 0)
            )

        PaymentService.refund_order(order.pk)
        order.refresh_from_db()
        self.stock.refresh_from_db()
        self.assertEqual(self.stock.quantity, 10)
        self.assertEqual(order.status, Order.StatusChoices.CANCELLED)
        self.assertEqual(order.payment.status, "REFUNDED")
        self.assertIn("ACTION: refund the customer manually",order.internal_notes)
        self.assertNotIn("ACTION", order.notes or "")

    @override_config(TAX_ENABLED=True, TAX_RATE=18.0, TAX_NAME="VAT",
                     PRICES_INCLUDE_TAX=False, TAX_ON_SHIPPING=True)
    def test_order_and_payment_carry_shipping_and_tax(self):
        order, _ = self._create()
        self.assertEqual(
            (order.subtotal, order.shipping_cost, order.tax_amount, order.total_price, order.payment.amount),
            (Decimal("40.00"), Decimal("5.00"), Decimal("8.10"), Decimal("53.10"), Decimal("53.10")),
        )
        self.assertEqual(order.shipping_method_name, "Standard")

    def test_physical_cart_requires_a_shipping_method(self):
        with self.assertRaises(CheckoutError):
            CheckoutService.create_order(self.user, "manual", address_id=self.address.id)

    def test_free_shipping_over_threshold(self):
        ShippingMethod.objects.filter(code="standard").update(free_over=Decimal("40.00"))
        order, _ = self._create()
        self.assertEqual(order.shipping_cost, Decimal("0.00"))

    def test_method_not_offered_to_this_country(self):
        ShippingMethod.objects.filter(code="standard").update(countries="Germany, DE")
        with self.assertRaises(CheckoutError):
            self._create()

    def test_digital_only_cart_skips_shipping(self):
        CartService.clear_cart(self.user)
        guide = Product.objects.create(name="G", sku="G1", base_price=5, store_price=5,
                                       product_type="downloadable")
        ProductStock.objects.create(product=guide, quantity=5)
        CartService.add_to_cart(self.user, guide.id, 1)
        order, _ = CheckoutService.create_order(self.user, "manual", address_id=self.address.id)
        self.assertIsNone(order.shipping_method)
        self.assertEqual(order.shipping_cost, Decimal("0.00"))

    def test_shipping_method_is_applied(self):
        r = self.client.post(self.URL, {
            "payment_method": "manual", "address_id": self.address.id,
            "shipping_method": "standard",
        }, format="json")
        self.assertEqual(r.status_code, 201, r.content)
        self.assertEqual(r.json()["order"]["shipping_method_name"], "Standard")


class SettlePaymentTests(TestCase):
    def setUp(self):
        patch("checkout.events.order_event").start()
        patch("checkout.events.order_paid").start()
        self.addCleanup(patch.stopall)
        user = User.objects.create_user(
            email="s@x.com",
            password="Str0ng-pass-123"
            )
        address = Address.objects.create(
            user=user,
            full_name="A",
            line1="1 St",
            city="C",
            postal_code="1",
            country="X"
        )
        self.order = Order.objects.create(
            user=user,
            delivery_address=address,
            status=Order.StatusChoices.PAYMENT,
            total_price=Decimal("10.00"),
        )
        OrderPayment.objects.create(
            order=self.order,
            amount=Decimal("10.00"),
            method="Manual",
            provider="manual"
        )

    def test_normal_payment_is_confirmed_not_late(self):
        self.assertEqual(
            PaymentService.settle_payment(
                self.order.pk,
                "tx1",
                data={"k": "v"}
                ),
            "confirmed"
            )
        self.assertEqual(
            OrderPayment.objects.get(order=self.order).status,
            "COMPLETED"
            )
        self.assertEqual(
            PaymentService.settle_payment(self.order.pk, "tx1"),
            "duplicate"
            )

    def test_payment_after_cancel_is_late_exactly_once(self):
        Order.objects.filter(pk=self.order.pk).update(
            status=Order.StatusChoices.CANCELLED
            )
        with patch("checkout.events.order_event") as event:
            self.assertEqual(
                PaymentService.settle_payment(self.order.pk, "tx2"),
                "late"
                )
            self.assertEqual(
                PaymentService.settle_payment(self.order.pk, "tx2"),
                "late"
                )
        self.assertEqual(
            [c.args[1] for c in event.call_args_list].count(
                "late_payment"
                ),
            1
            )


class PricingTests(TestCase):
    @override_config(
        TAX_ENABLED=True,
        TAX_RATE=18.0,
        TAX_NAME="VAT",
        PRICES_INCLUDE_TAX=False
        )
    def test_tax_added_on_top(self):
        t = compute_totals(Decimal("100.00"))
        self.assertEqual(
            (t.tax_amount, t.total),
            (Decimal("18.00"), Decimal("118.00"))
            )

    @override_config(
        TAX_ENABLED=True,
        TAX_RATE=18.0,
        TAX_NAME="VAT",
        PRICES_INCLUDE_TAX=True
        )
    def test_tax_extracted_when_prices_include_it(self):
        t = compute_totals(Decimal("100.00"))
        self.assertEqual(
            (t.tax_amount, t.total),
            (Decimal("15.25"), Decimal("100.00"))
            )

    @override_config(TAX_ENABLED=False)
    def test_disabled(self):
        t = compute_totals(Decimal("100.00"))
        self.assertEqual(
            (t.tax_amount, t.total),
            (Decimal("0.00"), Decimal("100.00"))
            )

    @override_config(TAX_ENABLED=True, TAX_RATE=18.0, PRICES_INCLUDE_TAX=False, TAX_ON_SHIPPING=True)
    def test_shipping_is_taxed(self):
        t = compute_totals(Decimal("100.00"), Decimal("10.00"))
        self.assertEqual((t.tax_amount, t.total), (Decimal("19.80"), Decimal("129.80")))

    @override_config(TAX_ENABLED=True, TAX_RATE=18.0, PRICES_INCLUDE_TAX=False, TAX_ON_SHIPPING=False)
    def test_shipping_not_taxed(self):
        t = compute_totals(Decimal("100.00"), Decimal("10.00"))
        self.assertEqual((t.tax_amount, t.total), (Decimal("18.00"), Decimal("128.00")))
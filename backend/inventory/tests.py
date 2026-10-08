from decimal import Decimal
from types import SimpleNamespace

from django.db import connection
from django.test import TestCase
from django.test.utils import CaptureQueriesContext
from django.utils import timezone

from account.models import Address, User
from checkout.models import Order
from inventory.models import (
    Product,
    Category, ProductStock, StockReservation, StockTransactionLog,
)
from inventory.services.stock import StockService


class StockServiceTests(TestCase):
    def setUp(self):
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
            total_price=Decimal("20.00")
        )
        self.product = Product.objects.create(
            name="P",
            sku="P1",
            base_price=10,
            store_price=10
        )
        self.stock = ProductStock.objects.create(
            product=self.product,
            quantity=10
        )
        item = SimpleNamespace(product_id=self.product.id, quantity=3)
        StockService.reserve(
            self.order,
            [item],
            {self.product.id: self.stock},
            timezone.now()
        )
        self.reservation = StockReservation.objects.get(order=self.order)

    def _stock(self):
        self.stock.refresh_from_db()
        return self.stock.quantity, self.stock.reserved_quantity

    def test_reserve_holds_without_deducting(self):
        self.assertEqual(self._stock(), (10, 3))

    def test_release_returns_hold_and_is_idempotent(self):
        self.assertTrue(StockService.release(self.reservation, "test"))
        self.assertFalse(StockService.release(self.reservation, "test"))
        self.assertEqual(self._stock(), (10, 0))

    def test_commit_deducts_once(self):
        self.assertTrue(StockService.commit(self.reservation))
        self.assertFalse(StockService.commit(self.reservation))
        self.assertEqual(self._stock(), (7, 0))

    def test_manual_save_is_logged_but_service_updates_are_not_doubled(
            self
    ):
        logs_before = StockTransactionLog.objects.count()
        self.stock.refresh_from_db()
        self.stock.quantity = 15
        self.stock.save()
        self.assertEqual(
            StockTransactionLog.objects.count(),
            logs_before + 1
        )
        log = StockTransactionLog.objects.latest("pk")
        self.assertEqual((log.action, log.quantity), ("restock", 5))


class CategoryQueryTests(TestCase):
    def _queries(self):
        with CaptureQueriesContext(connection) as ctx:
            response = self.client.get(
                "/api/v1/inventory/categories/?pagination=false"
            )
        self.assertEqual(response.status_code, 200)
        return len(ctx)

    def test_query_count_does_not_grow_with_the_tree(self):
        Category.add_root(name="R0").add_child(name="C0")
        small = self._queries()
        for i in range(1, 7):
            Category.add_root(name=f"R{i}").add_child(name=f"C{i}")
        self.assertEqual(self._queries(), small)

    def test_inactive_parent_hides_descendants(self):
        root = Category.add_root(name="Hidden")
        root.add_child(name="Child")
        Category.objects.filter(pk=root.pk).update(is_active=False)
        names = [c["name"] for c in self.client.get(
            "/api/v1/inventory/categories/?pagination=false"
        ).json()]
        self.assertNotIn("Child", names)

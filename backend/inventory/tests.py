from django.test import TestCase
from rest_framework.test import APIClient

from inventory.models import Product


class PriceRangeTests(TestCase):
    def test_range_uses_store_price(self):
        Product.objects.create(name="A", sku="A1", base_price=100, store_price=10)
        Product.objects.create(name="B", sku="B1", base_price=50, store_price=20)
        data = APIClient().get("/api/v1/inventory/price-range/").json()
        self.assertEqual(data, {"min_price": 10, "max_price": 20})
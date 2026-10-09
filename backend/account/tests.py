from checkout.models import Order
from account.models import Address
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from django.core.cache import cache

User = get_user_model()

class AddressTests(APITestCase):
    URL = "/api/v1/account/address/"

    def setUp(self):
        self.user = User.objects.create_user(email="ad@x.com", password="GOOD")
        self.client.force_authenticate(self.user)

    def _add(self, **over):
        data = {"full_name": "A", "line1": "1 St", "city": "C",
                "postal_code": "1", "country": "X", **over}
        r = self.client.post(self.URL, data, format="json")
        self.assertEqual(r.status_code, 201, r.content)
        return r.json()["id"]

    def _defaults(self):
        return list(self.user.addresses.filter(is_active=True, is_default=True)
                    .values_list("pk", flat=True))

    def test_first_address_becomes_default(self):
        first = self._add()
        self.assertEqual(self._defaults(), [first])

    def test_new_default_clears_the_old_one(self):
        self._add()
        second = self._add(is_default=True)
        self.assertEqual(self._defaults(), [second])

    def test_deleting_default_promotes_another(self):
        first = self._add()
        second = self._add()
        self.assertEqual(self.client.delete(f"{self.URL}{first}/").status_code, 204)
        self.assertEqual(self._defaults(), [second])

    def test_address_used_by_an_order_is_deactivated_not_deleted(self):
        pk = self._add()
        Order.objects.create(user=self.user, delivery_address_id=pk, total_price=1)
        self.assertEqual(self.client.delete(f"{self.URL}{pk}/").status_code, 204)
        self.assertTrue(self.user.addresses.filter(pk=pk, is_active=False).exists())

    def test_cannot_touch_another_users_address(self):
        other = User.objects.create_user(email="o@x.com", password="GOOD")
        theirs = Address.objects.create(user=other, full_name="O", line1="1", city="C",
                                        postal_code="1", country="X")
        self.assertEqual(self.client.delete(f"{self.URL}{theirs.pk}/").status_code, 404)



class PasswordResetThrottleTests(APITestCase):
    URL = "/api/v1/account/password-reset/"

    def setUp(self):
        cache.clear()

    def test_same_email_is_limited_after_three_requests(self):
        for _ in range(3):
            self.assertEqual(self.client.post(self.URL, {"email": "a@x.com"}).status_code, 200)
        self.assertEqual(self.client.post(self.URL, {"email": "A@x.com"}).status_code, 429)
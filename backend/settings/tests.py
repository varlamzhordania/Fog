from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

User = get_user_model()


class ConfigApiTests(APITestCase):
    def test_no_secrets_even_for_staff_and_no_writes(self):
        staff = User.objects.create_user(
            email="s@x.com",
            password="x",
            is_staff=True
        )
        self.client.force_authenticate(staff)
        data = self.client.get("/api/v1/settings/").json()
        for key in ("STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_KEY",
                    "XCASH_HMAC_KEY", "XCASH_APPID"):
            self.assertNotIn(key, data)
        self.assertEqual(
            self.client.patch(
                "/api/v1/settings/",
                {"TAX_RATE": 0}
            ).status_code,
            405
        )

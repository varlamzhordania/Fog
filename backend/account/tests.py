from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.test import TestCase
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.test import APITestCase

from account.backends import EmailBackend

User = get_user_model()
GOOD = "Str0ng-pass-123"


class EmailBackendTests(TestCase):
    def test_inactive_user_cannot_authenticate(self):
        User.objects.create_user(email="i@x.com", password=GOOD, is_active=False)
        self.assertIsNone(EmailBackend().authenticate(None, email="i@x.com", password=GOOD))

    def test_active_user_case_insensitive(self):
        user = User.objects.create_user(email="a@x.com", password=GOOD)
        self.assertEqual(EmailBackend().authenticate(None, username="A@X.com", password=GOOD), user)


class PasswordResetTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="k@x.com", password=GOOD)

    def test_request_response_identical_for_known_and_unknown(self):
        url = "/api/v1/account/password-reset/"
        with patch("account.v1.views.send_password_reset_email_task") as task:
            known = self.client.post(url, {"email": "k@x.com"}, format="json")
            unknown = self.client.post(url, {"email": "nobody@x.com"}, format="json")
        self.assertEqual(known.status_code, unknown.status_code)
        self.assertEqual(known.json(), unknown.json())
        task.delay.assert_called_once_with(self.user.id)

    def _payload(self, **over):
        data = {
            "uid": urlsafe_base64_encode(force_bytes(self.user.pk)),
            "token": default_token_generator.make_token(self.user),
            "new_password1": "New-Str0ng-pass-1", "new_password2": "New-Str0ng-pass-1",
        }
        return {**data, **over}

    def test_confirm_rejects_mismatch_and_weak_passwords(self):
        url = "/api/v1/account/password-reset-confirm/"
        for over in ({"new_password2": "different"},
                     {"new_password1": "12345678", "new_password2": "12345678"}):
            self.assertEqual(self.client.post(url, self._payload(**over), format="json").status_code, 400)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(GOOD))

    def test_confirm_success(self):
        r = self.client.post("/api/v1/account/password-reset-confirm/", self._payload(), format="json")
        self.assertEqual(r.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("New-Str0ng-pass-1"))
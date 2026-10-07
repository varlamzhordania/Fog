# account/backends.py
from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend


class EmailBackend(ModelBackend):
    def authenticate(self, request, email=None, password=None, **kwargs):
        email = email or kwargs.get("username")
        if not email or not password:
            return None
        User = get_user_model()
        user = User.objects.filter(email__iexact=email.strip()).first()
        if user is None:
            User().set_password(password)
            return None
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
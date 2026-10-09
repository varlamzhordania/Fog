import hashlib
from rest_framework.throttling import SimpleRateThrottle


class PasswordResetEmailThrottle(SimpleRateThrottle):
    """3 reset requests per hour per address, whether or not the account exists."""
    scope = "password_reset_email"

    def get_cache_key(self, request, view):
        data = request.data if hasattr(request.data, "get") else {}
        email = str(data.get("email", "")).strip().lower()
        if not email:
            return None
        ident = hashlib.sha256(email.encode()).hexdigest()
        return self.cache_format % {"scope": self.scope, "ident": ident}
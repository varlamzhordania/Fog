from constance import config
from django.conf import settings

APP_NAME = "FOG Direct"


def support_email() -> str:
    return getattr(config, "SUPPORT_EMAIL", "") or ""


def logo_url() -> str:
    """Absolute logo URL for emails, or "" (the template then falls back to text)."""
    raw = str(getattr(config, "WEBSITE_PRIMARY_ICON", "") or "")
    if not raw:
        return ""
    if raw.startswith(("http://", "https://")):
        return raw
    path = raw if raw.startswith("/") else f"{settings.MEDIA_URL}{raw}"
    return f"{settings.ADMIN_BASE_URL}{path}"
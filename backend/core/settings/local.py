from .base import *
from .base import env, FRONTEND_DOMAIN, SERVER_DOMAIN, LOG_LEVEL, LOG_FILE
from .log_config import build_logging

DEBUG = True
SECRET_KEY = env("DJANGO_SECRET_KEY", default="local-development-only-not-a-secret")
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=["*"])

CORS_ALLOWED_ORIGINS = [
    f"{s}://{h}" for h in (FRONTEND_DOMAIN, SERVER_DOMAIN) for s in ("http", "https")
]

CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

LOGGING = build_logging(debug=True, level=LOG_LEVEL, log_file=LOG_FILE)
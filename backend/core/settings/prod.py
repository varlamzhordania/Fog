from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F401,F403
from .base import env, FRONTEND_URL, FRONTEND_DOMAIN, USE_HTTPS_IN_ABSOLUTE_URLS, LOG_LEVEL, LOG_FILE
from .log_config import build_logging

DEBUG = False

# Required: a missing value raises at startup instead of falling back to something unsafe.
SECRET_KEY = env("DJANGO_SECRET_KEY")
if len(SECRET_KEY) < 32:
    raise ImproperlyConfigured("DJANGO_SECRET_KEY must be at least 32 characters (run `make secret`).")

ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS")
if not ALLOWED_HOSTS or "*" in ALLOWED_HOSTS:
    raise ImproperlyConfigured("DJANGO_ALLOWED_HOSTS must list explicit hosts, not '*'.")

# nginx terminates TLS and redirects; tied to the flag so the first HTTP-only start still works.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True
SESSION_COOKIE_SECURE = USE_HTTPS_IN_ABSOLUTE_URLS
CSRF_COOKIE_SECURE = USE_HTTPS_IN_ABSOLUTE_URLS

CORS_ALLOWED_ORIGINS = [FRONTEND_URL, f"https://www.{FRONTEND_DOMAIN}"]

CACHES = {"default": {
    "BACKEND": "django.core.cache.backends.redis.RedisCache",
    "LOCATION": env("REDIS_HOST"),
}}
CONSTANCE_DATABASE_CACHE_BACKEND = "default"
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"

LOGGING = build_logging(debug=False, level=LOG_LEVEL, log_file=LOG_FILE)
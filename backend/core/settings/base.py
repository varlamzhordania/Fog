from pathlib import Path

import environ
from celery.schedules import crontab
from django.utils.translation import gettext_lazy as _

from core.ckeditor import BASE_CKEDITOR_5_CONFIGS
from core.unfold import (
    CUSTOM_UNFOLD_CONSTANCE_ADDITIONAL_FIELDS,
    UNFOLD_SETTINGS,
)
from .constance_config import (
    CONSTANCE_CONFIG, CONSTANCE_CONFIG_FIELDSETS, CONSTANCE_PUBLIC_KEYS,
)

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env()
if (BASE_DIR / ".env").exists():
    environ.Env.read_env(BASE_DIR / ".env")

DEBUG = False

UNFOLD_APPS = [
    "unfold",
    "unfold.contrib.filters",
    "unfold.contrib.forms",
    "unfold.contrib.inlines",
    "unfold.contrib.import_export",
    "unfold.contrib.constance",
    "unfold.contrib.simple_history",
]
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sitemaps",
]
THIRD_PARTY_APPS = [
    "constance",
    "constance.backends.database",
    "django_celery_beat",
    "django_ckeditor_5",
    "treebeard",
    "nested_admin",
    "rest_framework",
    "corsheaders",
    "drf_spectacular",
    "django_filters",
    "oauth2_provider",
    "social_django",
    "drf_social_oauth2",
    "import_export",
    "simple_history",
]
LOCAL_APPS = [
    "core",
    "account.apps.AccountConfig",
    "inventory.apps.InventoryConfig",
    "checkout.apps.CheckoutConfig",
    "settings.apps.SettingsConfig",
]
INSTALLED_APPS = UNFOLD_APPS + DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    "core.logging.middleware.RequestLogMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "simple_history.middleware.HistoryRequestMiddleware",
]

ROOT_URLCONF = "core.urls"
WSGI_APPLICATION = "core.wsgi.application"
ASGI_APPLICATION = "core.asgi.application"

TEMPLATES = [{
    "BACKEND": "django.template.backends.django.DjangoTemplates",
    "DIRS": [BASE_DIR / "templates"],
    "APP_DIRS": True,
    "OPTIONS": {"context_processors": [
        "django.template.context_processors.debug",
        "django.template.context_processors.request",
        "django.contrib.auth.context_processors.auth",
        "django.contrib.messages.context_processors.messages",
        "social_django.context_processors.backends",
        "social_django.context_processors.login_redirect",
    ]},
}]

DB_ENGINE = env("DB_ENGINE", default="sqlite3")
if DB_ENGINE in ("postgresql", "mysql"):
    DATABASES = {"default": {
        "ENGINE": f"django.db.backends.{DB_ENGINE}",
        "NAME": env("DB_NAME", default="mydatabase"),
        "USER": env("DB_USER", default="myuser"),
        "PASSWORD": env("DB_PASSWORD", default="mypassword"),
        "HOST": env("DB_HOST", default="localhost"),
        "PORT": env(
            "DB_PORT",
            default="5432" if DB_ENGINE == "postgresql" else "3306"
        ),
    }}
else:
    DATABASES = {"default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

AUTH_USER_MODEL = "account.User"
AUTHENTICATION_BACKENDS = [
    "account.backends.EmailBackend",
    "drf_social_oauth2.backends.DjangoOAuth2",
    "django.contrib.auth.backends.ModelBackend",
]
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": f"django.contrib.auth.password_validation.{n}"}
    for n in (
        "UserAttributeSimilarityValidator", "MinimumLengthValidator",
        "CommonPasswordValidator", "NumericPasswordValidator",
    )
]
PASSWORD_RESET_TIMEOUT = 60 * 60 * 24
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "core.api.authentication.LoggedOAuth2Authentication"],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_PAGINATION_CLASS": "core.api.pagination.CustomPageNumberPagination",
    "PAGE_SIZE": 25,
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "EXCEPTION_HANDLER": "core.api.exception_handler.exception_handler",
    "DEFAULT_THROTTLE_RATES": {"password_reset_email": "3/hour"},
}

OAUTH2_PROVIDER = {
    "ACCESS_TOKEN_EXPIRE_SECONDS": 60 * 60,            # 1 hour
    "REFRESH_TOKEN_EXPIRE_SECONDS": 60 * 60 * 24 * 7,  # same as the 7-day cookie
    "ROTATE_REFRESH_TOKEN": True,
    "REFRESH_TOKEN_GRACE_PERIOD_SECONDS": 60,          # tolerate two tabs refreshing together
}

SPECTACULAR_SETTINGS = {
    "TITLE": "FOG E-commerce",
    "DESCRIPTION": "FOG E-commerce website API guide",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True
LANGUAGES = (("en", _("English")), ("fr", _("French")),
             ("es", _("Spanish")), ("ar", _("Arabic")))
LOCALE_PATHS = [BASE_DIR / "locale"]

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

USE_HTTPS_IN_ABSOLUTE_URLS = env.bool(
    "USE_HTTPS_IN_ABSOLUTE_URLS",
    default=False
)
SERVER_DOMAIN = env("SERVER_DOMAIN", default="127.0.0.1:8000")
FRONTEND_DOMAIN = env("FRONTEND_DOMAIN", default="localhost:3000")
_scheme = "https" if USE_HTTPS_IN_ABSOLUTE_URLS else "http"
FRONTEND_URL = f"{_scheme}://{FRONTEND_DOMAIN}"
ADMIN_BASE_URL = f"{_scheme}://{SERVER_DOMAIN}"

CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = [
    f"https://{FRONTEND_DOMAIN}", f"https://www.{FRONTEND_DOMAIN}",
    f"http://{FRONTEND_DOMAIN}", f"http://www.{FRONTEND_DOMAIN}",
    f"https://{SERVER_DOMAIN}",
]

EMAIL_HOST = env("EMAIL_HOST", default="")
EMAIL_PORT = env.int("EMAIL_PORT", default=587)
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=True)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
EMAIL_TIMEOUT = 10
DEFAULT_FROM_EMAIL = env(
    "DEFAULT_FROM_EMAIL",
    default="FOG Direct <noreply@localhost>"
)
SERVER_EMAIL = DEFAULT_FROM_EMAIL

CELERY_BROKER_URL = env(
    "CELERY_BROKER_URL",
    default="redis://redis:6379/0"
)
CELERY_RESULT_BACKEND = env(
    "CELERY_RESULT_BACKEND",
    default="redis://redis:6379/1"
)
CELERY_TASK_ACKS_LATE = True
CELERY_WORKER_PREFETCH_MULTIPLIER = 1
CELERY_TASK_TIME_LIMIT = 120
CELERY_TASK_SOFT_TIME_LIMIT = 90
CELERY_WORKER_HIJACK_ROOT_LOGGER = False
CELERY_TASK_ROUTES = {
    "checkout.tasks.send_order_email": {"queue": "emails"},
    "account.tasks.send_password_reset_email_task": {"queue": "emails"},
}
CELERY_BEAT_SCHEDULE = {
    "expire-unpaid-orders": {"task": "checkout.tasks.expire_unpaid_orders",
                             "schedule": 60.0},
    "payment-reminders": {"task": "checkout.tasks.send_payment_reminders",
                          "schedule": 300.0},
    "reconcile-stripe": {
        "task": "checkout.tasks.reconcile_stripe_payments",
        "schedule": 300.0},
    "admin-digest": {"task": "checkout.tasks.send_admin_digest",
                     "schedule": crontab(hour=8, minute=0)},
    "clear-oauth-tokens": {
        "task": "account.tasks.clear_expired_oauth_tokens",
        "schedule": crontab(hour=3, minute=30)},
}

CKEDITOR_5_CONFIGS = BASE_CKEDITOR_5_CONFIGS
CONSTANCE_BACKEND = "constance.backends.database.DatabaseBackend"
CONSTANCE_IGNORE_ADMIN_VERSION_CHECK = True
CONSTANCE_ADDITIONAL_FIELDS = CUSTOM_UNFOLD_CONSTANCE_ADDITIONAL_FIELDS
UNFOLD = {**UNFOLD_SETTINGS, "SITE_URL": FRONTEND_URL}

LOG_LEVEL = env("LOG_LEVEL", default="INFO").upper()
LOG_FILE = env("LOG_FILE", default="")

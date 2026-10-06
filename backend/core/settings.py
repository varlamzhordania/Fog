import uuid
import environ

from collections import OrderedDict
from pathlib import Path
from django.utils.translation import gettext_lazy as _
from celery.schedules import crontab

from core.ckeditor import BASE_CKEDITOR_5_CONFIGS
from core.unfold import (
    UNFOLD_SETTINGS,
    CUSTOM_UNFOLD_CONSTANCE_ADDITIONAL_FIELDS,
)

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env()

if (BASE_DIR / ".env").exists():
    environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = env('DJANGO_SECRET_KEY', default=str(uuid.uuid4()))

DEBUG = env.bool('DJANGO_DEBUG', default=True)

if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    USE_X_FORWARDED_HOST = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    # SECURE_SSL_REDIRECT = True
# delete SECURE_SSL_REDIRECT and SECURE_REDIRECT_EXEMPT FOR NGINX

ALLOWED_HOSTS = env.list('DJANGO_ALLOWED_HOSTS', default=['*'])

# Unfold apps
UNFOLD_APPS = [
    "unfold",
    "unfold.contrib.filters",
    "unfold.contrib.forms",
    "unfold.contrib.inlines",
    "unfold.contrib.import_export",
    "unfold.contrib.constance",
    "unfold.contrib.simple_history",
    # "unfold.contrib.guardian",
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
    # Live runtime configuration (Must follow unfold.contrib.constance)
    "constance",
    "constance.backends.database",
    # Celery
    "django_celery_beat",
    # Rich text editor & trees
    "django_ckeditor_5",
    "treebeard",
    "nested_admin",
    # REST Framework & API tooling
    "rest_framework",
    "corsheaders",
    "drf_spectacular",
    "django_filters",
    # Auth & OAuth
    "oauth2_provider",
    "social_django",
    "drf_social_oauth2",
    # Import / Export (Must follow unfold.contrib.import_export)
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
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'simple_history.middleware.HistoryRequestMiddleware',
    # 'hijack.middleware.HijackUserMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'social_django.context_processors.backends',
                'social_django.context_processors.login_redirect',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'
ASGI_APPLICATION = 'core.asgi.application'

DB_ENGINE = env("DB_ENGINE", default="sqlite3")

if DB_ENGINE == "postgresql":
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': env('DB_NAME', default='mydatabase'),
            'USER': env('DB_USER', default='myuser'),
            'PASSWORD': env('DB_PASSWORD', default='mypassword'),
            'HOST': env('DB_HOST', default='localhost'),
            'PORT': env('DB_PORT', default='5432'),
            # Default port for PostgreSQL
        }
    }
elif DB_ENGINE == "mysql":
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': env("DB_NAME", default='mydatabase'),
            'USER': env("DB_USER", default='myuser'),
            'PASSWORD': env("DB_PASSWORD", default='mypassword'),
            'HOST': env("DB_HOST", default='localhost'),
            'PORT': env("DB_PORT", default='3306'),
            # Default port for MySQL
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True

LANGUAGES = (
    ('en', _('English')),
    ('fr', _('French')),
    ('es', _('Spanish')),
    ('ar', _('Arabic')),
)

PARLER_LANGUAGES = {
    None: (
        {'code': 'en', },  # English
        {'code': 'fr', },  # French
        {'code': 'es', },  # Spanish
        {'code': 'ar', },  # Arabic
    ),
    'default': {
        'fallback': 'en',  # defaults to PARLER_DEFAULT_LANGUAGE_CODE
        'hide_untranslated': False,
        # the default; let .active_translations() return fallbacks too.
    }
}

LOCALE_PATHS = [
    BASE_DIR / 'locale/',
]

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

STATICFILES_DIRS = [
    BASE_DIR / "static"
]

# Uncomment if using ckeditor
CKEDITOR_BASEPATH = "/static/ckeditor/ckeditor/"
CKEDITOR_UPLOAD_PATH = "uploads/"

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_USER_MODEL = "account.User"

AUTHENTICATION_BACKENDS = [
    'account.backends.EmailBackend',
    'drf_social_oauth2.backends.DjangoOAuth2',
    'django.contrib.auth.backends.ModelBackend',
]

ACTIVATE_JWT = True

# REST Framework Settings
REST_FRAMEWORK = {
    # Authentication Settings
    'DEFAULT_AUTHENTICATION_CLASSES': [
        # 'rest_framework.authentication.SessionAuthentication',
        # 'rest_framework.authentication.TokenAuthentication',
        'oauth2_provider.contrib.rest_framework.OAuth2Authentication',
        # 'drf_social_oauth2.authentication.SocialAuthentication',
    ],

    'DEFAULT_PERMISSION_CLASSES': [
        # 'rest_framework.permissions.IsAuthenticated',
        'rest_framework.permissions.AllowAny',
    ],

    # 'DEFAULT_THROTTLE_CLASSES': [
    #     'rest_framework.throttling.AnonRateThrottle',
    #     # Rate limiting for anonymous users
    #     'rest_framework.throttling.UserRateThrottle',
    #     # Rate limiting for authenticated users
    # ],
    # 'DEFAULT_THROTTLE_RATES': {
    #     'anon': '100/day',  # Limit anonymous users to 100 requests per day
    #     'user': '1000/day',
    #     # Limit authenticated users to 1000 requests per day
    # },

    'DEFAULT_PAGINATION_CLASS': 'core.pagination.CustomPageNumberPagination',
    'PAGE_SIZE': 25,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'FOG E-commerce',
    'DESCRIPTION': 'FOG E-commerce website API guide',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    # OTHER SETTINGS
}

# Channels Settings
CHANNEL_LAYERS = {
    'default': {
        "BACKEND": "channels.layers.InMemoryChannelLayer"
        # 'BACKEND': 'channels_redis.core.RedisChannelLayer',
        # 'CONFIG': {
        #     "hosts": [env('REDIS_HOST', default='redis://localhost:6379')],
        #     "capacity": 1000,  # 🔹 Increase buffer size to allow more messages
        #     "expiry": 10,  # 🔹 Reduce expiry to clear old messages faster
        # },
    },
}

USE_HTTPS_IN_ABSOLUTE_URLS = env.bool(
    "USE_HTTPS_IN_ABSOLUTE_URLS",
    default=False
)

SERVER_DOMAIN = env("SERVER_DOMAIN", default="127.0.0.1:8000")
FRONTEND_DOMAIN = env("FRONTEND_DOMAIN", default="localhost:3000")

BASE_DOMAIN = FRONTEND_DOMAIN
FRONTEND_URL = f"{'https' if USE_HTTPS_IN_ABSOLUTE_URLS else 'http'}://{FRONTEND_DOMAIN}"
ADMIN_BASE_URL = f"{'https' if USE_HTTPS_IN_ABSOLUTE_URLS else 'http'}://{SERVER_DOMAIN}"

if DEBUG:
    CORS_ALLOWED_ORIGINS = [
        f"http://{FRONTEND_DOMAIN}",
        f"https://{FRONTEND_DOMAIN}",
        f"http://{SERVER_DOMAIN}",
        f"https://{SERVER_DOMAIN}",
    ]
else:
    CORS_ALLOWED_ORIGINS = [
        FRONTEND_URL,
        f"https://www.{FRONTEND_DOMAIN}",
        # optional, for users typing www.
    ]

CSRF_TRUSTED_ORIGINS = [
    f"https://{FRONTEND_DOMAIN}",
    f"https://www.{FRONTEND_DOMAIN}",
    f"http://{FRONTEND_DOMAIN}",
    f"http://www.{FRONTEND_DOMAIN}",
]

CSRF_TRUSTED_ORIGINS += [
    f"https://{SERVER_DOMAIN}",
]

CORS_ALLOW_CREDENTIALS = True

if not DEBUG:
    CACHES = {
        'default': {
            # 'BACKEND': 'django.core.cache.backends.memcached.PyMemcacheCache',
            "BACKEND": "django.core.cache.backends.redis.RedisCache",
            # 'LOCATION': env('MEMCACHE_HOST', default='127.0.0.1:11211'),
            'LOCATION': env("REDIS_HOST"),
            # Use the REDIS_HOST environment variable
        }

    }
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
else:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        }
    }
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

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

# Uncomment if Using RabbitMQ
RABBITMQ_HOST = env("RABBITMQ_HOST", default="")
RABBITMQ_PORT = env("RABBITMQ_PORT", default="")
RABBITMQ_USER = env("RABBITMQ_USER", default="")
RABBITMQ_PASSWORD = env("RABBITMQ_PASSWORD", default="")
RABBITMQ_QUEUE_NAME = env("RABBITMQ_QUEUE_NAME", default="")
RABBITMQ_VHOST = env("RABBITMQ_VHOST", default="")

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
}

CKEDITOR_5_CONFIGS = BASE_CKEDITOR_5_CONFIGS
PHONENUMBER_DEFAULT_FORMAT = "INTERNATIONAL"

# ==============================================================================
# CONSTANCE RUNTIME CONFIGURATION
# ==============================================================================

CONSTANCE_BACKEND = "constance.backends.database.DatabaseBackend"
if not DEBUG:
    CONSTANCE_DATABASE_CACHE_BACKEND = "default"
CONSTANCE_IGNORE_ADMIN_VERSION_CHECK = True

CONSTANCE_ADDITIONAL_FIELDS = CUSTOM_UNFOLD_CONSTANCE_ADDITIONAL_FIELDS

CONSTANCE_CONFIG = OrderedDict(
    [
        # -------------------------------------------------------------------------
        # 1. Website Branding & Identity
        # -------------------------------------------------------------------------
        (
            "WEBSITE_TITLE",
            (
                "FOG | Mycology Research & Supplies",
                "Authoritative site name used in browser tabs and layout headers.",
                str,
            ),
        ),
        (
            "WEBSITE_TAGLINE",
            (
                "Premium Spore Microscopy & Laboratory Supplies",
                "Short brand subtitle or tagline displayed in the header or hero section.",
                str,
            ),
        ),
        (
            "WEBSITE_FAVICON",
            (
                "/imgs/logo_black_2.png",
                "Browser favicon (.ico or .png).",
                "image_field",
            ),
        ),
        (
            "WEBSITE_PRIMARY_ICON",
            (
                "/imgs/logo_black_2.png",
                "Primary brand logo used on default/light backgrounds.",
                "image_field",
            ),
        ),
        (
            "WEBSITE_SECONDARY_ICON",
            (
                "/imgs/logo_white.png",
                "Secondary brand logo used on dark or contrasting backgrounds.",
                "image_field",
            ),
        ),
        # -------------------------------------------------------------------------
        # . Notifications
        # -------------------------------------------------------------------------

        (
            "ORDER_ADMIN_EMAILS",
            (
                "",
                "Comma-separated addresses for order alerts. Empty = all active staff in the admin/support groups.",
                str,
            ),
        ),
        (
            "NOTIFY_CUSTOMERS",
            (
                True,
                "Send order status emails to customers.",
                bool
            )
        ),
        # -------------------------------------------------------------------------
        # 2. SEO & Social Metadata
        # -------------------------------------------------------------------------
        (
            "WEBSITE_META_DESCRIPTION",
            (
                "Source for premium mycology genetics, research spores, laboratory "
                "equipment, and cultivation media. Secure anonymous cryptocurrency checkout.",
                "Default fallback description used for meta tags and search crawlers.",
                str,
            ),
        ),
        (
            "WEBSITE_META_KEYWORDS",
            (
                "mycology, spore microscopy, research genetics, lab supplies, crypto checkout",
                "Comma-separated default SEO keywords.",
                str,
            ),
        ),
        (
            "WEBSITE_OG_IMAGE",
            (
                "og-cover.jpg",
                "Default 1200x630 Open Graph preview image for social sharing.",
                "image_field",
            ),
        ),

        # -------------------------------------------------------------------------
        # 3. Header & Announcement Bar
        # -------------------------------------------------------------------------
        (
            "ANNOUNCEMENT_BAR_ENABLED",
            (
                True,
                "Toggle the top notification banner across storefront pages.",
                bool,
            ),
        ),
        (
            "ANNOUNCEMENT_BAR_TEXT",
            (
                "Notice: All spore materials are intended strictly for taxonomy "
                "and microscopy research.",
                "Banner message displayed at the top of the viewport.",
                str,
            ),
        ),
        (
            "ANNOUNCEMENT_BAR_LINK",
            (
                "http://localhost:3000/pages/research-policy",
                "Optional URL destination when users click the announcement banner.",
                "link_field",
            ),
        ),

        # -------------------------------------------------------------------------
        # 4. Legal Compliance & Footer
        # -------------------------------------------------------------------------
        (
            "LEGAL_RESEARCH_DISCLAIMER",
            (
                "All psilocybe spore syringes and microscopy prints are sold exclusively "
                "for research, taxonomy, and educational identification purposes under "
                "high-power microscopy. Cultivation of regulated species is strictly "
                "prohibited. Sales are void where prohibited.",
                "Mandatory legal disclaimer displayed on product detail pages and footer.",
                str,
            ),
        ),
        (
            "FOOTER_COPYRIGHT_TEXT",
            (
                "© 2026 FOG Mycology Research Lab. All rights reserved.",
                "Copyright line rendered at the bottom of the storefront layout.",
                str,
            ),
        ),

        # -------------------------------------------------------------------------
        # 5. Community & Support
        # -------------------------------------------------------------------------
        (
            "SUPPORT_EMAIL",
            (
                "support@fog-mycology.example",
                "Contact email displayed to users for payment discrepancies or expired orders.",
                str,
            ),
        ),
        (
            "COMMUNITY_TELEGRAM_URL",
            (
                "https://t.me/fog_mycology",
                "Official Telegram group or announcement channel URL.",
                "link_field",
            ),
        ),
        (
            "COMMUNITY_DISCORD_URL",
            (
                "https://discord.gg/fog_mycology",
                "Official Discord community invite link. Leave empty if inactive.",
                "link_field",
            ),
        ),
        (
            "COMMUNITY_TWITTER_URL",
            (
                "https://x.com/fog_mycology",
                "Official X (Twitter) profile URL.",
                "link_field",
            ),
        ),

        # -------------------------------------------------------------------------
        # 6. Crypto Payment & Security
        # -------------------------------------------------------------------------
        (
            "CRYPTO_PAYMENT_WINDOW_MINUTES",
            (
                60,
                "Expiration window for pending crypto payments, in minutes.",
                int,
            ),
        ),
        (
            "CRYPTO_REQUIRED_CONFIRMATIONS",
            (
                2,
                "Number of on-chain confirmations required before marking an order confirmed.",
                int,
            ),
        ),
        (
            "CRYPTO_EXCHANGE_BUFFER_PERCENT",
            (
                2.0,
                "Volatility buffer percentage added to crypto order estimates.",
                float,
            ),
        ),

        # -------------------------------------------------------------------------
        # 7. Stripe Payment
        # -------------------------------------------------------------------------
        (
            "STRIPE_SECRET_KEY",
            (
                "sk_***",
                "Stripe secret API key used by the backend to create and manage payments.",
                str,
            ),
        ),
        (
            "STRIPE_PUBLISHABLE_KEY",
            (
                "pk_***",
                "Stripe publishable key exposed to the storefront for client-side Stripe integration.",
                str,
            ),
        ),
        (
            "STRIPE_WEBHOOK_KEY",
            (
                "whsec_***",
                "Stripe webhook signing secret used to verify incoming webhook requests.",
                str,
            ),
        ),

        # -------------------------------------------------------------------------
        # 8. Xcash Payment
        # -------------------------------------------------------------------------
        (
            "XCASH_API_URL",
            (
                "http://localhost",
                "Base URL of the Xcash payment server API.",
                str,
            ),
        ),
        (
            "XCASH_NOTIFY_URL",
            (
                "http://localhost/api/v1/checkout/webhooks/xcash/",
                "Webhook URL that Xcash uses to notify FOG about payment events.",
                str,
            ),
        ),
        (
            "XCASH_APPID",
            (
                "",
                "Xcash application ID used to authenticate payment API requests.",
                str,
            ),
        ),
        (
            "XCASH_HMAC_KEY",
            (
                "",
                "Secret HMAC key used to authenticate and verify Xcash payment requests.",
                str,
            ),
        ),

        # -------------------------------------------------------------------------
        # 7. Store Operations
        # -------------------------------------------------------------------------
        (
            "STORE_MAINTENANCE_MODE",
            (
                False,
                "Temporarily disable checkout and order creation for maintenance.",
                bool,
            ),
        ),
        (
            "MINIMUM_ORDER_AMOUNT_USD",
            (
                15.0,
                "Minimum cart value required to initiate anonymous crypto checkout.",
                float,
            ),
        ),

        # -------------------------------------------------------------------------
        # 8. Store Pricing & Tax
        # -------------------------------------------------------------------------
        (
            "TAX_ENABLED",
            (
                True,
                "Enable tax calculation during checkout.",
                bool,
            ),
        ),
        (
            "TAX_RATE",
            (
                18.0,
                "Tax rate applied to taxable orders, expressed as a percentage.",
                float,
            ),
        ),
        (
            "TAX_NAME",
            (
                "VAT",
                "Display name used for the configured tax.",
                str,
            ),
        ),
        (
            "PRICES_INCLUDE_TAX",
            (
                False,
                "Whether displayed product prices already include the configured tax.",
                bool,
            ),
        ),
    ]
)

CONSTANCE_CONFIG_FIELDSETS = OrderedDict(
    [
        (
            "Website Branding & Identity",
            {
                "fields": (
                    "WEBSITE_TITLE",
                    "WEBSITE_TAGLINE",
                    "WEBSITE_FAVICON",
                    "WEBSITE_PRIMARY_ICON",
                    "WEBSITE_SECONDARY_ICON",
                ),
            },
        ),

        (
            "SEO & Social Metadata",
            {
                "fields": (
                    "WEBSITE_META_DESCRIPTION",
                    "WEBSITE_META_KEYWORDS",
                    "WEBSITE_OG_IMAGE",
                ),
                "collapse": True,
            },
        ),
        (
            "Email & Notifications",
            {
                "fields": (
                    "ORDER_ADMIN_EMAILS",
                    "NOTIFY_CUSTOMERS",
                ),
                "collapse": True,
            },
        ),
        (
            "Header & Announcement Bar",
            {
                "fields": (
                    "ANNOUNCEMENT_BAR_ENABLED",
                    "ANNOUNCEMENT_BAR_TEXT",
                    "ANNOUNCEMENT_BAR_LINK",
                ),
                "collapse": True,
            },
        ),

        (
            "Legal Compliance & Footer",
            {
                "fields": (
                    "LEGAL_RESEARCH_DISCLAIMER",
                    "FOOTER_COPYRIGHT_TEXT",
                ),
                "collapse": True,
            },
        ),

        (
            "Community & Customer Support",
            {
                "fields": (
                    "SUPPORT_EMAIL",
                    "COMMUNITY_TELEGRAM_URL",
                    "COMMUNITY_DISCORD_URL",
                    "COMMUNITY_TWITTER_URL",
                ),
                "collapse": True,
            },
        ),
        (
            "Stripe Payment",
            {
                "fields": (
                    "STRIPE_SECRET_KEY",
                    "STRIPE_PUBLISHABLE_KEY",
                    "STRIPE_WEBHOOK_KEY",
                ),
                "collapse": True,
            },
        ),

        (
            "Xcash Payment",
            {
                "fields": (
                    "XCASH_API_URL",
                    "XCASH_NOTIFY_URL",
                    "XCASH_APPID",
                    "XCASH_HMAC_KEY",
                ),
                "collapse": True,
            },
        ),

        (
            "Crypto Payment & Security",
            {
                "fields": (
                    "CRYPTO_PAYMENT_WINDOW_MINUTES",
                    "CRYPTO_REQUIRED_CONFIRMATIONS",
                    "CRYPTO_EXCHANGE_BUFFER_PERCENT",
                ),
            },
        ),
        (
            "Store Operations",
            {
                "fields": (
                    "STORE_MAINTENANCE_MODE",
                    "MINIMUM_ORDER_AMOUNT_USD",
                ),
            },
        ),

        (
            "Store Pricing & Tax",
            {
                "fields": (
                    "TAX_ENABLED",
                    "TAX_RATE",
                    "TAX_NAME",
                    "PRICES_INCLUDE_TAX",
                ),
                "collapse": True,
            },
        ),
    ]
)

CONSTANCE_PUBLIC_KEYS = {
    "WEBSITE_TITLE",
    "WEBSITE_TAGLINE",
    "WEBSITE_FAVICON",
    "WEBSITE_PRIMARY_ICON",
    "WEBSITE_SECONDARY_ICON",
    "WEBSITE_META_DESCRIPTION",
    "WEBSITE_META_KEYWORDS",
    "WEBSITE_OG_IMAGE",
    "ANNOUNCEMENT_BAR_ENABLED",
    "ANNOUNCEMENT_BAR_TEXT",
    "ANNOUNCEMENT_BAR_LINK",
    "LEGAL_RESEARCH_DISCLAIMER",
    "FOOTER_COPYRIGHT_TEXT",
    "SUPPORT_EMAIL",
    "COMMUNITY_TELEGRAM_URL",
    "COMMUNITY_DISCORD_URL",
    "COMMUNITY_TWITTER_URL",
    "STORE_MAINTENANCE_MODE",
    "MINIMUM_ORDER_AMOUNT_USD",
    "TAX_ENABLED",
    "TAX_RATE",
    "TAX_NAME",
    "PRICES_INCLUDE_TAX",
}

UNFOLD = UNFOLD_SETTINGS

UNFOLD["SITE_URL"] = FRONTEND_URL

# Base log configuration
LOG_LEVEL = env("LOG_LEVEL", default="DEBUG").upper()
LOGS_DIR = BASE_DIR / "logs"
LOGS_DIR.mkdir(exist_ok=True)

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "filters": {
        "require_debug_false": {
            "()": "django.utils.log.RequireDebugFalse",
        },
        "require_debug_true": {
            "()": "django.utils.log.RequireDebugTrue",
        },
        "sensitive_data_filter": {
            "()": "core.logging.SensitiveDataFilter",
        },
    },
    "formatters": {
        "verbose": {
            "format": "[{asctime}] {levelname} [{name}:{lineno}] {message}",
            "style": "{",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
        "json": {
            "()": "pythonjsonlogger.jsonlogger.JsonFormatter",
            "format": "%(asctime)s %(levelname)s %(name)s %(module)s %(lineno)d %(process)d %(thread)d %(message)s",
            "datefmt": "%Y-%m-%dT%H:%M:%SZ",
        },
    },
    "handlers": {
        "console_dev": {
            "level": "DEBUG",
            "filters": ["require_debug_true", "sensitive_data_filter"],
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
        "console_prod": {
            "level": LOG_LEVEL,
            "filters": ["require_debug_false", "sensitive_data_filter"],
            "class": "logging.StreamHandler",
            "formatter": "json",
        },
        "file_app": {
            "level": LOG_LEVEL,
            "filters": ["sensitive_data_filter"],
            "class": "logging.handlers.RotatingFileHandler",
            "filename": LOGS_DIR / "fog.log",
            "maxBytes": 1024 * 1024 * 15,  # 15 MB
            "backupCount": 10,
            "formatter": "json" if not DEBUG else "verbose",
            "encoding": "utf-8",
        },
        "file_errors": {
            "level": "ERROR",
            "filters": ["sensitive_data_filter"],
            "class": "logging.handlers.RotatingFileHandler",
            "filename": LOGS_DIR / "errors.log",
            "maxBytes": 1024 * 1024 * 15,  # 15 MB
            "backupCount": 10,
            "formatter": "json" if not DEBUG else "verbose",
            "encoding": "utf-8",
        },
    },
    "loggers": {
        # Root logger
        "": {
            "handlers": ["console_dev", "console_prod", "file_app"],
            "level": LOG_LEVEL,
        },
        # Primary application logger (Use in views, services, tasks)
        "fog": {
            "handlers": ["console_dev", "console_prod", "file_app",
                         "file_errors"],
            "level": LOG_LEVEL,
            "propagate": False,
        },
        # Django HTTP & Core
        "django": {
            "handlers": ["console_dev", "console_prod", "file_app"],
            "level": "INFO",
            "propagate": False,
        },
        "django.request": {
            "handlers": ["console_dev", "console_prod", "file_errors"],
            "level": "WARNING",
            "propagate": False,
        },
        # Celery logger
        "celery": {
            "handlers": ["console_dev", "console_prod", "file_app"],
            "level": LOG_LEVEL,
            "propagate": False,
        },
    },
}

STATIC_VERSION = "1"

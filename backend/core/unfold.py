from django.templatetags.static import static
from django.urls import reverse_lazy
from django.utils.translation import gettext_lazy as _

# ==============================================================================
# DJANGO UNFOLD CONFIGURATION FOR FOG
# ==============================================================================

UNFOLD_SETTINGS = {
    # --------------------------------------------------------------------------
    # Branding & Header Information
    # --------------------------------------------------------------------------
    "SITE_TITLE": "FOG Operations Portal",
    "SITE_HEADER": "FOG Research Lab",
    "SITE_SUBHEADER": "Mycology Genetics & Anonymous Crypto E-Commerce",
    "SITE_VERSION": "1.0.0",
    "SITE_URL": "/",
    "SITE_SYMBOL": "science",
    # Material Symbol representing mycology lab operations

    # --------------------------------------------------------------------------
    # Header Shortcuts & Dropdown
    # --------------------------------------------------------------------------
    "SITE_DROPDOWN": [
        {
            "icon": "dashboard",
            "title": _("Dashboard"),
            "link": reverse_lazy("admin:index"),
        },
        {
            "icon": "storefront",
            "title": _("Public Storefront"),
            "link": "/",
            "attrs": {
                "target": "_blank",
            },
        },
        {
            "icon": "tune",
            "title": _("Live Dynamic Config"),
            "link": reverse_lazy("admin:constance_config_changelist"),
        },
    ],

    # --------------------------------------------------------------------------
    # Visual Assets & Favicons
    # --------------------------------------------------------------------------
    "SITE_FAVICONS": [
        {
            "rel": "icon",
            "sizes": "32x32",
            "type": "image/png",
            "href": lambda request: static("imgs/logo_black_2.png"),
        },
    ],

    # --------------------------------------------------------------------------
    # Environment & UI Telemetry
    # --------------------------------------------------------------------------
    "ENVIRONMENT": "core.utils.environment_callback",
    "SHOW_HISTORY": False,
    "SHOW_VIEW_ON_SITE": True,
    "SHOW_BACK_BUTTON": True,
    "SHOW_UI_WARNINGS": False,
    # "THEME": "auto",  # High-contrast dark theme by default

    # --------------------------------------------------------------------------
    # Color Palette: Mycology Emerald & Neutral Slate (OKLCH)
    # --------------------------------------------------------------------------
    "BORDER_RADIUS": "8px",
    "COLORS": {
        # Neutral Base Scale (Anchored by #FFFFFF, #E3E3E3, #A4ACB0, #000000)
        "base": {
            "50": "oklch(100% 0 0)",  # #FFFFFF (Pure White)
            "100": "oklch(96.8% 0.003 230)",  # #F4F6F7
            "200": "oklch(91.3% 0.003 230)",
            # #E3E3E3 (Client Neutral Light)
            "300": "oklch(82.5% 0.006 230)",  # #C5CBCE
            "400": "oklch(73.5% 0.010 230)",
            # #A4ACB0 (Client Slate Midtone)
            "500": "oklch(58.0% 0.014 230)",  # #788288
            "600": "oklch(44.0% 0.015 230)",  # #535C62
            "700": "oklch(33.0% 0.014 230)",  # #373E43
            "800": "oklch(22.0% 0.012 230)",  # #202528
            "900": "oklch(12.0% 0.008 230)",  # #101315
            "950": "oklch(0% 0 0)",  # #000000 (Pure Black Canvas)
        },

        # Primary Accent Scale (Anchored by #0C6E99 Ocean Blue)
        "primary": {
            "50": "oklch(96.5% 0.020 230)",  # #E8F4F9
            "100": "oklch(91.5% 0.045 230)",  # #CCE8F3
            "200": "oklch(82.5% 0.080 230)",  # #9CD2E8
            "300": "oklch(72.5% 0.115 230)",  # #5BB5D9
            "400": "oklch(62.5% 0.135 230)",  # #2698C5
            "500": "oklch(55.0% 0.130 230)",  # #0F82B4
            "600": "oklch(49.8% 0.125 230)",
            # #0C6E99 (Authoritative Client Primary)
            "700": "oklch(41.5% 0.105 230)",  # #0A577B
            "800": "oklch(33.5% 0.085 230)",  # #094460
            "900": "oklch(25.5% 0.065 230)",  # #07344A
            "950": "oklch(16.5% 0.045 230)",  # #041D2B
        },

        # Typography & Text Tokens
        "font": {
            "subtle-light": "var(--color-base-500)",
            # text-base-500 (#788288)
            "subtle-dark": "var(--color-base-400)",
            # text-base-400 (#A4ACB0)
            "default-light": "var(--color-base-600)",
            # text-base-600 (#535C62)
            "default-dark": "var(--color-base-200)",
            # text-base-200 (#E3E3E3)
            "important-light": "var(--color-base-950)",
            # text-base-950 (#000000)
            "important-dark": "var(--color-base-50)",
            # text-base-50 (#FFFFFF)
        },
    },

    # --------------------------------------------------------------------------
    # Sidebar Navigation Structure
    # --------------------------------------------------------------------------
    "SIDEBAR": {
        "show_search": True,
        "show_all_applications": True,
        # Ensures unlisted models remain discoverable
        "navigation": [
            {
                "title": _("Operations & Orders"),
                "separator": True,
                "collapsible": True,
                "items": [
                    {
                        "title": _("Dashboard"),
                        "icon": "dashboard",
                        "link": reverse_lazy("admin:index"),
                    },
                    {
                        "title": _("Orders & Checkout"),
                        "icon": "receipt_long",
                        "link": reverse_lazy(
                            "admin:checkout_order_changelist"
                        ),
                        "badge": "core.utils.pending_orders_badge_callback",
                        "badge_variant": "warning",
                        "badge_style": "solid",
                        "badge_class": "ml-auto text-xs font-semibold",
                    },
                ],
            },
            {
                "title": _("Catalog & Genetics"),
                "separator": True,
                "collapsible": True,
                "items": [
                    {
                        "title": _("Products"),
                        "icon": "inventory_2",
                        "link": reverse_lazy(
                            "admin:inventory_product_changelist"
                        ),
                    },
                    {
                        "title": _("Categories"),
                        "icon": "category",
                        "link": reverse_lazy(
                            "admin:inventory_category_changelist"
                        ),
                    },
                ],
            },
            {
                "title": _("Accounts & Access"),
                "separator": True,
                "collapsible": True,
                "items": [
                    {
                        "title": _("Users"),
                        "icon": "people",
                        "link": reverse_lazy(
                            "admin:account_user_changelist"
                        ),
                    },
                    {
                        "title": _("Groups & Permissions"),
                        "icon": "shield_person",
                        "link": reverse_lazy(
                            "admin:auth_group_changelist"
                        ),
                    },
                ],
            },
            {
                "title": _("System & Configuration"),
                "separator": True,
                "collapsible": True,
                "items": [
                    {
                        "title": _("Live Config (Constance)"),
                        "icon": "tune",
                        "link": reverse_lazy(
                            "admin:constance_config_changelist"
                        ),
                        "permission": lambda
                            request: request.user.is_superuser,
                    },
                    {
                        "title": _("OAuth Applications"),
                        "icon": "key",
                        "link": reverse_lazy(
                            "admin:oauth2_provider_application_changelist"
                        ),
                        "permission": lambda
                            request: request.user.is_superuser,
                    },
                ],
            },
        ],
    },

    # --------------------------------------------------------------------------
    # Tabbed Navigation on Model Change Views
    # --------------------------------------------------------------------------
    "TABS": [
        {
            "models": [
                "inventory.product",
                "inventory.category",
            ],
            "items": [
                {
                    "title": _("Products"),
                    "link": reverse_lazy(
                        "admin:inventory_product_changelist"
                    ),
                },
                {
                    "title": _("Categories"),
                    "link": reverse_lazy(
                        "admin:inventory_category_changelist"
                    ),
                },
            ],
        },
    ],
}

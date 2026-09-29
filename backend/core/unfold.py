from django.templatetags.static import static
from django.urls import reverse, reverse_lazy
from django.utils.functional import lazy
from django.utils.translation import gettext_lazy as _
from unfold.contrib.constance.settings import \
    UNFOLD_CONSTANCE_ADDITIONAL_FIELDS


# ------------------------------------------------------------------------------
# Navigation helpers
# ------------------------------------------------------------------------------
def _changelist_url(model, query=""):
    url = reverse(f"admin:{model.replace('.', '_')}_changelist")
    return f"{url}?{query}" if query else url


# Lazy admin changelist URL, optionally pre-filtered:
#   changelist("checkout.order", "status__exact=pending")
changelist = lazy(_changelist_url, str)


def superuser_only(request):
    return request.user.is_superuser


def can_view(model):
    """Permission callback: user may view (or change) the given "app.model"."""
    app_label, model_name = model.split(".")

    def check(request):
        return request.user.has_perm(
            f"{app_label}.view_{model_name}"
        ) or request.user.has_perm(f"{app_label}.change_{model_name}")

    return check


def nav_item(title, icon, model, permission=None, badge=None,
             badge_variant="warning"):
    """Sidebar link to a model changelist, hidden without view permission."""
    item = {
        "title": title,
        "icon": icon,
        "link": changelist(model),
        "permission": permission or can_view(model),
    }

    if badge:
        item.update({
            "badge": badge,
            "badge_variant": badge_variant,
            "badge_style": "solid",
            "badge_class": "ml-auto text-xs font-semibold !rounded-full",
        })

    return item


def model_tab(title, model, permission=None):
    """Tab linking to a model changelist."""
    return {
        "title": title,
        "link": changelist(model),
        "permission": permission or can_view(model),
    }


def status_tabs(model, choices, param="status__exact"):
    """
    "All" tab followed by one pre-filtered tab per (title, value) choice.
    The "All" tab is only active while no status filter is applied.
    """
    permission = can_view(model)

    return [
        {
            "title": _("All"),
            "link": changelist(model),
            "permission": permission,
            "active": lambda request: param not in request.GET,
        },
        *[
            {
                "title": title,
                "link": changelist(model, f"{param}={value}"),
                "permission": permission,
            }
            for title, value in choices
        ],
    ]

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
            "icon": "add_box",
            "title": _("Add Product"),
            "link": reverse_lazy("admin:inventory_product_add"),
        },
        {
            "icon": "pending_actions",
            "title": _("Orders to Review"),
            "link": changelist("checkout.order", "status__exact=pending"),
        },
        {
            "icon": "local_shipping",
            "title": _("Pending Shipments"),
            "link": changelist(
                "checkout.ordershipment", "status__exact=pending"
            ),
        },
        {
            "icon": "warehouse",
            "title": _("Stock Levels"),
            "link": changelist("inventory.productstock"),
        },
        {
            "icon": "tune",
            "title": _("Live Dynamic Config"),
            "link": reverse_lazy("admin:constance_config_changelist"),
        },
        {
            "icon": "storefront",
            "title": _("Public Storefront"),
            "link": "core.utils.storefront_url",
            "attrs": {
                "target": "_blank",
            },
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
    "SHOW_HISTORY": True,
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
    # Command Palette (Ctrl/Cmd + K) - quick access to any record or model
    # --------------------------------------------------------------------------
    "COMMAND": {
        "search_models": True,
        "show_history": True,
    },

    # --------------------------------------------------------------------------
    # Account Menu (user dropdown in the sidebar footer)
    # --------------------------------------------------------------------------
    "ACCOUNT": {
        "navigation": [
            {
                "title": _("My profile"),
                "link": lambda request: reverse(
                    "admin:account_user_change", args=[request.user.pk]
                ),
            },
            {
                "title": _("Change password"),
                "link": reverse_lazy("admin:password_change"),
            },
        ],
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
                "title": _("Overview"),
                "items": [
                    {
                        "title": _("Dashboard"),
                        "icon": "dashboard",
                        "link": reverse_lazy("admin:index"),
                    },
                ],
            },
            {
                "title": _("Sales & Fulfilment"),
                "separator": True,
                "collapsible": True,
                "items": [
                    nav_item(
                        _("Orders"), "receipt_long", "checkout.order",
                        badge="core.utils.pending_orders_badge_callback",
                        badge_variant="warning",
                    ),
                    nav_item(
                        _("Payments"), "payments", "checkout.orderpayment",
                    ),
                    nav_item(
                        _("Shipments"), "local_shipping",
                        "checkout.ordershipment",
                        badge="core.utils.pending_shipments_badge_callback",
                        badge_variant="info",
                    ),
                    nav_item(
                        _("Shopping Carts"), "shopping_cart",
                        "checkout.shoppingcart",
                    ),
                    nav_item(
                        _("Payment Methods"), "credit_card",
                        "checkout.paymentmethod",
                    ),
                ],
            },
            {
                "title": _("Catalog & Genetics"),
                "separator": True,
                "collapsible": True,
                "items": [
                    nav_item(_("Products"), "inventory_2", "inventory.product"),
                    nav_item(_("Categories"), "category", "inventory.category"),
                    nav_item(_("Tags"), "sell", "inventory.tag"),
                    nav_item(
                        _("General Media"), "perm_media", "inventory.media",
                        permission=superuser_only,
                    ),
                ],
            },
            {
                "title": _("Inventory"),
                "separator": True,
                "collapsible": True,
                "items": [
                    nav_item(
                        _("Stock Levels"), "warehouse",
                        "inventory.productstock",
                        badge="core.utils.low_stock_badge_callback",
                        badge_variant="danger",
                    ),
                    nav_item(
                        _("Reservations"), "lock_clock",
                        "inventory.stockreservation",
                    ),
                    nav_item(
                        _("Stock Log"), "history",
                        "inventory.stocktransactionlog",
                    ),
                ],
            },
            {
                "title": _("Customers & Access"),
                "separator": True,
                "collapsible": True,
                "items": [
                    nav_item(_("Users"), "people", "account.user"),
                    nav_item(_("Addresses"), "location_on", "account.address"),
                    nav_item(
                        _("Groups & Permissions"), "shield_person",
                        "auth.group",
                    ),
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
                        "permission": superuser_only,
                    },
                    nav_item(
                        _("OAuth Applications"), "key",
                        "oauth2_provider.application",
                        permission=superuser_only,
                    ),
                    nav_item(
                        _("OAuth Access Tokens"), "vpn_key",
                        "oauth2_provider.accesstoken",
                        permission=superuser_only,
                    ),
                    # nav_item(
                    #     _("Social Accounts"), "link",
                    #     "social_django.usersocialauth",
                    #     permission=superuser_only,
                    # ),
                ],
            },
        ],
    },

    # --------------------------------------------------------------------------
    # Tabbed Navigation on Model Changelists
    # (status tabs are pre-filtered changelists, "All" clears the filter)
    # --------------------------------------------------------------------------
    "TABS": [
        {
            "models": ["checkout.order"],
            "items": status_tabs("checkout.order", [
                (_("Awaiting Payment"), "payment"),
                (_("Pending"), "pending"),
                (_("Processing"), "processing"),
                (_("Shipped"), "shipped"),
                (_("Delivered"), "delivered"),
                (_("Cancelled"), "cancelled"),
            ]),
        },
        {
            "models": ["checkout.orderpayment"],
            "items": status_tabs("checkout.orderpayment", [
                (_("Pending"), "PENDING"),
                (_("Completed"), "COMPLETED"),
                (_("Failed"), "FAILED"),
                (_("Refunded"), "REFUNDED"),
            ]),
        },
        {
            "models": ["checkout.ordershipment"],
            "items": status_tabs("checkout.ordershipment", [
                (_("Pending"), "pending"),
                (_("In Transit"), "in_transit"),
                (_("Delivered"), "delivered"),
            ]),
        },
        {
            "models": [
                "inventory.product",
                "inventory.category",
                "inventory.tag",
                "inventory.media",
            ],
            "items": [
                model_tab(_("Products"), "inventory.product"),
                model_tab(_("Categories"), "inventory.category"),
                model_tab(_("Tags"), "inventory.tag"),
                model_tab(
                    _("Media"), "inventory.media", permission=superuser_only
                ),
            ],
        },
        {
            "models": [
                "inventory.productstock",
                "inventory.stockreservation",
                "inventory.stocktransactionlog",
            ],
            "items": [
                model_tab(_("Stock Levels"), "inventory.productstock"),
                model_tab(_("Reservations"), "inventory.stockreservation"),
                model_tab(_("Stock Log"), "inventory.stocktransactionlog"),
            ],
        },
        {
            "models": [
                "account.user",
                "account.address",
                "auth.group",
            ],
            "items": [
                model_tab(_("Users"), "account.user"),
                model_tab(_("Addresses"), "account.address"),
                model_tab(_("Groups"), "auth.group"),
            ],
        },
    ],
}


CUSTOM_UNFOLD_CONSTANCE_ADDITIONAL_FIELDS = {
    **UNFOLD_CONSTANCE_ADDITIONAL_FIELDS,
    "link_field": [
        "django.forms.URLField",
        {
            "widget": "unfold.widgets.UnfoldAdminURLInputWidget",
        },
    ],
}

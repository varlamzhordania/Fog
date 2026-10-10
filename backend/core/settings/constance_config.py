from collections import OrderedDict
import os


def _env(name, default=""):
    return os.environ.get(name, default)


CONSTANCE_CONFIG = OrderedDict(
    [
        # =========================================================================
        # 1. Website Branding & Identity
        # =========================================================================
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

        # =========================================================================
        # 2. Header & Announcement
        # =========================================================================
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

        # =========================================================================
        # 3. SEO & Social Metadata
        # =========================================================================
        (
            "WEBSITE_META_DESCRIPTION",
            (
                "Mycology research materials, laboratory supplies, grow kits and cultivation media. Pay by card or cryptocurrency.",
                "Default fallback description used for meta tags and search crawlers.",
                str,
            ),
        ),
        (
            "WEBSITE_META_KEYWORDS",
            (
                "mycology, spore microscopy, lab supplies, grow kits, cultivation media",
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

        # =========================================================================
        # 4. Store Operations
        # =========================================================================
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
                "Minimum cart value required to initiate checkout.",
                float,
            ),
        ),
        (
            "PRODUCT_REVIEWS_ENABLED",
            (
                True,
                "Allow verified buyers to post and edit product ratings and comments. "
                "Existing reviews stay visible when turned off.",
                bool,
            ),
        ),

        # =========================================================================
        # 5. Store Pricing & Tax
        # =========================================================================
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
        (
            "TAX_ON_SHIPPING",
            (
                True,
                "Apply the tax to the shipping cost as well (common for VAT/GST).",
                bool,
            ),
        ),

        # =========================================================================
        # 6. Payments
        # =========================================================================

        # -------------------------------------------------------------------------
        # Crypto Payments
        # -------------------------------------------------------------------------
        (
            "PAYMENT_WINDOW_MINUTES",
            (
                60,
                "Expiration window for pending payments, in minutes.",
                int,
            ),
        ),

        # -------------------------------------------------------------------------
        # Stripe
        # -------------------------------------------------------------------------
        (
            "STRIPE_SECRET_KEY",
            (
                _env("STRIPE_SECRET_KEY", "sk_***"),
                "Stripe secret API key used by the backend to create and manage payments.",
                str,
            ),
        ),
        (
            "STRIPE_PUBLISHABLE_KEY",
            (
                _env("STRIPE_PUBLISHABLE_KEY", "pk_***"),
                "Stripe publishable key exposed to the storefront for client-side Stripe integration.",
                str,
            ),
        ),
        (
            "STRIPE_WEBHOOK_KEY",
            (
                _env("STRIPE_WEBHOOK_KEY", "whsec_***"),
                "Stripe webhook signing secret used to verify incoming webhook requests.",
                str,
            ),
        ),

        # -------------------------------------------------------------------------
        # Xcash
        # -------------------------------------------------------------------------
        (
            "XCASH_API_URL",
            (
                _env("XCASH_API_URL", "https://pay.xca.sh"),
                "Base URL of the Xcash payment server API.",
                str,
            ),
        ),
        (
            "XCASH_NOTIFY_URL",
            (
                _env(
                    "XCASH_NOTIFY_URL",
                    "http://localhost/api/v1/checkout/webhooks/xcash/",
                ),
                "Webhook URL that Xcash uses to notify FOG about payment events.",
                str,
            ),
        ),
        (
            "XCASH_APPID",
            (
                _env("XCASH_APPID"),
                "Xcash application ID used to authenticate payment API requests.",
                str,
            ),
        ),
        (
            "XCASH_HMAC_KEY",
            (
                _env("XCASH_HMAC_KEY"),
                "Secret HMAC key used to authenticate and verify Xcash payment requests.",
                str,
            ),
        ),
        # (
        #     "XCASH_METHODS",
        #     (
        #         "",
        #         'Optional JSON limiting the coins offered when a payment method has no asset set, '
        #         'e.g. {"USDT": ["ethereum", "tron"]}. Empty lets the customer choose on the gateway.',
        #         str,
        #     ),
        # ),
        # (
        #     "XCASH_CONTRACT_CHAINS",
        #     (
        #         "",
        #         "Comma-separated chains where Xcash uses a smart-contract deposit address "
        #         "(shows an extra notice on the order page), e.g. ethereum,bsc.",
        #         str,
        #     ),
        # ),

        # =========================================================================
        # 7. Email & Notifications
        # =========================================================================
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
                bool,
            ),
        ),

        # =========================================================================
        # 8. Community & Customer Support
        # =========================================================================
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

        # =========================================================================
        # 9. Legal & Footer
        # =========================================================================
        (
            "LEGAL_RESEARCH_DISCLAIMER",
            (
                (
                    "Products are sold for research, microscopy, taxonomy and educational "
                    "purposes only. You are responsible for knowing and following the laws "
                    "that apply to you. Sales are void where prohibited."
                ),
                "Legal disclaimer displayed on the website.",
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
    ]
)

CONSTANCE_CONFIG_FIELDSETS = OrderedDict(
    [
        # =========================================================================
        # Website
        # =========================================================================
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
            "Header & Announcement",
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

        # =========================================================================
        # Store
        # =========================================================================
        (
            "Store Operations",
            {
                "fields": (
                    "STORE_MAINTENANCE_MODE",
                    "MINIMUM_ORDER_AMOUNT_USD",
                    "PRODUCT_REVIEWS_ENABLED",
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
                    "TAX_ON_SHIPPING",
                ),
                "collapse": True,
            },
        ),

        # =========================================================================
        # Payments
        # =========================================================================
        (
            "Payments",
            {
                "fields": (
                    "PAYMENT_WINDOW_MINUTES",
                ),
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
                    # "XCASH_METHODS",
                    # "XCASH_CONTRACT_CHAINS",
                ),
                "collapse": True,
            },
        ),

        # =========================================================================
        # Communication
        # =========================================================================
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

        # =========================================================================
        # Legal
        # =========================================================================
        (
            "Legal & Footer",
            {
                "fields": (
                    "LEGAL_RESEARCH_DISCLAIMER",
                    "FOOTER_COPYRIGHT_TEXT",
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
    "PRODUCT_REVIEWS_ENABLED",
    "TAX_ENABLED",
    "TAX_RATE",
    "TAX_NAME",
    "PRICES_INCLUDE_TAX",
    "TAX_ON_SHIPPING",
    "PAYMENT_WINDOW_MINUTES",
}

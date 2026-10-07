from collections import OrderedDict

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
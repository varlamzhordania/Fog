import {Typography} from "@heroui/react";
import {ChevronDown, HelpCircle} from "lucide-react";
import Icon from "@/components/icon/Icon";

export const metadata = {
    title: "FAQ",
    description:
        "Answers to common questions about FOG Direct, products, orders, payments, shipping, and accounts.",
};

const FAQ_GROUPS = [
    {
        label: "About FOG Direct",
        items: [
            {
                q: "What is FOG Direct?",
                a: "FOG Direct is the shop for the FOG mycology project: research materials, grow kits, lab supplies and printed guides.",
            },
            {
                q: "What types of products are available?",
                a: "We sell dried mushrooms, extracts, grow kits, spore prints and syringes for microscopy, lab supplies and printed guides.",
            },
            {
                q: "Who are the products intended for?",
                a: "Products are intended for lawful research, microscopy, education, documentation, and other permitted uses depending on the individual product. Customers are responsible for understanding the laws that apply to their intended use.",
            },
            {
                q: "Are products legal everywhere?",
                a: "No. Laws relating to fungi, spores, biological materials, cultivation, research, and related products vary between jurisdictions. You are responsible for determining whether purchasing, possessing, importing, or using a product is legal where you live.",
            },
        ],
    },

    {
        label: "Accounts & Orders",
        items: [
            {
                q: "Do I need an account?",
                a: "You can browse and fill a cart without one. To check out you need an account, so we can send order updates and keep your addresses and order history in one place.",
            },
            {
                q: "Can I save delivery addresses?",
                a: "Yes. Customers can save multiple delivery addresses, edit them, delete them, and select a default address.",
            },
            {
                q: "Can I view previous orders?",
                a: "Yes. Customers can access their order history from their account area and view individual order details.",
            },
            {
                q: "Can I cancel an order?",
                a: "You can cancel an order that is still awaiting payment from its order page. If you’ve already paid, contact support before it ships and we’ll cancel and refund it. Once an order has shipped it can’t be cancelled.",
            },
        ],
    },

    {
        label: "Payments",
        items: [
            {
                q: "What payment methods are available?",
                a: "You can pay by card (processed by Stripe) or by cryptocurrency (processed by Xcash). The options available to you are shown at checkout.",
            },
            {
                q: "How does cryptocurrency payment work?",
                a: "When cryptocurrency payment is available, the checkout creates a payment request through the configured payment provider. The payment page provides the amount and relevant asset and network information needed to complete the payment.",
            },
            {
                q: "How long do I have to pay?",
                a: "Your items are reserved while you pay. The countdown is shown on your order page (usually 60 minutes). If it runs out, the order is cancelled and the items go back on sale. If a payment arrives after that, contact support and we’ll refund it or reopen the order.",
            },
            {
                q: "Can I use another payment method after creating an order?",
                a: "An unpaid order can support starting payment again using another available payment method, subject to the order's payment window and current store configuration.",
            },
        ],
    },

    {
        label: "Shipping",
        items: [
            {
                q: "How are shipping costs calculated?",
                a: "Each shipping method has its own price and delivery estimate, and some are free above a minimum order. They are listed on the Shipping page and shown at checkout for your address.",
            },
            {
                q: "Do you ship internationally?",
                a: "We ship to the countries offered at checkout. If your country isn’t offered, no shipping method will appear for your address. You are responsible for customs rules and import duties.",
            },
            {
                q: "Will my order have tracking?",
                a: "Some shipping methods support tracking. When tracking information is available, the carrier and tracking number can be added to the order and displayed to the customer.",
            },
            {
                q: "What happens if my package is delayed?",
                a: "Delivery estimates are not guarantees. If an order is delayed or appears to be missing, contact support with your order number and available shipping information so the issue can be reviewed.",
            },
        ],
    },

    {
        label: "Privacy & Security",
        items: [
            {
                q: "What information does FOG collect?",
                a: "The store may process information needed for accounts, orders, delivery, payments, customer support, security, and normal website operation. See the Privacy Policy for more information.",
            },
            {
                q: "Does FOG sell customer information?",
                a: "FOG Direct does not sell customer information. Information may be shared with service providers where necessary to process payments, deliver orders, operate the website, prevent abuse, or comply with legal requirements.",
            },
            {
                q: "Does FOG use cookies or browser storage?",
                a: "The website uses browser storage and authentication/session mechanisms required for features such as account access, cart functionality, and site preferences.",
            },
        ],
    },
];

export default function FaqPage() {
    return (
        <section className="container container-space">

            <div className="mb-16 border-b border-border pb-10">

                <Typography
                    type="span"
                    className="text-xs uppercase tracking-widest text-muted font-mono mb-3 block"
                >
                    Support / FAQ
                </Typography>

                <Typography
                    type="h1"
                    className="text-5xl md:text-6xl  uppercase tracking-tighter mb-4"
                >
                    Frequently Asked Questions
                </Typography>

                <Typography
                    type="body"
                    className="text-muted max-w-2xl leading-relaxed"
                >
                    Answers to common questions about products, accounts,
                    orders, payments, shipping, and privacy.
                </Typography>

            </div>

            <div className="flex flex-col gap-12">

                {FAQ_GROUPS.map((group) => (
                    <div key={group.label}>

                        <div className="flex items-center gap-2 mb-6">
                            <Icon
                                icon={HelpCircle}
                                className="size-4 text-accent"
                            />

                            <Typography
                                type="span"
                                className="text-xs uppercase tracking-widest text-muted font-mono"
                            >
                                {group.label}
                            </Typography>
                        </div>

                        <div className="flex flex-col rounded-xl border border-border overflow-hidden bg-surface">

                            {group.items.map((item, index) => (
                                <details
                                    key={index}
                                    className="group border-b border-border last:border-b-0"
                                >
                                    <summary className="flex items-center justify-between gap-4 cursor-pointer list-none px-5 py-4 hover:bg-default/30 transition-colors">

                                        <Typography
                                            type="h6"
                                            className="text-sm font-medium leading-snug"
                                        >
                                            {item.q}
                                        </Typography>

                                        <Icon
                                            icon={ChevronDown}
                                            className="size-4 text-muted shrink-0 transition-transform duration-200 group-open:rotate-180"
                                        />

                                    </summary>

                                    <div className="px-5 pb-5 pt-2">

                                        <Typography
                                            type="body-sm"
                                            className="text-muted text-xs leading-relaxed"
                                        >
                                            {item.a}
                                        </Typography>

                                    </div>
                                </details>
                            ))}

                        </div>

                    </div>
                ))}

            </div>

            <div className="mt-14 p-6 rounded-xl border border-border bg-surface flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">

                <div>
                    <Typography
                        type="h6"
                        className="text-sm font-semibold uppercase tracking-wide mb-1"
                    >
                        Still have questions?
                    </Typography>

                    <Typography
                        type="body-sm"
                        className="text-muted text-xs"
                    >
                        Contact the FOG team through the available support channels.
                    </Typography>
                </div>

                <a
                    href="/contact"
                    className="shrink-0 px-5 py-2.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold uppercase tracking-widest hover:opacity-90 transition-opacity"
                >
                    Contact Support
                </a>

            </div>

        </section>
    );
}
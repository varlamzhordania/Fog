import {Typography} from "@heroui/react";
import {ChevronDown, HelpCircle} from "lucide-react";
import Icon from "@/components/icon/Icon";

export const metadata = {
    title: "FAQ",
    description: "Answers to the most common questions about FOG Direct — orders, payments, shipping, privacy, and research.",
};

const FAQ_GROUPS = [
    {
        label: "About FOG Direct",
        items: [
            {
                q: "What is FOG Direct?",
                a: "FOG Direct is a privacy-first, cryptocurrency-native research supplier specializing in verified mycology strains, spore preparations, and laboratory supplies. We serve independent researchers, educators, and enthusiasts who need reliable, documented materials for scientific study.",
            },
            {
                q: "Are your products legal?",
                a: "The legality of our products varies by jurisdiction. Many of our offerings — such as spore prints and syringes — are legal for research and microscopy purposes in many regions. However, laws differ significantly by location. It is your responsibility to verify compliance with your local laws before purchasing. We do not ship to jurisdictions where we know our products to be prohibited.",
            },
            {
                q: "Who are your products for?",
                a: "Our products are intended for adults 18 and older engaged in legitimate scientific research, microscopy, taxonomy, mycological study, and academic documentation. All products are sold for research purposes only and must not be used for human or animal consumption.",
            },
        ],
    },
    {
        label: "Ordering & Payments",
        items: [
            {
                q: "What payment methods do you accept?",
                a: "We accept cryptocurrency only — Bitcoin (BTC), Monero (XMR), and other digital assets listed at checkout. We do not accept credit cards, PayPal, or any fiat payment method. This keeps transactions private and irreversible.",
            },
            {
                q: "How does checkout work?",
                a: "You do not need to create an account to place an order. Sessions are ephemeral — we do not tie your cart or purchase history to a persistent identity. Simply browse, add to cart, choose your shipping option, and pay with crypto. Only a shipping address is required for physical delivery.",
            },
            {
                q: "How long does payment confirmation take?",
                a: "Confirmation time depends on the cryptocurrency used and current network congestion. Bitcoin typically takes 1–3 confirmations (10–30 minutes under normal conditions). Monero transactions confirm in approximately 2–4 blocks. Your order enters processing only after the required confirmations are reached.",
            },
            {
                q: "Can I cancel or change my order after paying?",
                a: "Orders can be cancelled or modified before they enter the processing stage. Once processing begins (after payment confirmation), we cannot guarantee changes or cancellations. Please contact support immediately if you need to modify your order.",
            },
        ],
    },
    {
        label: "Shipping & Delivery",
        items: [
            {
                q: "How is my package shipped?",
                a: "All orders ship in plain, discreet packaging with no external branding, logos, or content descriptors visible from the outside. Return addresses are generic and do not identify FOG Direct.",
            },
            {
                q: "How long does shipping take?",
                a: "Processing takes 1–3 business days following payment confirmation. Domestic delivery typically takes an additional 3–7 business days depending on your region and selected shipping tier. International orders vary and may take 7–21 business days.",
            },
            {
                q: "Do you ship internationally?",
                a: "Yes. We ship to most countries worldwide, subject to local import regulations. It is your responsibility to ensure that importing our products is lawful in your country. We cannot be held liable for orders seized or delayed by customs authorities.",
            },
            {
                q: "Will my order include a tracking number?",
                a: "Tracking is available on select shipping tiers. If tracking is included, you will receive a tracking ID via the contact method provided at checkout. Basic shipping options may not include tracking.",
            },
            {
                q: "What if my package is lost or damaged?",
                a: "If your package has not arrived within the estimated delivery window, please contact our support team. We will investigate with the carrier. Damaged or incorrect orders will be reshipped at no additional cost. We do not offer cash refunds for items lost after handover to the carrier.",
            },
        ],
    },
    {
        label: "Privacy & Security",
        items: [
            {
                q: "How is my data protected?",
                a: "We collect only what is necessary to fulfill your order. We do not sell, share, or retain personal data beyond order fulfillment. Sessions are ephemeral, and IP logs are purged on a 24-hour cycle. See our Privacy Policy for full details.",
            },
            {
                q: "Can I contact you anonymously?",
                a: "Yes. You can reach us via our encrypted support channels listed on the Contact page. You do not need to reveal your identity to ask a question or report an issue. We recommend using a privacy-respecting email provider or our community Telegram for sensitive inquiries.",
            },
            {
                q: "Do you use cookies or tracking scripts?",
                a: "We use only strictly necessary session cookies to maintain your cart state. We do not use advertising cookies, tracking pixels, social media buttons, or third-party analytics scripts. Your browsing behavior on our platform is not tracked or shared.",
            },
        ],
    },
];

export default function FaqPage() {
    return (
        <section className="container container-space">

            {/* Header */}
            <div className="mb-16 border-b border-border pb-10">
                <Typography
                    type="span"
                    className="text-xs uppercase tracking-widest text-muted font-mono mb-3 block"
                >
                    Support / FAQ
                </Typography>
                <Typography
                    type="h1"
                    className="text-5xl md:text-6xl font-atomic uppercase tracking-tighter mb-4"
                >
                    Frequently Asked Questions
                </Typography>
                <Typography type="body" className="text-muted max-w-2xl leading-relaxed">
                    Everything you need to know about orders, payments, shipping, and privacy.
                    If you can&apos;t find your answer here, reach out through our support channels.
                </Typography>
            </div>

            {/* FAQ Groups */}
            <div className="flex flex-col gap-12">
                {FAQ_GROUPS.map((group) => (
                    <div key={group.label}>
                        <div className="flex items-center gap-2 mb-6">
                            <Icon icon={HelpCircle} className="size-4 text-accent"/>
                            <Typography
                                type="span"
                                className="text-xs uppercase tracking-widest text-muted font-mono"
                            >
                                {group.label}
                            </Typography>
                        </div>

                        <div className="flex flex-col rounded-xl border border-border overflow-hidden bg-surface">
                            {group.items.map((item, i) => (
                                <details
                                    key={i}
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
                                        <Typography type="body-sm" className="text-muted text-xs leading-relaxed">
                                            {item.a}
                                        </Typography>
                                    </div>
                                </details>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Still have questions */}
            <div className="mt-14 p-6 rounded-xl border border-border bg-surface flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div>
                    <Typography type="h6" className="text-sm font-semibold uppercase tracking-wide mb-1">
                        Still have questions?
                    </Typography>
                    <Typography type="body-sm" className="text-muted text-xs">
                        Our support team typically responds within 24–48 hours.
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

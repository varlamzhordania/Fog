import {Typography} from "@heroui/react";
import {
    Ban,
    CreditCard,
    FileText,
    Globe,
    Package,
    RefreshCw,
    Scale,
    TriangleAlert,
    UserCheck,
} from "lucide-react";
import Icon from "@/components/icon/Icon";

export const metadata = {
    title: "Terms of Service",
    description:
        "Terms governing the use of FOG Direct and purchases made through the store.",
};

const LAST_UPDATED = "October 8, 2026";

const sections = [
    {
        icon: FileText,
        title: "1. Acceptance of Terms",
        items: [
            "By accessing or using FOG Direct, you agree to these Terms of Service.",
            "If you do not agree with these terms, you should not use the website or purchase products through the store.",
            "These terms may be updated as the service evolves. Updated terms become effective when published unless otherwise stated.",
        ],
    },
    {
        icon: UserCheck,
        title: "2. Accounts",
        items: [
            "Some store functionality requires a customer account.",
            "You are responsible for maintaining the security of your account credentials.",
            "You must provide accurate information when creating an account or placing an order.",
            "You must not access or attempt to access another person's account.",
        ],
    },
    {
        icon: Scale,
        title: "3. Lawful & Responsible Use",
        items: [
            "Products must only be purchased, possessed, imported, and used for lawful purposes.",
            "You are responsible for determining whether a product and its intended use are legal in your jurisdiction.",
            "FOG Direct does not guarantee that products are legal in every country, state, or jurisdiction.",
            "Products should not be used for human or animal consumption unless explicitly identified and legally marketed for that purpose.",
        ],
    },
    {
        icon: CreditCard,
        title: "4. Orders & Payment",
        items: [
            "Orders are subject to product availability, payment confirmation, shipping availability, and applicable restrictions.",
            "Available payment methods may include manual payment confirmation, Stripe card payments, and cryptocurrency payments through XCash.",
            "The available payment methods are displayed during checkout.",
            "Customers are responsible for following payment instructions accurately.",
            "FOG Direct is not responsible for funds sent to an incorrect payment address or unsupported network.",
        ],
    },
    {
        icon: Package,
        title: "5. Stock & Payment Windows",
        items: [
            "Products may be temporarily reserved when an order is created and payment is pending.",
            "Reservations help prevent the same inventory from being purchased by another customer during the payment period.",
            "If an order expires or is cancelled, its inventory reservation may be released.",
            "Payment windows and reservation periods may vary according to the store configuration.",
        ],
    },
    {
        icon: Globe,
        title: "6. Shipping & Delivery",
        items: [
            "Shipping methods, prices, destinations, and delivery estimates depend on the store configuration.",
            "Customers are responsible for providing a complete and accurate delivery address.",
            "Delivery estimates are not guaranteed delivery dates.",
            "International customers are responsible for customs duties, import taxes, permits, and other local requirements.",
            "Customers are responsible for ensuring that their order can legally be imported into the destination.",
        ],
    },
    {
        icon: RefreshCw,
        title: "7. Cancellations & Refunds",
        items: [
            "Cancellation eligibility depends on the order's current status.",
            "Unpaid orders may be cancelled while they remain eligible for cancellation.",
            "Refund availability depends on the payment method, order status, and applicable store policy.",
            "Where supported, refunds may be processed through the original payment provider.",
        ],
    },
    {
        icon: Ban,
        title: "8. Prohibited Activities",
        items: [
            "You may not use the website for unlawful activities.",
            "You may not attempt unauthorized access to accounts, payment systems, or other protected parts of the platform.",
            "You may not intentionally disrupt or interfere with the operation of the store.",
            "You may not submit fraudulent information or misuse the payment or ordering system.",
        ],
    },
    {
        icon: TriangleAlert,
        title: "9. Disclaimer & Liability",
        items: [
            "Information provided through FOG Direct is for general informational purposes.",
            "FOG Direct does not provide legal, medical, or professional scientific advice through the store.",
            "Customers are responsible for their own use of purchased products and for compliance with applicable laws.",
            "To the extent permitted by applicable law, FOG Direct is not responsible for losses resulting from misuse of products, inaccurate customer information, customs actions, carrier delays, or circumstances outside reasonable control.",
        ],
    },
    {
        icon: RefreshCw,
        title: "10. Changes to the Service",
        items: [
            "FOG Direct may modify, suspend, or discontinue products, payment methods, shipping methods, or website functionality.",
            "We may update these terms and other policies as the platform changes.",
            "The latest version published on the website governs use of the service.",
        ],
    },
];

export default function TermsPage() {
    return (
        <section className="container container-space">

            <div className="mb-16 border-b border-border pb-10">

                <Typography
                    type="span"
                    className="text-xs uppercase tracking-widest text-muted font-mono mb-3 block"
                >
                    Legal / Terms
                </Typography>

                <Typography
                    type="h1"
                    className="text-5xl md:text-6xl  uppercase tracking-tighter mb-4"
                >
                    Terms of Service
                </Typography>

                <Typography
                    type="body"
                    className="text-muted max-w-2xl leading-relaxed"
                >
                    These terms explain the rules governing use of FOG Direct,
                    customer accounts, purchases, payments, shipping, and
                    responsible use of the store.
                </Typography>

                <Typography
                    type="small"
                    className="text-muted/60 mt-4 block font-mono"
                >
                    Last updated: {LAST_UPDATED}
                </Typography>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {sections.map((section) => (
                    <div
                        key={section.title}
                        className="p-6 rounded-xl border border-border bg-surface flex flex-col gap-4"
                    >

                        <div className="flex items-center gap-3">

                            <Icon
                                icon={section.icon}
                                className="size-5 text-accent shrink-0"
                            />

                            <Typography
                                type="h6"
                                className="text-sm font-semibold uppercase tracking-widest"
                            >
                                {section.title}
                            </Typography>

                        </div>

                        <ul className="flex flex-col gap-3">

                            {section.items.map((item, index) => (
                                <li
                                    key={index}
                                    className="flex gap-2.5 items-start"
                                >

                                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-accent/60"/>

                                    <Typography
                                        type="body-sm"
                                        className="text-muted text-xs leading-relaxed"
                                    >
                                        {item}
                                    </Typography>

                                </li>
                            ))}

                        </ul>

                    </div>
                ))}

            </div>

            <div className="mt-12 p-5 rounded-xl border border-accent/30 bg-accent/5">

                <Typography
                    type="small"
                    className="text-muted text-xs leading-relaxed"
                >
                    These terms should be reviewed and adapted to the laws and
                    jurisdiction applicable to the business before the store
                    is launched commercially.
                </Typography>

            </div>

        </section>
    );
}
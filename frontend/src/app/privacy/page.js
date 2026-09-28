import {Typography} from "@heroui/react";
import {Eye, Lock, Mail, Settings, ShieldCheck} from "lucide-react";
import Icon from "@/components/Icon/Icon";

export const metadata = {
    title: "Privacy Policy",
    description: "How FOG Direct protects your privacy and handles your data with an anonymous-first approach.",
};

const LAST_UPDATED = "January 1, 2026";

const sections = [
    {
        icon: ShieldCheck,
        title: "Anonymous by Design",
        items: [
            "FOG Direct is built from the ground up to respect your privacy. We collect only the minimum information necessary to fulfill your order.",
            "No account registration is required. Orders can be placed without creating a profile, and session data is ephemeral by default.",
            "We do not fingerprint browsers, track cross-session behavior, or build profiles linked to your identity.",
        ],
    },
    {
        icon: Eye,
        title: "Data We Collect",
        items: [
            "Shipping address: required for physical delivery, retained only for the duration needed to process and ship your order, then purged.",
            "Cryptocurrency transaction IDs: used solely to confirm payment. Wallet addresses are not stored beyond order fulfillment.",
            "IP addresses: temporarily logged for fraud prevention and rate limiting. Logs are purged on a rolling 24-hour cycle.",
            "Session tokens: short-lived, encrypted identifiers used to maintain your cart state. They expire upon session end.",
        ],
    },
    {
        icon: Lock,
        title: "What We Never Do",
        items: [
            "We do not sell, rent, or share your information with third parties for marketing purposes.",
            "We do not use behavioral tracking pixels, advertising scripts, or social media buttons that report back to parent platforms.",
            "We do not link purchase history to persistent identifiers across separate sessions.",
            "We do not collect or store government-issued identification, payment card data, or biometric information.",
        ],
    },
    {
        icon: Settings,
        title: "Cookies & Storage",
        items: [
            "We use strictly necessary session cookies to maintain your cart and authentication state. No tracking cookies are set.",
            "Local storage may be used for UI preferences (e.g., theme selection). This data never leaves your browser.",
            "No third-party analytics, advertising, or social media cookies are placed by our platform.",
        ],
    },
    {
        icon: Mail,
        title: "Your Rights & Contact",
        items: [
            "You may request deletion of any personal data we hold by contacting our privacy team.",
            "You may request a copy of any data associated with an order you placed within the past 90 days.",
            "For privacy-related inquiries, reach us at the support contact listed in your order confirmation.",
            "We will respond to verified requests within 30 days.",
        ],
    },
];

export default function PrivacyPage() {
    return (
        <section className="container container-space">

            {/* Header */}
            <div className="mb-16 border-b border-border pb-10">
                <Typography
                    type="span"
                    className="text-xs uppercase tracking-widest text-muted font-mono mb-3 block"
                >
                    Legal / Privacy
                </Typography>
                <Typography
                    type="h1"
                    className="text-5xl md:text-6xl font-atomic uppercase tracking-tighter mb-4"
                >
                    Privacy Policy
                </Typography>
                <Typography type="body" className="text-muted max-w-2xl leading-relaxed">
                    Your privacy is not a feature — it is the foundation. This policy explains what data
                    we handle, why, and how we keep your identity protected across every interaction.
                </Typography>
                <Typography type="small" className="text-muted/60 mt-4 block font-mono">
                    Last updated: {LAST_UPDATED}
                </Typography>
            </div>

            {/* Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sections.map((section) => (
                    <div
                        key={section.title}
                        className="p-6 rounded-xl border border-border bg-surface flex flex-col gap-4"
                    >
                        <div className="flex items-center gap-3">
                            <Icon icon={section.icon} className="size-5 text-accent shrink-0"/>
                            <Typography
                                type="h6"
                                className="text-sm font-semibold uppercase tracking-widest"
                            >
                                {section.title}
                            </Typography>
                        </div>

                        <ul className="flex flex-col gap-2.5 list-none">
                            {section.items.map((item, i) => (
                                <li key={i} className="flex gap-2.5 items-start">
                                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-accent/60"/>
                                    <Typography type="body-sm" className="text-muted leading-relaxed text-xs">
                                        {item}
                                    </Typography>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* Footer note */}
            <div className="mt-12 p-5 rounded-xl border border-border/60 bg-surface/50">
                <Typography type="small" className="text-muted/70 leading-relaxed text-xs font-mono">
                    DISCLAIMER: This privacy policy applies to the FOG Direct web platform. By using
                    this site you acknowledge and agree to these practices. We reserve the right to
                    update this policy; material changes will be noted at the top of this page.
                </Typography>
            </div>

        </section>
    );
}

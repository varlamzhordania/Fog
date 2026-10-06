import {Typography} from "@heroui/react";
import {Ban, CreditCard, FileText, Globe, Package, RefreshCw, Scale, TriangleAlert} from "lucide-react";
import Icon from "@/components/icon/Icon";

export const metadata = {
    title: "Terms of Service",
    description: "The terms governing your use of FOG Direct and purchase of research-grade mycology supplies.",
};

const LAST_UPDATED = "January 1, 2026";

const sections = [
    {
        icon: FileText,
        title: "1. Acceptance of Terms",
        items: [
            "By accessing or using the FOG Direct platform, you agree to be bound by these Terms of Service in full.",
            "If you do not agree to any part of these terms, you must not use our platform or purchase our products.",
            "These terms may be updated at any time. Continued use of the platform following changes constitutes acceptance.",
            "You must be at least 18 years of age to use this platform and purchase products.",
        ],
    },
    {
        icon: Scale,
        title: "2. Research Use Only",
        items: [
            "All products sold by FOG Direct are intended exclusively for legitimate scientific research, microscopy, and taxonomic study.",
            "Products are not approved for, and must not be used for, human or animal consumption under any circumstances.",
            "By purchasing, you represent that you understand and will comply with all applicable local, state, and federal laws.",
            "FOG Direct makes no representations that products are legal in your jurisdiction. Compliance is your sole responsibility.",
        ],
    },
    {
        icon: CreditCard,
        title: "3. Payment Terms",
        items: [
            "All transactions are conducted exclusively in cryptocurrency. We accept Bitcoin, Monero, and other listed digital assets.",
            "Orders are processed only after blockchain confirmation of your payment. Confirmation times vary by network and coin.",
            "Payments are non-refundable once a transaction has been confirmed on-chain and order processing has begun.",
            "We are not responsible for funds sent to incorrect addresses or lost due to user error.",
        ],
    },
    {
        icon: Package,
        title: "4. Shipping & Delivery",
        items: [
            "We ship discreetly with no external branding identifying the contents or sender.",
            "Processing time is 1–3 business days following payment confirmation. Delivery times vary by region.",
            "Risk of loss and title for products pass to you upon handover to the carrier.",
            "FOG Direct is not liable for delays, seizures, or losses caused by customs, carrier issues, or force majeure events.",
        ],
    },
    {
        icon: Ban,
        title: "5. Prohibited Conduct",
        items: [
            "You may not use our platform for any unlawful purpose or in violation of any applicable laws or regulations.",
            "You may not attempt to reverse-engineer, disrupt, or exploit any part of the FOG Direct infrastructure.",
            "You may not misrepresent your intended use of products at the time of purchase.",
            "Resale of products without explicit written authorization from FOG Direct is prohibited.",
        ],
    },
    {
        icon: TriangleAlert,
        title: "6. Limitation of Liability",
        items: [
            "FOG Direct products are provided 'as-is' for research purposes. No warranties, express or implied, are made.",
            "We are not liable for any direct, indirect, incidental, or consequential damages arising from product use.",
            "Our total liability for any claim arising out of your use of our platform shall not exceed the amount you paid for the specific order in question.",
            "We are not responsible for any legal consequences resulting from your purchase, possession, or use of our products.",
        ],
    },
    {
        icon: Globe,
        title: "7. Governing Law",
        items: [
            "These terms are governed by applicable laws. Disputes will be resolved through binding arbitration where permitted.",
            "We make no claim that products offered are appropriate or lawful for use outside of jurisdictions where legal.",
            "You are solely responsible for determining the legality of your purchase in your jurisdiction before ordering.",
        ],
    },
    {
        icon: RefreshCw,
        title: "8. Modifications",
        items: [
            "FOG Direct reserves the right to modify or discontinue any product, service, or policy at any time without notice.",
            "Changes to these terms take effect immediately upon posting. The 'Last Updated' date will reflect the most recent revision.",
            "It is your responsibility to review these terms periodically. Continued use of the platform is your acceptance of revisions.",
        ],
    },
];

export default function TermsPage() {

    return (
        <section className="container container-space">

            {/* Header */}
            <div className="mb-16 border-b border-border pb-10">
                <Typography
                    type="span"
                    className="text-xs uppercase tracking-widest text-muted font-mono mb-3 block"
                >
                    Legal / Terms
                </Typography>
                <Typography
                    type="h1"
                    className="text-5xl md:text-6xl font-atomic uppercase tracking-tighter mb-4"
                >
                    Terms of Service
                </Typography>
                <Typography type="body" className="text-muted max-w-2xl leading-relaxed">
                    These terms govern your access to and use of FOG Direct. Please read them carefully
                    before placing an order or using any part of our platform.
                </Typography>
                <Typography type="small" className="text-muted/60 mt-4 block font-mono">
                    Last updated: {LAST_UPDATED}
                </Typography>
            </div>

            {/* Sections */}
            <div className="flex flex-col gap-6">
                {sections.map((section) => (
                    <div
                        key={section.title}
                        className="p-6 rounded-xl border border-border bg-surface"
                    >
                        <div className="flex items-center gap-3 mb-4">
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
                    BY USING FOG DIRECT YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO
                    BE BOUND BY THESE TERMS OF SERVICE. ALL PRODUCTS ARE SOLD FOR RESEARCH AND
                    EDUCATIONAL PURPOSES ONLY.
                </Typography>
            </div>

        </section>
    );
}

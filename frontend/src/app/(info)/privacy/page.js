import {Typography} from "@heroui/react";
import {Eye, Lock, Mail, Settings, ShieldCheck} from "lucide-react";
import Icon from "@/components/icon/Icon";

export const metadata = {
    title: "Privacy Policy",
    description:
        "How FOG Direct handles account, order, payment, shipping, and technical information.",
};

const LAST_UPDATED = "October 8, 2026";

const sections = [
    {
        icon: ShieldCheck,
        title: "Information We Handle",
        items: [
            "Account information such as your email address and supported profile information.",
            "Order information including products, quantities, prices, payment status, shipping information, and order status.",
            "Delivery information required to fulfill physical orders.",
            "Information voluntarily provided when contacting support.",
            "Information required to process and verify payments.",
        ],
    },
    {
        icon: Eye,
        title: "How Information Is Used",
        items: [
            "To create and maintain customer accounts.",
            "To process, fulfill, and manage orders.",
            "To process and verify payments.",
            "To arrange shipping and provide shipment information.",
            "To provide customer support and resolve order issues.",
            "To protect the service against abuse, fraud, and unauthorized access.",
        ],
    },
    {
        icon: Lock,
        title: "Information Sharing",
        items: [
            "FOG Direct does not sell customer information.",
            "Information may be shared with payment providers when required to process a payment.",
            "Information may be shared with shipping and infrastructure providers when necessary to operate the store.",
            "Information may be disclosed where required by applicable law or legal process.",
        ],
    },
    {
        icon: Settings,
        title: "Cookies & Browser Storage",
        items: [
            "The website may use cookies required for authentication and normal application functionality.",
            "Browser storage may be used for features such as cart functionality and user preferences.",
            "The application does not require advertising cookies to operate the store.",
            "The exact data stored in a browser depends on the features being used.",
        ],
    },
    {
        icon: Mail,
        title: "Your Requests",
        items: [
            "Where applicable law provides such rights, you may request access to personal information associated with you.",
            "You may request correction of inaccurate information.",
            "You may request deletion of personal information where deletion is legally and operationally possible.",
            "Some information may need to be retained for legal, security, accounting, or legitimate operational purposes.",
            "Privacy-related requests can be submitted through the available support channels.",
        ],
    },
];

export default function PrivacyPage() {
    return (
        <section className="container container-space">

            <div className="mb-16 border-b border-border pb-10">

                <Typography
                    type="span"
                    className="text-xs uppercase tracking-widest text-muted font-mono mb-3 block"
                >
                    Legal / Privacy
                </Typography>

                <Typography
                    type="h1"
                    className="text-5xl md:text-6xl  uppercase tracking-tighter mb-4"
                >
                    Privacy Policy
                </Typography>

                <Typography
                    type="body"
                    className="text-muted max-w-2xl leading-relaxed"
                >
                    This policy explains the types of information FOG Direct may
                    process, why that information is needed, and how it is used
                    to operate the store.
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

                        <ul className="flex flex-col gap-2.5 list-none">

                            {section.items.map((item, index) => (
                                <li
                                    key={index}
                                    className="flex gap-2.5 items-start"
                                >
                                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-accent/60"/>

                                    <Typography
                                        type="body-sm"
                                        className="text-muted leading-relaxed text-xs"
                                    >
                                        {item}
                                    </Typography>
                                </li>
                            ))}

                        </ul>

                    </div>
                ))}

            </div>

            <div className="mt-12 p-5 rounded-xl border border-border/60 bg-surface/50">

                <Typography
                    type="small"
                    className="text-muted/70 leading-relaxed text-xs"
                >
                    This policy describes the general privacy practices of the
                    FOG Direct web platform. It may be updated as the platform,
                    services, or applicable legal requirements change.
                </Typography>

            </div>

        </section>
    );
}
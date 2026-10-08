import {Typography} from "@heroui/react";
import {
    BookOpen,
    CheckCircle,
    FlaskConical,
    MapPin,
    Microscope,
    UserCheck,
    XCircle,
} from "lucide-react";
import Icon from "@/components/icon/Icon";

export const metadata = {
    title: "Research Policy",
    description:
        "FOG Direct's policy regarding lawful and responsible use of mycology research materials.",
};

const LAST_UPDATED = "October 8, 2026";

const permitted = [
    "Microscopy and observation of fungal materials where legally permitted.",
    "Academic or independent study of fungal biology and morphology.",
    "Taxonomic research and documentation.",
    "Educational activities conducted in appropriate settings.",
    "Photography, documentation, and archival work.",
    "Other lawful research activities appropriate to the specific product.",
];

const prohibited = [
    "Use of products for unlawful activities.",
    "Use of products in a manner prohibited by the laws of your jurisdiction.",
    "Human or animal consumption of products that are not specifically marketed and legally approved for consumption.",
    "Redistribution or resale in violation of applicable law or store policy.",
    "Providing products to individuals who are not legally permitted to possess or use them.",
    "Misrepresenting the intended use of products to obtain materials that cannot lawfully be supplied.",
];

const standards = [
    {
        icon: Microscope,
        title: "Research Focus",
        description:
            "FOG Direct is designed around mycology, microscopy, education, documentation, and lawful research-oriented use.",
    },
    {
        icon: FlaskConical,
        title: "Product Information",
        description:
            "Products are presented with information intended to help customers understand what they are purchasing, including descriptions, categories, pricing, availability, and other relevant details.",
    },
    {
        icon: CheckCircle,
        title: "Responsible Handling",
        description:
            "Customers are expected to handle purchased materials responsibly and follow appropriate laboratory, research, storage, and safety practices.",
    },
    {
        icon: BookOpen,
        title: "Independent Research",
        description:
            "FOG recognizes both academic and independent research and encourages careful documentation and responsible sharing of useful knowledge.",
    },
];

export default function ResearchPolicyPage() {
    return (
        <section className="container container-space">

            <div className="mb-16 border-b border-border pb-10">

                <Typography
                    type="span"
                    className="text-xs uppercase tracking-widest text-muted font-mono mb-3 block"
                >
                    Legal / Research
                </Typography>

                <Typography
                    type="h1"
                    className="text-5xl md:text-6xl  uppercase tracking-tighter mb-4"
                >
                    Research Policy
                </Typography>

                <Typography
                    type="body"
                    className="text-muted max-w-2xl leading-relaxed"
                >
                    FOG Direct provides products and information intended to
                    support lawful research, microscopy, education, documentation,
                    and study related to mycology.
                </Typography>

                <Typography
                    type="small"
                    className="text-muted/60 mt-4 block font-mono"
                >
                    Last updated: {LAST_UPDATED}
                </Typography>

            </div>

            <div className="flex items-start gap-3 mb-12 p-5 rounded-xl border border-accent/30 bg-accent/5">

                <Icon
                    icon={MapPin}
                    className="size-5 text-accent shrink-0 mt-0.5"
                />

                <div>

                    <Typography
                        type="h6"
                        className="text-sm font-semibold uppercase tracking-widest mb-1"
                    >
                        Jurisdiction Notice
                    </Typography>

                    <Typography
                        type="body-sm"
                        className="text-muted text-xs leading-relaxed"
                    >
                        Laws governing fungi, spores, biological materials,
                        cultivation, research, and related products vary
                        significantly by country and jurisdiction. You are
                        responsible for verifying that purchasing, possessing,
                        importing, and using a product is lawful where you live.
                    </Typography>

                </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">

                <div className="p-6 rounded-xl border border-border bg-surface">

                    <div className="flex items-center gap-3 mb-5">

                        <Icon
                            icon={CheckCircle}
                            className="size-5 text-success"
                        />

                        <Typography
                            type="h6"
                            className="text-sm font-semibold uppercase tracking-widest"
                        >
                            Permitted Uses
                        </Typography>

                    </div>

                    <ul className="flex flex-col gap-3">

                        {permitted.map((item, index) => (
                            <li
                                key={index}
                                className="flex items-start gap-3"
                            >
                                <Icon
                                    icon={CheckCircle}
                                    className="size-4 text-success shrink-0 mt-0.5"
                                />

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

                <div className="p-6 rounded-xl border border-border bg-surface">

                    <div className="flex items-center gap-3 mb-5">

                        <Icon
                            icon={XCircle}
                            className="size-5 text-danger"
                        />

                        <Typography
                            type="h6"
                            className="text-sm font-semibold uppercase tracking-widest"
                        >
                            Prohibited Uses
                        </Typography>

                    </div>

                    <ul className="flex flex-col gap-3">

                        {prohibited.map((item, index) => (
                            <li
                                key={index}
                                className="flex items-start gap-3"
                            >
                                <Icon
                                    icon={XCircle}
                                    className="size-4 text-danger shrink-0 mt-0.5"
                                />

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

            </div>

            <div className="mb-12">

                <Typography
                    type="span"
                    className="text-xs uppercase tracking-widest text-muted font-mono mb-6 block"
                >
                    Our Approach
                </Typography>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                    {standards.map((item) => (
                        <div
                            key={item.title}
                            className="p-6 rounded-xl border border-border bg-surface"
                        >

                            <Icon
                                icon={item.icon}
                                className="size-6 text-accent mb-4"
                            />

                            <Typography
                                type="h6"
                                className="text-sm font-semibold uppercase tracking-wider mb-2"
                            >
                                {item.title}
                            </Typography>

                            <Typography
                                type="body-sm"
                                className="text-muted text-xs leading-relaxed"
                            >
                                {item.description}
                            </Typography>

                        </div>
                    ))}

                </div>

            </div>

            <div className="p-6 rounded-xl border border-border bg-surface">

                <div className="flex items-start gap-3">

                    <Icon
                        icon={UserCheck}
                        className="size-5 text-accent shrink-0"
                    />

                    <div>

                        <Typography
                            type="h6"
                            className="text-sm font-semibold uppercase tracking-widest mb-2"
                        >
                            Customer Responsibility
                        </Typography>

                        <Typography
                            type="body-sm"
                            className="text-muted text-xs leading-relaxed"
                        >
                            FOG Direct does not provide legal, medical, or
                            professional scientific advice. Customers are
                            responsible for obtaining any permits, approvals,
                            training, or other requirements applicable to their
                            research and for complying with all applicable laws.
                        </Typography>

                    </div>

                </div>

            </div>

        </section>
    );
}
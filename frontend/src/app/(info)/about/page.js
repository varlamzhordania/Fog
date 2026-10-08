import {Typography} from "@heroui/react";
import {FlaskConical, ShieldCheck, Network, Leaf, Target, Heart, Users} from "lucide-react";
import Icon from "@/components/icon/Icon";

export const metadata = {
    title: "About",
    description:
        "Learn about FOG Direct, our approach to mycology, research, products, and responsible commerce.",
};

const VALUES = [
    {
        icon: FlaskConical,
        title: "Research Focused",
        description:
            "FOG is built around an interest in mycology, fungal biology, microscopy, education, and independent research.",
    },
    {
        icon: ShieldCheck,
        title: "Privacy Conscious",
        description:
            "We aim to collect and process only the information needed to operate the store, process orders, provide support, and maintain customer accounts.",
    },
    {
        icon: Network,
        title: "Open Knowledge",
        description:
            "We are interested in sharing useful information about fungi and supporting responsible exploration, documentation, and learning.",
    },
    {
        icon: Leaf,
        title: "Clear Products",
        description:
            "Products are presented with relevant descriptions, pricing, availability, categories, tags, and other information to help customers make informed decisions.",
    },
    {
        icon: Target,
        title: "Reliable Commerce",
        description:
            "The store combines inventory management, secure checkout, payment processing, shipping, and order tracking into one system.",
    },
    {
        icon: Heart,
        title: "Responsible Use",
        description:
            "We expect customers to use products lawfully and responsibly and to understand the regulations that apply to them in their jurisdiction.",
    },
];

export default function AboutPage() {
    return (
        <section className="container container-space">

            <div className="mb-16 border-b border-border pb-10">
                <Typography
                    type="span"
                    className="text-xs uppercase tracking-widest text-muted font-mono mb-3 block"
                >
                    Origin & Purpose
                </Typography>

                <Typography
                    type="h1"
                    className="text-5xl md:text-6xl uppercase tracking-tighter mb-4"
                >
                    About FOG Direct
                </Typography>

                <Typography type="body" className="text-muted max-w-2xl leading-relaxed">
                    FOG Direct is the storefront for FOG, a project focused on mycology,
                    fungal research, laboratory supplies, and educational resources.
                </Typography>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">

                <div className="lg:col-span-2 p-8 rounded-xl border border-border bg-surface">
                    <Typography
                        type="span"
                        className="text-xs uppercase tracking-widest text-muted font-mono mb-4 block"
                    >
                        Our Mission
                    </Typography>

                    <Typography
                        type="h2"
                        className="text-3xl md:text-4xl uppercase tracking-tight mb-5"
                    >
                        Making mycology research and supplies easier to access
                    </Typography>

                    <Typography
                        type="body"
                        className="text-muted leading-relaxed mb-4"
                    >
                        FOG brings together products, research-oriented information,
                        and practical tools for people interested in fungi and mycology.
                        Our goal is to make the process of discovering products,
                        placing orders, and managing research-related purchases
                        straightforward and transparent.
                    </Typography>

                    <Typography
                        type="body"
                        className="text-muted leading-relaxed"
                    >
                        The FOG Direct storefront provides product discovery,
                        inventory information, customer accounts, multiple payment
                        options, shipping management, and order tracking while
                        maintaining a strong focus on responsible and lawful use.
                    </Typography>
                </div>

                <div className="flex flex-col gap-4">

                    <div className="p-5 rounded-xl border border-border bg-surface flex-1">
                        <Icon
                            icon={FlaskConical}
                            className="size-6 text-accent mb-2"
                        />

                        <Typography
                            type="small"
                            className="text-muted text-xs uppercase tracking-widest font-mono"
                        >
                            Mycology & Research
                        </Typography>
                    </div>

                    <div className="p-5 rounded-xl border border-border bg-surface flex-1">
                        <Icon
                            icon={Users}
                            className="size-6 text-accent mb-2"
                        />

                        <Typography
                            type="small"
                            className="text-muted text-xs uppercase tracking-widest font-mono"
                        >
                            Independent Researchers & Enthusiasts
                        </Typography>
                    </div>

                    <div className="p-5 rounded-xl border border-border bg-surface flex-1">
                        <Typography
                            type="h2"
                            className="text-4xl font-atomic text-accent mb-1"
                        >
                            FOG
                        </Typography>

                        <Typography
                            type="small"
                            className="text-muted text-xs uppercase tracking-widest font-mono"
                        >
                            Fungal Research & Exploration
                        </Typography>
                    </div>

                </div>
            </div>

            <div>
                <Typography
                    type="span"
                    className="text-xs uppercase tracking-widest text-muted font-mono mb-6 block"
                >
                    Core Values
                </Typography>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {VALUES.map((value, index) => (
                        <div
                            key={value.title}
                            className="p-5 rounded-xl border border-border bg-surface flex flex-col gap-3"
                        >
                            <div className="flex items-center justify-between">
                                <Icon
                                    icon={value.icon}
                                    className="size-6 text-accent stroke-[1.5]"
                                />

                                <span className="text-[10px] font-mono text-muted/50 tracking-widest">
                                    {String(index + 1).padStart(2, "0")}
                                </span>
                            </div>

                            <Typography
                                type="h6"
                                className="text-sm font-semibold uppercase tracking-wider"
                            >
                                {value.title}
                            </Typography>

                            <Typography
                                type="body-sm"
                                className="text-muted text-xs leading-relaxed"
                            >
                                {value.description}
                            </Typography>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-16 p-6 rounded-xl border border-border bg-surface">
                <Typography
                    type="h6"
                    className="text-sm font-semibold uppercase tracking-widest mb-3"
                >
                    Responsible Use
                </Typography>

                <Typography
                    type="body-sm"
                    className="text-muted text-xs leading-relaxed"
                >
                    Products available through FOG Direct must only be purchased,
                    possessed, imported, and used for lawful purposes. Laws relating
                    to fungi, biological materials, research, cultivation, and
                    related products vary between jurisdictions. Customers are
                    responsible for understanding and following the laws that apply
                    to them.
                </Typography>
            </div>

        </section>
    );
}
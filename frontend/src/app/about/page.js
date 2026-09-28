import {Typography} from "@heroui/react";
import {FlaskConical, Heart, Leaf, Network, ShieldCheck, Target, Users} from "lucide-react";
import Icon from "@/components/Icon/Icon";

export const metadata = {
    title: "About",
    description: "The story, mission, and values behind FOG Direct — advancing mycology through privacy-first research commerce.",
};

const VALUES = [
    {
        icon: FlaskConical,
        title: "Science First",
        description:
            "Every product we source, every strain we document, and every batch we ship is evaluated through a scientific lens. We do not compromise on biological integrity.",
    },
    {
        icon: ShieldCheck,
        title: "Privacy as Principle",
        description:
            "Anonymous commerce is not a workaround — it is an architecture. We build every layer of our platform to minimize data exposure and maximize user sovereignty.",
    },
    {
        icon: Network,
        title: "Mycelial Thinking",
        description:
            "Fungi operate through distributed networks of mutual exchange. We apply this philosophy to our community: knowledge, resources, and findings flow freely.",
    },
    {
        icon: Leaf,
        title: "Substrate Purity",
        description:
            "We reject filler, dilution, and misrepresentation. What we sell is exactly what it is — verified, documented, and traceable to its genetic origin.",
    },
    {
        icon: Target,
        title: "Precision Commerce",
        description:
            "Our storefront is engineered for researchers, not browsers. Clean taxonomy, accurate descriptions, and discreet fulfillment are not features — they are requirements.",
    },
    {
        icon: Heart,
        title: "Community Driven",
        description:
            "FOG Direct exists because of the mycology community. We invest a portion of every sale into research documentation, open publishing, and community infrastructure.",
    },
];

const TIMELINE = [
    {
        year: "2022",
        event: "FOG Research Founded",
        detail: "Began as a private mycology documentation project tracking genetic lineages of rare fungal species.",
    },
    {
        year: "2023",
        event: "Community Expansion",
        detail: "Opened access to a small circle of independent researchers, sharing strain libraries and batch documentation.",
    },
    {
        year: "2024",
        event: "Crypto Infrastructure",
        detail: "Integrated cryptocurrency settlement and ephemeral session architecture to serve privacy-conscious researchers.",
    },
    {
        year: "2025",
        event: "FOG Direct Launch",
        detail: "Launched the public-facing storefront with a full research library, vetted strain catalogue, and discreet fulfillment.",
    },
    {
        year: "2026",
        event: "Expanding the Index",
        detail: "Continuing to grow our genetic database, publish findings, and refine our extraction and documentation standards.",
    },
];

export default function AboutPage() {
    return (
        <>
            {/* Mission Header */}
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
                        className="text-5xl md:text-6xl font-atomic uppercase tracking-tighter mb-4"
                    >
                        About FOG Direct
                    </Typography>
                    <Typography type="body" className="text-muted max-w-2xl leading-relaxed">
                        FOG Direct is a privacy-first research supplier dedicated to the serious study
                        of fungal biology. We bridge the gap between mycological science and accessible,
                        discreet commerce — built for researchers, not retailers.
                    </Typography>
                </div>

                {/* Mission statement */}
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
                            className="text-3xl md:text-4xl font-atomic uppercase tracking-tight mb-5"
                        >
                            Advancing fungal science through sovereign research access
                        </Typography>
                        <Typography type="body" className="text-muted leading-relaxed mb-4">
                            The fungal kingdom represents one of the most complex and understudied domains
                            of biology. FOG Direct exists to lower the barrier for legitimate researchers,
                            students, and independent scientists who need verified genetic material and
                            reliable documentation.
                        </Typography>
                        <Typography type="body" className="text-muted leading-relaxed">
                            We operate at the intersection of biological rigor and digital privacy.
                            Our cryptocurrency-native checkout, ephemeral session architecture, and
                            discreet packaging are not workarounds — they are deliberate design choices
                            that reflect our belief in researcher sovereignty.
                        </Typography>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="p-5 rounded-xl border border-border bg-surface flex-1">
                            <Typography type="h2" className="text-4xl font-atomic text-accent mb-1">
                                100+
                            </Typography>
                            <Typography type="small" className="text-muted text-xs uppercase tracking-widest font-mono">
                                Verified Strains in Index
                            </Typography>
                        </div>
                        <div className="p-5 rounded-xl border border-border bg-surface flex-1">
                            <Typography type="h2" className="text-4xl font-atomic text-accent mb-1">
                                4+
                            </Typography>
                            <Typography type="small" className="text-muted text-xs uppercase tracking-widest font-mono">
                                Years of Research
                            </Typography>
                        </div>
                        <div className="p-5 rounded-xl border border-border bg-surface flex-1">
                            <Icon icon={Users} className="size-6 text-accent mb-2"/>
                            <Typography type="small" className="text-muted text-xs uppercase tracking-widest font-mono">
                                Global Research Community
                            </Typography>
                        </div>
                    </div>
                </div>

                {/* Values */}
                <div className="mb-16">
                    <Typography
                        type="span"
                        className="text-xs uppercase tracking-widest text-muted font-mono mb-6 block"
                    >
                        Core Values
                    </Typography>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {VALUES.map((v, i) => (
                            <div
                                key={v.title}
                                className="p-5 rounded-xl border border-border bg-surface flex flex-col gap-3 group hover:border-default-foreground/30 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <Icon icon={v.icon} className="size-6 text-accent stroke-[1.5]"/>
                                    <span className="text-[10px] font-mono text-muted/50 tracking-widest">
                                        0{i + 1}
                                    </span>
                                </div>
                                <Typography type="h6" className="text-sm font-semibold uppercase tracking-wider">
                                    {v.title}
                                </Typography>
                                <Typography type="body-sm" className="text-muted text-xs leading-relaxed">
                                    {v.description}
                                </Typography>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Timeline */}
                <div>
                    <Typography
                        type="span"
                        className="text-xs uppercase tracking-widest text-muted font-mono mb-8 block"
                    >
                        Our Journey
                    </Typography>
                    <div className="relative flex flex-col gap-0">
                        {TIMELINE.map((entry, i) => (
                            <div key={entry.year} className="flex gap-6 pb-8 relative">
                                {/* Line */}
                                {i < TIMELINE.length - 1 && (
                                    <div className="absolute left-6.5 top-8 w-px h-full bg-border"/>
                                )}
                                {/* Dot */}
                                <div className="shrink-0 size-13 rounded-full border border-border bg-surface flex items-center justify-center z-10">
                                    <Typography type="small" className="text-[10px] font-mono text-accent font-bold tracking-tight">
                                        {entry.year}
                                    </Typography>
                                </div>
                                <div className="pt-3">
                                    <Typography type="h6" className="text-sm font-semibold uppercase tracking-wide mb-1">
                                        {entry.event}
                                    </Typography>
                                    <Typography type="body-sm" className="text-muted text-xs leading-relaxed">
                                        {entry.detail}
                                    </Typography>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}

import {Typography} from "@heroui/react";
import {BookOpen, CheckCircle, FileCheck, FlaskConical, MapPin, Microscope, UserCheck, XCircle} from "lucide-react";
import Icon from "@/components/icon/Icon";

export const metadata = {
    title: "Research Policy",
    description: "FOG Direct's policy on the responsible and lawful use of mycology research materials.",
};

const LAST_UPDATED = "January 1, 2026";

const permitted = [
    "Microscopic examination and taxonomic identification of fungal spores",
    "Academic study of fungal morphology, reproduction, and genetics",
    "Cultivation experiments within legal jurisdictions for research documentation",
    "Comparative analysis of fungal species for peer-reviewed or independent research",
    "Educational demonstrations in approved laboratory or institutional settings",
    "Photography and documentation for mycological archives or publications",
];

const prohibited = [
    "Human or animal consumption of any product, spore, or material sold on this platform",
    "Use in jurisdictions where possession or research of the purchased material is prohibited by law",
    "Sale, transfer, or redistribution of materials to unauthorized third parties",
    "Any commercial application not expressly authorized in writing by FOG Direct",
    "Use by persons under the age of 18",
    "Misrepresentation of intended purpose at the time of purchase",
];

const standards = [
    {
        icon: Microscope,
        title: "Taxonomic Integrity",
        description:
            "All genetic strains are sourced from verified lineages and catalogued with species-level identification. We maintain batch documentation standards consistent with independent research archives.",
    },
    {
        icon: FlaskConical,
        title: "Substrate Purity",
        description:
            "We prioritize whole-body and pure-substrate preparations. No grain fillers, unverified isolates, or adulterants are included. Extraction and preservation methods are disclosed per product.",
    },
    {
        icon: FileCheck,
        title: "Documentation",
        description:
            "Research-grade orders include batch records indicating species, collection method, and processing date. These records support reproducible, citation-ready research workflows.",
    },
    {
        icon: BookOpen,
        title: "Knowledge Sharing",
        description:
            "We actively contribute to open mycological literature and support independent researchers. Our research library is freely accessible and updated with new findings on a regular basis.",
    },
];

export default function ResearchPolicyPage() {
    return (
        <section className="container container-space">

            {/* Header */}
            <div className="mb-16 border-b border-border pb-10">
                <Typography
                    type="span"
                    className="text-xs uppercase tracking-widest text-muted font-mono mb-3 block"
                >
                    Legal / Research
                </Typography>
                <Typography
                    type="h1"
                    className="text-5xl md:text-6xl font-atomic uppercase tracking-tighter mb-4"
                >
                    Research Policy
                </Typography>
                <Typography type="body" className="text-muted max-w-2xl leading-relaxed">
                    FOG Direct operates as a research-grade supplier. Every product we sell is intended
                    for legitimate scientific inquiry. This policy defines the boundaries of responsible use.
                </Typography>
                <Typography type="small" className="text-muted/60 mt-4 block font-mono">
                    Last updated: {LAST_UPDATED}
                </Typography>
            </div>

            {/* Jurisdiction banner */}
            <div className="flex items-start gap-3 mb-12 p-5 rounded-xl border border-accent/30 bg-accent/5">
                <Icon icon={MapPin} className="size-5 text-accent shrink-0 mt-0.5"/>
                <div>
                    <Typography type="h6" className="text-sm font-semibold uppercase tracking-widest mb-1">
                        Jurisdiction Notice
                    </Typography>
                    <Typography type="body-sm" className="text-muted text-xs leading-relaxed">
                        Laws governing the possession, research, and cultivation of fungal materials vary
                        significantly by country, state, and municipality. It is your sole responsibility
                        to verify that your intended research activities comply with all applicable laws
                        in your jurisdiction before placing an order.
                    </Typography>
                </div>
            </div>

            {/* Permitted / Prohibited */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">

                <div className="p-6 rounded-xl border border-border bg-surface">
                    <div className="flex items-center gap-3 mb-5">
                        <Icon icon={CheckCircle} className="size-5 text-success shrink-0"/>
                        <Typography type="h6" className="text-sm font-semibold uppercase tracking-widest">
                            Permitted Uses
                        </Typography>
                    </div>
                    <ul className="flex flex-col gap-2.5 list-none">
                        {permitted.map((item, i) => (
                            <li key={i} className="flex gap-2.5 items-start">
                                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-success/60"/>
                                <Typography type="body-sm" className="text-muted leading-relaxed text-xs">
                                    {item}
                                </Typography>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="p-6 rounded-xl border border-border bg-surface">
                    <div className="flex items-center gap-3 mb-5">
                        <Icon icon={XCircle} className="size-5 text-danger shrink-0"/>
                        <Typography type="h6" className="text-sm font-semibold uppercase tracking-widest">
                            Prohibited Uses
                        </Typography>
                    </div>
                    <ul className="flex flex-col gap-2.5 list-none">
                        {prohibited.map((item, i) => (
                            <li key={i} className="flex gap-2.5 items-start">
                                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-danger/60"/>
                                <Typography type="body-sm" className="text-muted leading-relaxed text-xs">
                                    {item}
                                </Typography>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Age + Compliance */}
            <div className="flex items-start gap-3 mb-12 p-5 rounded-xl border border-border bg-surface">
                <Icon icon={UserCheck} className="size-5 text-accent shrink-0 mt-0.5"/>
                <div>
                    <Typography type="h6" className="text-sm font-semibold uppercase tracking-widest mb-1">
                        Age & Compliance Requirement
                    </Typography>
                    <Typography type="body-sm" className="text-muted text-xs leading-relaxed">
                        You must be 18 years of age or older to purchase from FOG Direct. By completing
                        a purchase you confirm that you are of legal age and that the acquisition of
                        research materials is lawful in your location. FOG Direct reserves the right to
                        refuse service where compliance cannot be verified.
                    </Typography>
                </div>
            </div>

            {/* Standards grid */}
            <div>
                <Typography type="span" className="text-xs uppercase tracking-widest text-muted font-mono mb-6 block">
                    Our Research Standards
                </Typography>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {standards.map((s) => (
                        <div
                            key={s.title}
                            className="p-5 rounded-xl border border-border bg-surface flex flex-col gap-3"
                        >
                            <div className="flex items-center gap-3">
                                <Icon icon={s.icon} className="size-5 text-accent shrink-0"/>
                                <Typography type="h6" className="text-sm font-semibold uppercase tracking-widest">
                                    {s.title}
                                </Typography>
                            </div>
                            <Typography type="body-sm" className="text-muted text-xs leading-relaxed">
                                {s.description}
                            </Typography>
                        </div>
                    ))}
                </div>
            </div>

        </section>
    );
}

import HeroSection from "@/components/heros/HeroSection";
import ProductSlider from "@/components/Sliders/ProductSlider";
import {products} from "@/data/products";
import {Typography} from "@heroui/react";
import Icon from "@/components/Icon/Icon";
import {FlaskConical, Network, ShieldCheck} from "lucide-react";
import CategoriesShowCase from "@/components/inventory/CategoriesShowCase";
import BackgroundImage from "@/components/BackgroundImage";

export default function Home() {
    return (<>
        <HeroSection/>
        <CategoriesShowCase/>
        <WhyFOG/>
        <ProductSlider title={"Featured Products"} productData={products} featured cardDepth/>
        <ProductSlider title={"FOG Products"} productData={products}/>
    </>);
}


const PILLARS = [{
    icon: FlaskConical,
    title: "SCIENCE FORWARD",
    subtitle: "BIOACTIVE INTEGRITY",
    description: "Precision-controlled extraction targets active fungal metabolites, including beta-glucans, hericenones, and triterpenoids, verified through consistent batch documentation."
}, {
    icon: Network,
    title: "MYCELIAL MATRIX",
    subtitle: "SOURCE & TAXONOMY",
    description: "Cultivated directly from verified genetic lineages. We prioritize whole-body fruiting structures and pure substrates without grain fillers or unverified isolates."
}, {
    icon: ShieldCheck,
    title: "SOVEREIGN COMMERCE",
    subtitle: "DISCREET DIRECT ORDERING",
    description: "Engineered for direct-to-consumer delivery with integrated cryptocurrency settlement, ephemeral session data, and privacy-conscious fulfillment."
}];

const WhyFOG = () => {
    return (
        <BackgroundImage darkImage={"/bg/bg-dark-r-to-l.jpg"}
                         lightImage={"/bg/bg-light-r-to-l.jpg"}>
            <section className="container container-space">
                <div className="grid grid-cols-12 gap-6 lg:gap-8 items-start">
                    {/* Section Header */}
                    <div className="col-span-12 lg:col-span-3 flex flex-col gap-2">
                        <Typography
                            type="span"
                            className="text-xs uppercase tracking-widest text-muted font-mono"
                        >
                            Origin & Protocol
                        </Typography>
                        <div className="flex flex-col">
                            <Typography type="span"
                                        className="text-3xl md:text-4xl uppercase font-light tracking-tight">
                                Why
                            </Typography>
                            <Typography
                                type="span"
                                className="text-5xl md:text-6xl font-atomic font-bold uppercase tracking-tighter text-foreground"
                            >
                                fog direct
                            </Typography>
                        </div>
                        <Typography type="body-sm" className="text-muted-foreground mt-2 max-w-xs">
                            Bridging fungal biology with modern editorial commerce. Pure fungal
                            biomass
                            backed by verified extraction.
                        </Typography>
                    </div>

                    {/* Feature Matrix */}
                    {PILLARS.map((pillar, index) => (<div
                        key={pillar.title}
                        className="h-full col-span-12 md:col-span-4 lg:col-span-3 flex flex-col gap-4 p-5 rounded-xl bg-background/40 border border-default-foreground/20 backdrop-blur-xs relative group hover:border-default-foreground/40 transition-colors"
                    >
                        <div className="flex items-center justify-between">
                            <Icon
                                icon={pillar.icon}
                                className="size-8 text-accent stroke-[1.5]"
                            />
                            <span className="text-[10px] font-mono text-muted tracking-widest">
                                0{index + 1} // PROTOCOL
                            </span>
                        </div>

                        <div className="flex flex-col gap-1">
                            <Typography type="h6"
                                        className="text-base uppercase tracking-wider text-foreground font-semibold">
                                {pillar.title}
                            </Typography>
                            <Typography type="span"
                                        className="text-[11px] font-mono uppercase text-muted tracking-tight">
                                {pillar.subtitle}
                            </Typography>
                        </div>

                        <Typography type="body-sm" className="text-muted text-xs leading-relaxed">
                            {pillar.description}
                        </Typography>

                        <div
                            className="mt-auto pt-3 border-t border-border/10 flex items-center justify-between">
                            <div
                                className="h-0.5 w-6 bg-accent/30 group-hover:bg-accent transition-colors"/>
                            <div className="size-1 rounded-full bg-neutral-700"/>
                        </div>
                    </div>))}
                </div>
            </section>
        </BackgroundImage>
    );
};

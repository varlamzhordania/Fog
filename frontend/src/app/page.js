import Link from "next/link";
import {Separator, Typography} from "@heroui/react";
import {
    ArrowRight,
    ExternalLink,
    PackageCheck,
    ShieldCheck,
    Truck,
    ShoppingBag,
    CreditCard,
    Package,
    Microscope,
} from "lucide-react";
import Icon from "@/components/icon/Icon";
import ContourBackground from "@/components/ContourBackground";
import CategoriesShowCase from "@/components/inventory/CategoriesShowCase";
import FeaturedProducts from "@/components/inventory/FeaturedProducts";
import HeroSection from "@/components/heros/HeroSection";
import Image from "@/components/Image";
import BackgroundImage from "@/components/BackgroundImage";
import DealsBand from "@/components/bands/DealsBand";
import ResearchBand from "@/components/bands/ResearchBand";
import {BestSellers, Deals, LastFew, NewArrivals} from "@/components/home/HomeSections";

const RESEARCH_URL = process.env.NEXT_PUBLIC_RESEARCH_URL;
const btnPrimary = "inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-medium text-accent-foreground no-underline transition-opacity hover:opacity-90";
const btnGhost = "inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 font-medium text-foreground no-underline transition-colors hover:border-accent hover:text-accent";

const TRUST = [
    {
        icon: CreditCard,
        title: "Flexible payments",
        text: "Choose from secure payment methods at checkout.",
    },
    {
        icon: Truck,
        title: "Discreet shipping",
        text: "Plain packaging with no external branding.",
    },
    {
        icon: PackageCheck,
        title: "Batch documented",
        text: "Every lot is tracked and documented.",
    },
    {
        icon: ShieldCheck,
        title: "Privacy minded",
        text: "No ad scripts and only the data we need.",
    },
];

const STEPS = [{
    step: "01",
    title: "Choose your products",
    text: "Browse our curated collection of lab supplies and cultures.",
    icon: ShoppingBag,
    tag: "NEW",
}, {
    step: "02",
    title: "Secure checkout",
    text: "Fast and encrypted payment process.",
    icon: CreditCard,
}, {
    step: "03",
    title: "Track your order",
    text: "Discreet shipping and real-time updates.",
    icon: Package,
}, {
    step: "04", title: "Grow and explore", text: "Start your research journey.", icon: Microscope,
},];

export default function Home() {
    return (
        <>

            <HeroSection/>

            <TrustStrip/>

            <CategoriesShowCase title="Shop by category"/>

            <section className="container">
                <FeaturedProducts
                    title="hand picked"
                    cardVariant="image"
                    page_size={12}
                    slidesPerView={1.15}
                    breakpoints={{
                        640: {slidesPerView: 1.5, spaceBetween: 16},
                        768: {slidesPerView: 2, spaceBetween: 20},
                        1024: {slidesPerView: 3, spaceBetween: 24},
                    }}
                    showDescription={false}
                    cardHeight="min-h-85"
                    actionLabel="View product"
                />
            </section>

            <DealsBand/>

            <NewArrivals/>

            <BestSellers/>

            <Deals/>

            <ResearchBand/>

            <HowItWorks/>

            <Story/>

            <Research/>
            <FinalCta/>

            <LastFew/>

        </>
    );
}


function TrustStrip() {
    return (
        <section className="container">
            <ul className="grid grid-cols-1 sm:grid-cols-2  lg:grid-cols-4 ">
                {TRUST.map((item) => (
                    <li
                        key={item.title}
                        className="flex items-start gap-3 px-0 py-5 sm:px-6 first:sm:pl-0 lg:py-4 first:lg:pl-0 last:lg:pr-0"
                    >
                        <Icon
                            icon={item.icon}
                            className="mt-0.5 size-5 shrink-0 text-accent"
                        />

                        <div className="min-w-0">
                            <p className="text-sm font-semibold">
                                {item.title}
                            </p>

                            <p className="mt-0.5 text-sm leading-relaxed text-muted">
                                {item.text}
                            </p>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
}

function HowItWorks() {
    return (<section className="container max-w-7xl">
        <div className="mb-6 flex flex-row items-center justify-between gap-4">
            <Typography
                type="h3"
                className="text-2xl font-bold uppercase tracking-tight text-accent/80 lg:text-4xl 2xl:text-5xl"
            >
                How it works
            </Typography>
        </div>
        <div
            className="relative mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {STEPS.map((step, index) => {
                const StepIcon = step.icon;
                const isLast = index === STEPS.length - 1;
                return (<div
                    key={step.step}
                    className="relative flex flex-col items-start"
                >
                    <div className="flex items-center gap-2.5">
                        <div
                            className="flex size-11 items-center justify-center rounded-xl border border-accent text-accent">
                            <Icon icon={StepIcon}/>
                        </div>
                        {step.tag && (<span
                            className="rounded-full border border-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                                            {step.tag}
                                        </span>)}
                    </div>

                    <Typography type={"h4"} className="mt-5 text-sm font-semibold tracking-tight ">
                            <span className="mr-1.5 font-mono text-accent">
                                {step.step}
                            </span>
                        {step.title}
                    </Typography>

                    <Typography type={"body-xs"}
                                className="mt-1.5 max-w-55 leading-relaxed text-muted">
                        {step.text}
                    </Typography>

                    {!isLast && (<div
                        className="pointer-events-none absolute right-5 top-1/2 hidden -translate-y-1/2 text-accent lg:block">
                        <Separator orientation={"vertical"} className={"h-45"}/>
                        <Icon icon={ArrowRight}
                              className="absolute top-1/2 -left-3 -translate-y-3 size-6 bg-background"/>
                    </div>)}
                </div>);
            })}
        </div>
    </section>);
}

function Research() {
    if (!RESEARCH_URL) return null;
    return (<section className="container  max-w-7xl">
        <div
            className="grid items-center gap-8 overflow-hidden rounded-3xl border border-border bg-surface p-6 sm:p-10 lg:grid-cols-2">
            {/* Image: immersive macro photography of mycelium spreading across agar */}
            <div
                className="relative min-h-65 overflow-hidden rounded-2xl bg-default lg:order-last lg:min-h-80">
                <Image
                    src="/research-2.webp"
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover"
                />
            </div>

            <div className="flex flex-col items-start gap-4">
                <Typography
                    type="h3"
                    className="text-2xl font-bold tracking-tight lg:text-3xl"
                >
                    Curious about the science?
                </Typography>

                <Typography
                    type="body"
                    className="max-w-md text-muted"
                >
                    Experiments, papers and the blog live on the main FOG research
                    site. Read how everything in this shop is grown and tested.
                </Typography>

                <a
                    href={RESEARCH_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={btnGhost}
                >
                    Visit the research site
                    <Icon icon={ExternalLink} className="size-4"/>
                </a>
            </div>
        </div>
    </section>);
}

function FinalCta() {
    return (
        <div className={"container-space"}>
            <BackgroundImage svg={<ContourBackground/>}>
                <section className="relative isolate overflow-hidden text-accent">
                    <div
                        className="container flex flex-col items-center gap-5 py-20 text-center text-foreground">
                        <Typography type="h2"
                                    className="text-4xl uppercase tracking-tight sm:text-5xl">
                            Ready when you are
                        </Typography>
                        <Typography type="body" className="max-w-md text-muted">
                            Pick your products, check out securely, and we pack it plain.
                        </Typography>
                        <Link href="/products" className={btnPrimary}>
                            Browse the shop <Icon icon={ArrowRight} className="size-4"/>
                        </Link>
                    </div>
                </section>
            </BackgroundImage>
        </div>
    );
}

function Story() {
    return (
        <section className="container container-space max-w-7xl">
            <div className="grid items-stretch gap-8 lg:grid-cols-12">
                <div
                    className="relative min-h-105 overflow-hidden rounded-xl border-2 bg-default lg:col-span-5">
                    <Image
                        src="/story.webp"
                        alt="Mycologist working with fungal cultures in a small research laboratory"
                        fill
                        sizes="(min-width: 1024px) 42vw, 100vw"
                        className="object-cover"
                    />
                </div>

                <div
                    className="flex h-full flex-col items-start gap-6 rounded-xl border bg-background-secondary p-6 lg:col-span-7 lg:p-8">
                    <Typography
                        type="h3"
                        className="text-2xl font-bold lg:text-4xl"
                    >
                        Grown by one mycologist,
                        <br/>
                        not a warehouse
                    </Typography>

                    <Typography
                        type="body"
                        className="max-w-xl leading-relaxed text-muted"
                    >
                        FOG started as independent mycology research. The shop exists
                        so the people who follow that work can access the same
                        materials: verified lineages, whole fruiting bodies, and
                        carefully selected substrates.
                    </Typography>

                    <dl className="grid w-full gap-5 sm:grid-cols-3">
                        {[
                            {
                                title: "Traceable",
                                text: "Every lineage is documented back to its source.",
                            },
                            {
                                title: "Pure",
                                text: "Whole fruiting bodies and clean, carefully selected substrates.",
                            },
                            {
                                title: "Documented",
                                text: "Batch records are kept for every lot we produce.",
                            },
                        ].map(({title, text}) => (
                            <div
                                key={title}
                                className="border-l-2 pl-4"
                            >
                                <dt className="text-sm font-semibold">
                                    {title}
                                </dt>
                                <dd className="mt-1.5 text-sm leading-relaxed text-muted">
                                    {text}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </div>
        </section>
    );
}

import Link from "next/link";
import {Typography} from "@heroui/react";
import {ArrowRight, Bitcoin, ExternalLink, PackageCheck, ShieldCheck, Truck} from "lucide-react";
import Icon from "@/components/Icon/Icon";
import ContourBackground from "@/components/ContourBackground";
import CategoriesShowCase from "@/components/inventory/CategoriesShowCase";
import FeaturedProducts from "@/components/inventory/FeaturedProducts";
import {
    DealsBand, FaqSection, HeroSearch, LastFew, ProductTabs, StatsRow,
} from "@/components/home/HomeSections";
import HeroSection from "@/components/heros/HeroSection";

const RESEARCH_URL = "https://example.com";
const btnPrimary = "inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-medium text-accent-foreground no-underline transition-opacity hover:opacity-90";
const btnGhost = "inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 font-medium text-foreground no-underline transition-colors hover:border-accent hover:text-accent";

const TRUST = [{
    icon: Bitcoin,
    title: "Pay with crypto",
    text: "Bitcoin, Monero, USDT and more, or card."
}, {
    icon: Truck,
    title: "Discreet shipping",
    text: "Plain packaging, no branding outside."
}, {
    icon: PackageCheck,
    title: "Batch documented",
    text: "Every lot ships with its records."
}, {icon: ShieldCheck, title: "No tracking", text: "No ad scripts. Minimal data kept."},];

const STEPS = [{
    title: "Choose your products",
    text: "Browse the shop and add what you need to your cart."
}, {
    title: "Pick a payment method",
    text: "Pay in crypto or by card. Your items are held for 60 minutes."
}, {
    title: "We pack it plain",
    text: "Orders are prepared within 1 to 3 business days."
}, {title: "Track your delivery", text: "Follow every step from your order page and by email."},];

export default function Home() {
    return (<>
        <HeroSection  />
        <TrustStrip/>
        <CategoriesShowCase title="Shop by category"/>

        <section className="container container-space">
            <FeaturedProducts title="Featured products" featured/>
        </section>

        <DealsBand/>
        <ShopByNeed/>
        <ProductTabs/>
        <StatsRow/>
        <Story/>
        <HowItWorks/>
        <LastFew/>
        <Payments/>
        <Delivery/>
        <ResearchBand/>
        <FaqSection/>
        <FinalCta/>
    </>);
}


function TrustStrip() {
    return (<section className="container">
        <ul className="grid grid-cols-1 gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST.map((item) => (<li key={item.title} className="flex items-start gap-3">
                <Icon icon={item.icon} className="mt-0.5 size-6 shrink-0 text-accent"/>
                <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted">{item.text}</p>
                </div>
            </li>))}
        </ul>
    </section>);
}

function ShopByNeed() {
    const tiles = [{
        title: "Start growing",
        text: "Ready-to-fruit blocks and log kits for first harvests at home.",
        href: "/products?category=fruiting-blocks", // IMAGE: Blue oyster mushrooms fruiting from a grow block on a kitchen counter,
        // warm daylight, wide 16:10 crop, empty space on the left for text.
    }, {
        title: "Extracts and powders",
        text: "Dual extracts and micronized powders with batch documentation.",
        href: "/products?category=dual-extracts", // IMAGE: Row of three amber dropper bottles and a small bowl of fine mushroom powder,
        // moody dark backdrop, wide 16:10 crop.
    }, {
        title: "Lab and microscopy",
        text: "Sterile media, slides and tools for the bench.",
        href: "/products?category=microscopy-tools", // IMAGE: Compound microscope with prepared spore slides and petri dishes on a clean
        // lab bench, cool light, wide 16:10 crop.
    },];

    return (<section className="container container-space">
        <Typography type="h3" className="mb-8 text-2xl font-bold tracking-tight lg:text-4xl">
            Find what you need
        </Typography>

        <div className="grid gap-4 md:grid-cols-3">
            {tiles.map((tile) => (<Link
                key={tile.title}
                href={tile.href}
                className="group relative flex min-h-[340px] flex-col justify-end overflow-hidden rounded-3xl bg-default p-6 no-underline"
            >
                {/* Place the tile image here as a next/image with `fill` and object-cover. */}
                <div
                    className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"/>
                <div className="relative text-white">
                    <p className="text-xl font-semibold">{tile.title}</p>
                    <p className="mt-1 text-sm text-white/80">{tile.text}</p>
                    <span
                        className="mt-4 inline-flex items-center gap-2 text-sm font-medium">
                                Shop now
                                <Icon icon={ArrowRight}
                                      className="size-4 transition-transform group-hover:translate-x-1"/>
                            </span>
                </div>
            </Link>))}
        </div>
    </section>);
}

function HowItWorks() {
    return (<section className="bg-surface">
        <div className="container container-space">
            <Typography type="h3"
                        className="max-w-xl text-2xl font-bold tracking-tight lg:text-4xl">
                How ordering works
            </Typography>

            <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {STEPS.map((step, i) => (
                    <li key={step.title} className="border-t-2 border-accent pt-5">
                        <span className="font-atomic text-3xl text-accent">{i + 1}</span>
                        <p className="mt-3 font-semibold">{step.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-muted">{step.text}</p>
                    </li>))}
            </ol>
        </div>
    </section>);
}

function ResearchBand() {
    return (<section className="container container-space">
        <div
            className="grid items-center gap-8 overflow-hidden rounded-3xl border border-border bg-surface p-6 sm:p-10 lg:grid-cols-2">
            {/* IMAGE: Macro photo of mycelium threads spreading across agar, blue-green tint,
                    high detail, 3:2. Decorative. */}
            <div
                className="min-h-[260px] rounded-2xl bg-default lg:order-last lg:min-h-[320px]"/>

            <div className="flex flex-col items-start gap-4">
                <Typography type="h3" className="text-2xl font-bold tracking-tight lg:text-3xl">
                    Curious about the science?
                </Typography>
                <Typography type="body" className="max-w-md text-muted">
                    Experiments, papers and the blog live on the main FOG research site. Read
                    how everything in this shop is grown and tested.
                </Typography>
                <a href={RESEARCH_URL} target="_blank" rel="noopener noreferrer"
                   className={btnGhost}>
                    Visit the research site <Icon icon={ExternalLink} className="size-4"/>
                </a>
            </div>
        </div>
    </section>);
}

function FinalCta() {
    return (<section className="relative isolate overflow-hidden text-accent">
        <ContourBackground/>
        <div
            className="container flex flex-col items-center gap-5 py-20 text-center text-foreground">
            <Typography type="h2"
                        className="font-atomic text-4xl uppercase tracking-tight sm:text-5xl">
                Ready when you are
            </Typography>
            <Typography type="body" className="max-w-md text-muted">
                Pick your products, pay privately, and we pack it plain.
            </Typography>
            <Link href="/products" className={btnPrimary}>
                Browse the shop <Icon icon={ArrowRight} className="size-4"/>
            </Link>
        </div>
    </section>);
}

/* ------------------------------------------------------------------ */

function Story() {
    return (<section className="container container-space">
        <div className="grid items-center gap-10 lg:grid-cols-12">
            {/* IMAGE: Portrait of the grower at a lab bench holding a petri dish, natural light,
                    candid, 4:5. Replace with a product-packing photo if no portrait is available. */}
            <div className="min-h-[420px] rounded-3xl bg-default lg:col-span-5"/>

            <div className="flex flex-col items-start gap-5 lg:col-span-7">
                <Typography type="h3" className="text-2xl font-bold tracking-tight lg:text-4xl">
                    Grown by one mycologist, not a warehouse
                </Typography>
                <Typography type="body" className="max-w-xl leading-relaxed text-muted">
                    FOG started as independent mycology research. The shop exists so the people
                    who
                    follow that work can get the same materials: verified lineages, whole
                    fruiting
                    bodies, no fillers. Most customers arrive by word of mouth, and we keep it
                    that way.
                </Typography>
                <dl className="grid w-full max-w-xl gap-6 sm:grid-cols-3">
                    {[["Verified lineages", "Every strain traced to its source."], ["No fillers", "Whole fruiting bodies and pure substrates."], ["Batch records", "Documentation with every lot."],].map(([t, d]) => (
                        <div key={t}>
                            <dt className="font-medium">{t}</dt>
                            <dd className="mt-1 text-sm text-muted">{d}</dd>
                        </div>))}
                </dl>
            </div>
        </div>
    </section>);
}

function Payments() {
    // ICONS: swap the text badges for official coin logos (SVG) if you have them.
    const coins = ["Bitcoin", "Monero", "Ethereum", "Litecoin", "USDT", "Card"];

    return (<section className="container container-space pb-0">
        <div
            className="rounded-3xl border border-border bg-surface px-6 py-12 text-center sm:px-12">
            <Typography type="h3" className="text-2xl font-bold tracking-tight lg:text-4xl">
                Private, flexible payment
            </Typography>
            <p className="mx-auto mt-3 max-w-lg text-muted">
                Crypto goes straight to the store wallet and is never held by a third party.
                No card data is stored.
            </p>
            <ul className="mt-8 flex flex-wrap justify-center gap-3">
                {coins.map((c) => (<li key={c}
                                       className="rounded-full border border-border px-5 py-2 text-sm font-medium">{c}</li>))}
            </ul>
        </div>
    </section>);
}

function Delivery() {
    const tiers = [["Standard", "5 to 10 business days", "Padded mailer, plain outside."], ["Priority", "3 to 5 business days", "Faster handling with tracking."], ["Express", "1 to 3 business days", "Tracking, signature and carrier insurance."],];

    return (<section className="container container-space">
        <Typography type="h3" className="mb-8 text-2xl font-bold tracking-tight lg:text-4xl">
            Delivery you can plan around
        </Typography>
        <div className="grid gap-4 md:grid-cols-3">
            {tiers.map(([name, time, text]) => (
                <div key={name} className="rounded-2xl border border-border p-6">
                    <p className="text-lg font-semibold">{name}</p>
                    <p className="mt-1 text-accent">{time}</p>
                    <p className="mt-3 text-sm text-muted">{text}</p>
                </div>))}
        </div>
        <Link href="/shipping"
              className="mt-6 inline-flex items-center gap-2 font-medium text-accent no-underline">
            Full shipping policy <Icon icon={ArrowRight} className="size-4"/>
        </Link>
    </section>);
}
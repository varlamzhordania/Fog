"use client";

import {useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {Accordion, Typography} from "@heroui/react";
import {ArrowRight, Search} from "lucide-react";
import Icon from "@/components/Icon/Icon";
import Image from "@/components/Image";
import ProductSlider from "@/components/Sliders/ProductSlider";
import {useHome} from "@/queries/inventory";
import {formatPrice} from "@/lib/payments";
import {notFoundImage} from "@/lib/config";


export function HeroSearch() {
    const router = useRouter();
    const [q, setQ] = useState("");

    return (
        <form
            role="search"
            onSubmit={(e) => {
                e.preventDefault();
                const text = q.trim();
                router.push(text ? `/products?search=${encodeURIComponent(text)}` : "/products");
            }}
            className="flex w-full max-w-md items-center gap-2 rounded-full border border-border bg-surface py-1.5 pl-4 pr-1.5 focus-within:border-accent"
        >
            <Icon icon={Search} className="size-4 shrink-0 text-muted"/>
            <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Search products"
                placeholder="Search lion's mane, spore prints, agar…"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-field-placeholder"
            />
            <button type="submit" className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
                Search
            </button>
        </form>
    );
}

/* Counts come from the new /inventory/home/ endpoint, so they are always real. */
export function StatsRow() {
    const {data} = useHome();
    const s = data?.stats;
    const items = s && [
        [s.products, "products in the shop"],
        [s.countries, "countries shipped to"],
        [s.orders_delivered, "orders delivered"],
    ].filter(([n]) => n > 0);

    if (!items?.length) return null;

    return (
        <section className="container container-space pb-0">
            <dl className="grid gap-8 border-y border-border py-10 text-center sm:grid-cols-3">
                {items.map(([n, label]) => (
                    <div key={label}>
                        <dd className="font-atomic text-5xl text-accent">{n.toLocaleString()}</dd>
                        <dt className="mt-1 text-sm text-muted">{label}</dt>
                    </div>
                ))}
            </dl>
        </section>
    );
}

const TABS = [
    {key: "new_arrivals", label: "New arrivals"},
    {key: "best_sellers", label: "Best sellers"},
    {key: "deals", label: "On sale"},
];

export function ProductTabs() {
    const {data, isLoading} = useHome();
    const [tab, setTab] = useState("new_arrivals");
    const available = TABS.filter((t) => isLoading || data?.[t.key]?.length);

    return (
        <section className="container container-space">
            <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Product lists">
                {available.map((t) => (
                    <button
                        key={t.key}
                        role="tab"
                        aria-selected={tab === t.key}
                        onClick={() => setTab(t.key)}
                        className={`rounded-full border px-5 py-2 text-sm font-medium transition-colors ${
                            tab === t.key
                                ? "border-accent bg-accent text-accent-foreground"
                                : "border-border hover:border-accent"
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>
            <ProductSlider
                key={tab}
                title={TABS.find((t) => t.key === tab).label}
                productData={data?.[tab] ?? []}
                isLoading={isLoading}
            />
        </section>
    );
}

/* Big-saving highlights from the same endpoint. Hidden when nothing is discounted. */
export function DealsBand() {
    const {data} = useHome();
    const deals = data?.deals?.slice(0, 3) ?? [];
    if (!deals.length) return null;

    return (
        <section className="bg-accent/10">
            <div className="container container-space grid items-center gap-10 lg:grid-cols-12">
                <div className="lg:col-span-4">
                    <Typography type="h3" className="font-atomic text-4xl uppercase tracking-tight lg:text-5xl">
                        Save up to {data.stats.max_discount}%
                    </Typography>
                    <p className="mt-3 max-w-xs text-muted">
                        The biggest price drops in the shop right now, while stock lasts.
                    </p>
                    <Link href="/products?ordering=store_price" className="mt-6 inline-flex items-center gap-2 font-medium text-accent no-underline">
                        See every deal <Icon icon={ArrowRight} className="size-4"/>
                    </Link>
                </div>

                <div className="grid gap-4 sm:grid-cols-3 lg:col-span-8">
                    {deals.map((p) => (
                        <Link key={p.id} href={`/products/${p.slug}/`}
                              className="group overflow-hidden rounded-2xl border border-border bg-surface no-underline">
                            <div className="relative aspect-square bg-default">
                                <Image src={p.primary_image?.file || notFoundImage} alt={p.name} fill
                                       sizes="(max-width: 640px) 100vw, 25vw"
                                       className="object-cover transition-transform duration-500 group-hover:scale-105"/>
                                <span className="absolute left-3 top-3 rounded-full bg-danger px-2.5 py-0.5 text-xs font-semibold text-danger-foreground">
                                    {p.discount_percentage}% off
                                </span>
                            </div>
                            <div className="p-4">
                                <p className="line-clamp-2 text-sm font-medium">{p.name}</p>
                                <p className="mt-2 flex items-baseline gap-2">
                                    <span className="text-lg font-semibold">{formatPrice(p.store_price)}</span>
                                    <span className="text-sm text-muted line-through">{formatPrice(p.base_price)}</span>
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}

export function LastFew() {
    const {data, isLoading} = useHome();
    if (!isLoading && !data?.last_few?.length) return null;

    return (
        <section className="container container-space">
            <ProductSlider title="Last few left" productData={data?.last_few ?? []} isLoading={isLoading}/>
        </section>
    );
}

const FAQ = [
    ["How do I pay?", "Pay with cryptocurrency or by card at checkout. Your items are held for 60 minutes while you complete payment."],
    ["How is my order packed?", "Every parcel ships in plain packaging with no branding, product names or logos on the outside."],
    ["How long does delivery take?", "Orders are packed in 1 to 3 business days. Delivery then takes about 3 to 10 business days, longer for international orders."],
    ["Do you ship internationally?", "Yes, to most countries. Customs and import rules are the buyer's responsibility, so check your local laws first."],
    ["Can I cancel or get a refund?", "Unpaid orders can be cancelled any time from the order page. Paid orders can be refunded before dispatch."],
];

export function FaqSection() {
    return (
        <section className="container container-space grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
                <Typography type="h3" className="text-2xl font-bold tracking-tight lg:text-4xl">Good to know</Typography>
                <p className="mt-3 text-muted">Quick answers before you order.</p>
                <Link href="/faq" className="mt-5 inline-flex items-center gap-2 font-medium text-accent no-underline">
                    All questions <Icon icon={ArrowRight} className="size-4"/>
                </Link>
            </div>
            <div className="lg:col-span-8">
                <Accordion variant="surface">
                    {FAQ.map(([q, a], i) => (
                        <Accordion.Item key={q} id={`faq-${i}`}>
                            <Accordion.Heading>
                                <Accordion.Trigger>
                                    {q}
                                    <Accordion.Indicator/>
                                </Accordion.Trigger>
                            </Accordion.Heading>
                            <Accordion.Panel>
                                <Accordion.Body>{a}</Accordion.Body>
                            </Accordion.Panel>
                        </Accordion.Item>
                    ))}
                </Accordion>
            </div>
        </section>
    );
}

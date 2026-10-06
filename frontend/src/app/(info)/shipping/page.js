import {Typography} from "@heroui/react";
import {AlertTriangle, Clock, CreditCard, Globe, MapPin, Package, Shield, Truck} from "lucide-react";
import Icon from "@/components/icon/Icon";

export const metadata = {
    title: "Shipping",
    description: "Shipping information for FOG Direct — discreet packaging, processing times, and delivery details.",
};

const SHIPPING_TIERS = [
    {
        name: "Standard",
        time: "5–10 business days",
        tracking: false,
        description: "Plain envelope or padded mailer. No external branding.",
    },
    {
        name: "Priority",
        time: "3–5 business days",
        tracking: true,
        description: "Expedited handling. Tracking number included.",
    },
    {
        name: "Express",
        time: "1–3 business days",
        tracking: true,
        description: "Fastest available. Full tracking and signature confirmation.",
    },
];

const CRYPTO_TIMES = [
    {coin: "Bitcoin (BTC)", confirmations: "2 confirmations", time: "~20–40 min"},
    {coin: "Monero (XMR)", confirmations: "10 confirmations", time: "~20 min"},
    {coin: "Ethereum (ETH)", confirmations: "12 confirmations", time: "~3–5 min"},
    {coin: "Litecoin (LTC)", confirmations: "3 confirmations", time: "~8–15 min"},
];

const INFO_CARDS = [
    {
        icon: Package,
        title: "Discreet Packaging",
        description:
            "Every order ships in plain, unmarked packaging. No logos, brand names, or content descriptors appear on the outside of any shipment. Return addresses are generic and do not reference FOG Direct.",
    },
    {
        icon: Clock,
        title: "Processing Time",
        description:
            "Orders enter our fulfillment queue after cryptocurrency payment confirmation. Processing takes 1–3 business days, depending on order complexity and current volume.",
    },
    {
        icon: Globe,
        title: "International Shipping",
        description:
            "We ship to most countries worldwide. Delivery times vary from 7 to 21 business days internationally. Customs clearance is the buyer's responsibility. We cannot guarantee delivery where import regulations prohibit our products.",
    },
    {
        icon: Shield,
        title: "Insurance & Liability",
        description:
            "Express tier shipments include basic carrier insurance. Standard and Priority tiers ship at buyer's risk. FOG Direct is not liable for packages lost, damaged, or seized by customs after carrier handover.",
    },
    {
        icon: Truck,
        title: "Carriers",
        description:
            "We use a mix of domestic and international carriers, selected based on your location and chosen shipping tier. Specific carrier information is included with your tracking number (when applicable).",
    },
    {
        icon: MapPin,
        title: "Address Accuracy",
        description:
            "Please ensure your shipping address is complete and accurate before submitting an order. We cannot reroute packages in transit. Address errors may result in lost shipments with no recourse.",
    },
];

export default function ShippingPage() {
    return (
        <section className="container container-space">

            {/* Header */}
            <div className="mb-16 border-b border-border pb-10">
                <Typography
                    type="span"
                    className="text-xs uppercase tracking-widest text-muted font-mono mb-3 block"
                >
                    Support / Shipping
                </Typography>
                <Typography
                    type="h1"
                    className="text-5xl md:text-6xl font-atomic uppercase tracking-tighter mb-4"
                >
                    Shipping Policy
                </Typography>
                <Typography type="body" className="text-muted max-w-2xl leading-relaxed">
                    Every order ships in discreet, unbranded packaging. Here is everything you need
                    to know about how we handle fulfillment, delivery times, and payment confirmation.
                </Typography>
            </div>

            {/* Crypto confirmation times */}
            <div className="mb-12">
                <div className="flex items-center gap-2 mb-5">
                    <Icon icon={CreditCard} className="size-4 text-accent"/>
                    <Typography type="span" className="text-xs uppercase tracking-widest text-muted font-mono">
                        Crypto Payment Confirmation
                    </Typography>
                </div>
                <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-sm">
                        <thead className="border-b border-border bg-surface">
                        <tr>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest text-muted">
                                Currency
                            </th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest text-muted">
                                Required Confirmations
                            </th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest text-muted">
                                Typical Time
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        {CRYPTO_TIMES.map((row, i) => (
                            <tr key={row.coin}
                                className={`border-b border-border last:border-b-0 ${i % 2 === 0 ? "bg-background" : "bg-surface"}`}>
                                <td className="px-5 py-3.5 text-xs font-mono text-foreground">{row.coin}</td>
                                <td className="px-5 py-3.5 text-xs text-muted">{row.confirmations}</td>
                                <td className="px-5 py-3.5 text-xs text-muted">{row.time}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Shipping tiers */}
            <div className="mb-12">
                <div className="flex items-center gap-2 mb-5">
                    <Icon icon={Truck} className="size-4 text-accent"/>
                    <Typography type="span" className="text-xs uppercase tracking-widest text-muted font-mono">
                        Shipping Tiers
                    </Typography>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {SHIPPING_TIERS.map((tier) => (
                        <div
                            key={tier.name}
                            className="p-5 rounded-xl border border-border bg-surface flex flex-col gap-3"
                        >
                            <div className="flex items-center justify-between">
                                <Typography type="h6" className="text-sm font-semibold uppercase tracking-wide">
                                    {tier.name}
                                </Typography>
                                <span
                                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${tier.tracking ? "border-success/40 text-success bg-success/10" : "border-border text-muted"}`}>
                                    {tier.tracking ? "Tracking" : "No Tracking"}
                                </span>
                            </div>
                            <Typography type="body-sm" className="text-accent text-xs font-mono font-medium">
                                {tier.time}
                            </Typography>
                            <Typography type="body-sm" className="text-muted text-xs leading-relaxed">
                                {tier.description}
                            </Typography>
                        </div>
                    ))}
                </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
                {INFO_CARDS.map((card) => (
                    <div
                        key={card.title}
                        className="p-5 rounded-xl border border-border bg-surface flex flex-col gap-3"
                    >
                        <div className="flex items-center gap-3">
                            <Icon icon={card.icon} className="size-5 text-accent shrink-0"/>
                            <Typography type="h6" className="text-sm font-semibold uppercase tracking-widest">
                                {card.title}
                            </Typography>
                        </div>
                        <Typography type="body-sm" className="text-muted text-xs leading-relaxed">
                            {card.description}
                        </Typography>
                    </div>
                ))}
            </div>

            {/* Warning banner */}
            <div className="flex items-start gap-3 p-5 rounded-xl border border-warning/30 bg-warning/5">
                <Icon icon={AlertTriangle} className="size-5 text-warning shrink-0 mt-0.5"/>
                <div>
                    <Typography type="h6" className="text-sm font-semibold uppercase tracking-widest mb-1 text-warning">
                        Customs & Import Responsibility
                    </Typography>
                    <Typography type="body-sm" className="text-muted text-xs leading-relaxed">
                        International orders may be subject to customs inspection and local import
                        duties. FOG Direct is not responsible for packages delayed, seized, or
                        returned by customs authorities. It is your responsibility to verify that
                        importing our products is lawful in your country before placing an order.
                    </Typography>
                </div>
            </div>

        </section>
    );
}

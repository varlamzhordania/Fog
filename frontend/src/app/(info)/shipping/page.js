import {Typography} from "@heroui/react";
import {
    AlertTriangle,
    Clock,
    Globe,
    MapPin,
    Package,
    Shield,
    Truck,
} from "lucide-react";
import Icon from "@/components/icon/Icon";
import {serverFetch} from "@/lib/api/server";
import {API_ENDPOINTS} from "@/lib/config";
import {formatPrice} from "@/lib/payments";

export const metadata = {
    title: "Shipping",
    description:
        "Shipping information for FOG Direct, including available methods, processing, delivery, and international orders.",
};

async function getTiers() {
    try {
        return (await serverFetch(API_ENDPOINTS.checkout.shippingMethods, {
            cache: "force-cache",
            nextOptions: {revalidate: 300},
        })) ?? [];
    } catch {
        return [];
    }
}

const INFO_CARDS = [
    {
        icon: Package,
        title: "Order Processing",
        description:
            "We prepare your order once payment is confirmed, and email you when it is processed and when it ships.",
    },
    {
        icon: Clock,
        title: "Delivery Estimates",
        description:
            "Delivery times depend on the selected shipping method, destination, carrier, customs procedures, and other circumstances outside the store's control. Delivery estimates are not guaranteed dates.",
    },
    {
        icon: Globe,
        title: "International Shipping",
        description:
            "We ship to the countries offered for each method at checkout. If none appear for your address, we can’t ship there yet.",
    },
    {
        icon: Shield,
        title: "Customs & Import",
        description:
            "International shipments may be subject to customs inspections, import restrictions, taxes, duties, or other local requirements. These requirements are the customer's responsibility.",
    },
    {
        icon: Truck,
        title: "Tracking",
        description:
            "Methods marked ‘Tracking included’ come with a tracking number. It appears on your order page and in your shipping email.",
    },
    {
        icon: MapPin,
        title: "Address Accuracy",
        description:
            "Customers are responsible for providing a complete and accurate delivery address. Incorrect or incomplete information can result in delays, failed delivery, or additional shipping requirements.",
    },
];

export default async function ShippingPage() {
    const tiers = await getTiers();

    return (
        <section className="container container-space">

            <div className="mb-16 border-b border-border pb-10">

                <Typography
                    type="span"
                    className="text-xs uppercase tracking-widest text-muted font-mono mb-3 block"
                >
                    Support / Shipping
                </Typography>

                <Typography
                    type="h1"
                    className="text-5xl md:text-6xl  uppercase tracking-tighter mb-4"
                >
                    Shipping Policy
                </Typography>

                <Typography
                    type="body"
                    className="text-muted max-w-2xl leading-relaxed"
                >
                    Available shipping methods, prices, and destination
                    restrictions are shown during checkout. The information
                    below explains how fulfillment and delivery work.
                </Typography>

            </div>

            {tiers.length > 0 && (
                <div className="mb-12">

                    <div className="flex items-center gap-2 mb-5">

                        <Icon
                            icon={Truck}
                            className="size-4 text-accent"
                        />

                        <Typography
                            type="span"
                            className="text-xs uppercase tracking-widest text-muted font-mono"
                        >
                            Available Shipping Methods
                        </Typography>

                    </div>

                    <div className="overflow-x-auto rounded-xl border border-border">

                        <table className="w-full text-sm">

                            <thead className="border-b border-border bg-surface">

                            <tr>

                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest text-muted">
                                    Method
                                </th>

                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest text-muted">
                                    Price
                                </th>

                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest text-muted">
                                    Delivery
                                </th>

                            </tr>

                            </thead>

                            <tbody>

                            {tiers.map((tier,x) => (
                                <tr
                                    key={x}
                                    className="border-b border-border last:border-b-0"
                                >

                                    <td className="px-5 py-4">
                                        {tier.name}
                                       {tier.includes_tracking && (
                                            <span className="ml-2 text-xs text-muted">Tracking included</span>
                                        )}
                                    </td>

                                    <td className="px-5 py-4 text-muted">
                                        {Number(tier.price) === 0 ? "Free" : formatPrice(tier.price)}
                                        {tier.free_over != null && (
                                            <span className="block text-xs">
                                                Free on orders over {formatPrice(tier.free_over)}
                                            </span>
                                        )}
                                    </td>

                                    <td className="px-5 py-4 text-muted">
                                        {tier.estimate || "See checkout"}
                                    </td>

                                </tr>
                            ))}

                            </tbody>

                        </table>

                    </div>

                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">

                {INFO_CARDS.map((card) => (
                    <div
                        key={card.title}
                        className="p-6 rounded-xl border border-border bg-surface"
                    >

                        <Icon
                            icon={card.icon}
                            className="size-6 text-accent mb-4"
                        />

                        <Typography
                            type="h6"
                            className="text-sm font-semibold uppercase tracking-wider mb-2"
                        >
                            {card.title}
                        </Typography>

                        <Typography
                            type="body-sm"
                            className="text-muted text-xs leading-relaxed"
                        >
                            {card.description}
                        </Typography>

                    </div>
                ))}

            </div>

            <div className="p-6 rounded-xl border border-accent/30 bg-accent/5">

                <div className="flex items-start gap-3">

                    <Icon
                        icon={AlertTriangle}
                        className="size-5 text-accent shrink-0"
                    />

                    <div>

                        <Typography
                            type="h6"
                            className="text-sm font-semibold uppercase tracking-widest mb-2"
                        >
                            Important
                        </Typography>

                        <Typography
                            type="body-sm"
                            className="text-muted text-xs leading-relaxed"
                        >
                            Customers are responsible for confirming that
                            products can legally be purchased, possessed,
                            imported, and used in their destination. Customs
                            duties, import taxes, permits, and other local
                            requirements are the customer's responsibility.
                        </Typography>

                    </div>

                </div>

            </div>

        </section>
    );
}
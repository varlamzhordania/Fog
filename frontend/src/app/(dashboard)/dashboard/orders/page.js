"use client";

import {useState} from "react";
import Link from "next/link";
import {Button, Skeleton, Typography} from "@heroui/react";
import {PackageSearch} from "lucide-react";
import Icon from "@/components/Icon/Icon";
import OrderRow from "@/components/dashboard/OrderRow";
import {useOrders} from "@/queries/checkout";
import {ORDER_STATUS} from "@/lib/orders";

const ORDER_PARAMS = {page_size: 500};
const PAGE_SIZE = 10;

const FILTERS = [
    {key: "all", label: "All"},
    ...Object.entries(ORDER_STATUS).map(([key, {label}]) => ({key, label})),
];

export default function OrdersPage() {
    const {data, isLoading, isError} = useOrders(ORDER_PARAMS);
    const [filter, setFilter] = useState("all");
    const [visible, setVisible] = useState(PAGE_SIZE);

    const orders = data?.results ?? data ?? [];
    const filtered = filter === "all" ? orders : orders.filter((order) => order.status === filter);

    const countFor = (key) => key === "all" ? orders.length : orders.filter((o) => o.status === key).length;

    const handleFilter = (key) => {
        setFilter(key);
        setVisible(PAGE_SIZE);
    };

    return (
        <div className="flex flex-col gap-6">
            <div>
                <Typography type="h2" className="text-2xl font-light tracking-tight">Orders</Typography>
                <Typography type="body-sm" className="text-muted">
                    Track your purchases and open an order for payment or shipping details.
                </Typography>
            </div>

            {/* Status filter */}
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter orders by status">
                {FILTERS.filter(({key}) => key === "all" || countFor(key) > 0).map(({key, label}) => (
                    <button
                        key={key}
                        role="tab"
                        aria-selected={filter === key}
                        onClick={() => handleFilter(key)}
                        className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                            filter === key
                                ? "border-accent bg-accent text-accent-foreground"
                                : "border-border hover:border-accent"
                        }`}
                    >
                        {label}
                        <span className="ml-1.5 opacity-70">{countFor(key)}</span>
                    </button>
                ))}
            </div>

            {isLoading && (
                <div className="flex flex-col gap-3">
                    {Array.from({length: 4}).map((_, index) => (
                        <Skeleton key={index} className="h-20 w-full rounded-xl"/>
                    ))}
                </div>
            )}

            {isError && (
                <Typography type="body-sm" className="text-danger">
                    We could not load your orders. Please refresh the page.
                </Typography>
            )}

            {!isLoading && !isError && filtered.length === 0 && (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-border py-16 text-center">
                    <Icon icon={PackageSearch} className="size-10 text-muted"/>
                    <Typography type="h4">
                        {orders.length === 0 ? "No orders yet" : "No orders with this status"}
                    </Typography>
                    <Typography type="body-sm" color="muted" className="max-w-sm">
                        {orders.length === 0
                            ? "When you place an order it will appear here."
                            : "Try another status to see more of your orders."}
                    </Typography>
                    {orders.length === 0 && (
                        <Link href="/products" className="mt-1">
                            <Button variant="secondary">Browse products</Button>
                        </Link>
                    )}
                </div>
            )}

            {filtered.slice(0, visible).map((order) => (
                <OrderRow key={order.id} order={order}/>
            ))}

            {filtered.length > visible && (
                <Button variant="secondary" className="self-center"
                        onPress={() => setVisible((current) => current + PAGE_SIZE)}>
                    Show more orders
                </Button>
            )}
        </div>
    );
}

"use client";

import Link from "next/link";
import {Button, Card, Skeleton, Typography} from "@heroui/react";
import {
    ArrowRight, ClipboardList, Clock, MapPinHouse, PackageCheck, PackageSearch, Wallet,
} from "lucide-react";
import Icon from "@/components/Icon/Icon";
import StatCard from "@/components/dashboard/StatCard";
import OrderRow from "@/components/dashboard/OrderRow";
import {useOrders} from "@/queries/checkout";
import {useAddresses} from "@/queries/account";
import {formatPrice} from "@/lib/payments";
import {getOrderStats} from "@/lib/orders";

// Largest page the API allows, so the stats cover the whole order history.
const ORDER_PARAMS = {page_size: 500};
const RECENT_ORDERS = 5;

export default function DashboardPage() {
    const {data: orderData, isLoading, isError} = useOrders(ORDER_PARAMS);
    const {data: addressData, isLoading: addressesLoading} = useAddresses();

    const orders = orderData?.results ?? orderData ?? [];
    const addresses = addressData?.results ?? addressData ?? [];
    const stats = getOrderStats(orders);

    const unpaidOrder = orders.find((order) => order.status === "payment");
    const defaultAddress = addresses.find((a) => a.is_default) ?? addresses[0];

    return (
        <div className="flex flex-col gap-8">

            {/* Unpaid order reminder */}
            {unpaidOrder && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4">
                    <div className="flex items-start gap-3">
                        <Icon icon={Clock} className="mt-0.5 size-5 shrink-0 text-warning"/>
                        <div>
                            <Typography type="body-sm" className="font-medium">
                                Order #{unpaidOrder.id} is waiting for payment
                            </Typography>
                            <Typography type="body-xs" className="text-muted">
                                Your items are reserved for a limited time.
                            </Typography>
                        </div>
                    </div>
                    <Link href={`/checkout/orders/${unpaidOrder.id}/`}
                          className="inline-flex items-center gap-2 text-sm font-medium text-accent no-underline">
                        Complete payment <Icon icon={ArrowRight} className="size-4"/>
                    </Link>
                </div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                <StatCard label="Total orders" value={stats.total} icon={ClipboardList}
                          isLoading={isLoading}/>
                <StatCard label="Total spent" value={formatPrice(stats.spent)} icon={Wallet}
                          hint="Paid orders only" isLoading={isLoading}/>
                <StatCard label="In progress" value={stats.inProgress} icon={PackageCheck}
                          hint="Paid, not delivered yet" isLoading={isLoading}/>
                <StatCard label="Awaiting payment" value={stats.awaitingPayment} icon={Clock}
                          isLoading={isLoading}/>
            </div>

            <div className="grid grid-cols-12 items-start gap-8">

                {/* Recent orders */}
                <section className="col-span-12 flex flex-col gap-4 xl:col-span-8">
                    <div className="flex items-center justify-between gap-4">
                        <Typography type="h3" className="text-lg font-medium">Recent orders</Typography>
                        {orders.length > 0 && (
                            <Link href="/dashboard/orders"
                                  className="text-sm text-accent no-underline hover:underline">
                                View all
                            </Link>
                        )}
                    </div>

                    {isLoading && (
                        <div className="flex flex-col gap-3">
                            {Array.from({length: 3}).map((_, index) => (
                                <Skeleton key={index} className="h-20 w-full rounded-xl"/>
                            ))}
                        </div>
                    )}

                    {isError && (
                        <Typography type="body-sm" className="text-danger">
                            We could not load your orders. Please refresh the page.
                        </Typography>
                    )}

                    {!isLoading && !isError && orders.length === 0 && (
                        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border py-14 text-center">
                            <Icon icon={PackageSearch} className="size-10 text-muted"/>
                            <Typography type="h4">No orders yet</Typography>
                            <Typography type="body-sm" color="muted" className="max-w-sm">
                                Orders you place will show up here with their status and tracking.
                            </Typography>
                            <Link href="/products" className="mt-1">
                                <Button variant="secondary">Browse products</Button>
                            </Link>
                        </div>
                    )}

                    {orders.slice(0, RECENT_ORDERS).map((order) => (
                        <OrderRow key={order.id} order={order}/>
                    ))}
                </section>

                {/* Default address */}
                <aside className="col-span-12 xl:col-span-4">
                    <Card>
                        <Card.Content className="flex flex-col gap-4 p-5">
                            <div className="flex items-center gap-3">
                                <Icon icon={MapPinHouse} className="size-5 text-accent"/>
                                <Typography type="h3" className="text-lg font-medium">
                                    Delivery address
                                </Typography>
                            </div>

                            {addressesLoading ? (
                                <Skeleton className="h-20 w-full rounded-lg"/>
                            ) : defaultAddress ? (
                                <div className="flex flex-col gap-0.5 text-sm">
                                    <span className="font-medium">{defaultAddress.full_name}</span>
                                    <span className="text-muted">
                                        {[defaultAddress.line1, defaultAddress.line2].filter(Boolean).join(", ")}
                                    </span>
                                    <span className="text-muted">
                                        {[
                                            defaultAddress.city,
                                            defaultAddress.state,
                                            defaultAddress.postal_code,
                                            defaultAddress.country,
                                        ].filter(Boolean).join(", ")}
                                    </span>
                                </div>
                            ) : (
                                <Typography type="body-sm" className="text-muted">
                                    You have not saved an address yet.
                                </Typography>
                            )}

                            <Link href="/dashboard/addresses"
                                  className="text-sm text-accent no-underline hover:underline">
                                {defaultAddress ? "Manage addresses" : "Add an address"}
                            </Link>
                        </Card.Content>
                    </Card>
                </aside>
            </div>
        </div>
    );
}

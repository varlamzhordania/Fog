import Link from "next/link";
import {Typography} from "@heroui/react";
import {ChevronRight} from "lucide-react";
import Icon from "@/components/icon/Icon";
import OrderStatusChip from "@/components/dashboard/OrderStatusChip";
import {formatPrice} from "@/lib/payments";
import {formatDate, summarizeItems} from "@/lib/orders";

const OrderRow = ({order}) => {
    return (
        <Link
            href={`/checkout/orders/${order.id}/`}
            className="group flex items-center gap-4 rounded-xl border border-border bg-surface p-4 no-underline transition-colors hover:border-accent"
        >
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Typography type="body-sm" className="font-medium">
                        Order #{order.id}
                    </Typography>
                    <OrderStatusChip status={order.status}/>
                </div>

                <Typography type="body-xs" className="truncate text-muted">
                    {summarizeItems(order.items) || "No items"}
                </Typography>

                <Typography type="body-xs" className="text-muted">
                    Placed {formatDate(order.created_at)}
                </Typography>
            </div>

            <div className="flex shrink-0 items-center gap-3">
                <span className="font-medium">{formatPrice(order.total_price)}</span>
                <Icon icon={ChevronRight}
                      className="size-4 text-muted transition-transform group-hover:translate-x-0.5"/>
            </div>
        </Link>
    );
};

export default OrderRow;

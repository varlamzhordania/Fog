import {Chip} from "@heroui/react";
import {ORDER_STATUS} from "@/lib/orders";

const OrderStatusChip = ({status, size = "sm"}) => {
    const {label, color} = ORDER_STATUS[status] ?? {label: status, color: "default"};

    return (
        <Chip color={color} size={size}>
            <Chip.Label>{label}</Chip.Label>
        </Chip>
    );
};

export default OrderStatusChip;

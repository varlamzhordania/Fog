export const ORDER_STATUS = {
    payment: {label: "Awaiting payment", color: "warning"},
    pending: {label: "Payment received", color: "accent"},
    processing: {label: "Preparing", color: "accent"},
    shipped: {label: "Shipped", color: "accent"},
    delivered: {label: "Delivered", color: "success"},
    cancelled: {label: "Cancelled", color: "danger"},
};

// Statuses of orders the customer has paid for.
const PAID_STATUSES = ["pending", "processing", "shipped", "delivered"];
// Paid orders that have not reached the customer yet.
const IN_PROGRESS_STATUSES = ["pending", "processing", "shipped"];

export const formatDate = (value, options = {dateStyle: "medium"}) =>
    value ? new Date(value).toLocaleString(undefined, options) : "";

// "2 × Product A, 1 × Product B +3 more"
export const summarizeItems = (items = [], visible = 2) => {
    const names = items.map((item) => `${item.quantity} × ${item.product_name ?? "Removed product"}`);
    const extra = names.length - visible;

    return names.slice(0, visible).join(", ") + (extra > 0 ? ` +${extra} more` : "");
};

export const getOrderStats = (orders = []) => ({
    total: orders.length,
    spent: orders
        .filter((order) => PAID_STATUSES.includes(order.status))
        .reduce((sum, order) => sum + Number(order.total_price || 0), 0),
    inProgress: orders.filter((order) => IN_PROGRESS_STATUSES.includes(order.status)).length,
    awaitingPayment: orders.filter((order) => order.status === "payment").length,
});

const names = items.map((item) =>
    `${item.quantity} × ${item.product_name ?? "Removed product"}${item.price_label ? ` (${item.price_label})` : ""}`);
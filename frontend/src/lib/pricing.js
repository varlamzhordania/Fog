export function computeTotals(subtotal, config, shipping = 0) {
    const sub = Math.round(Number(subtotal || 0) * 100);
    const ship = Math.round(Number(shipping || 0) * 100);
    const gross = sub + ship;
    const rate = Number(config?.TAX_RATE ?? 0);

    if (!config?.TAX_ENABLED || !(rate > 0)) {
        return {subtotal: sub / 100, shipping: ship / 100, tax: 0, total: gross / 100, rate: 0, name: "", included: false};
    }

    const included = Boolean(config.PRICES_INCLUDE_TAX);
    const base = sub + (config.TAX_ON_SHIPPING === false ? 0 : ship);
    const tax = Math.round(included ? (base * rate) / (100 + rate) : (base * rate) / 100);

    return {
        subtotal: sub / 100,
        shipping: ship / 100,
        tax: tax / 100,
        total: (included ? gross : gross + tax) / 100,
        rate,
        name: config.TAX_NAME || "Tax",
        included,
    };
}

export const taxLabel = (t) => `${t.included ? "Includes " : ""}${t.name} (${t.rate}%)`;

export const shippingCost = (method, subtotal) => {
    if (!method) return 0;
    const free = method.free_over != null && Number(subtotal) >= Number(method.free_over);
    return free ? 0 : Number(method.price);
};

export const servesCountry = (method, country) => {
    const allowed = method.countries ?? [];
    const value = String(country ?? "").trim().toLowerCase();
    return allowed.length === 0 || allowed.some((c) => c.toLowerCase() === value);
};

export const getDefaultPrice = (product) =>
    product?.prices?.find((p) => p.is_default) ?? product?.prices?.[0] ?? null;

export const stockLabel = (product) =>
    product.stock_unit && product.stock_unit !== "unit"
        ? `${product.available_stock} ${product.stock_unit} in stock`
        : `${product.available_stock} available`;
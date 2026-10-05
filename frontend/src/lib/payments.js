export const formatPrice = (value, currency = "USD") =>
    new Intl.NumberFormat("en-US", {style: "currency", currency}).format(Number(value || 0));

// Chain codes are the ones Xcash uses in its API.
const CHAINS = {
    ethereum: {label: "Ethereum", tx: "https://etherscan.io/tx/"},
    bsc: {label: "BNB Smart Chain", tx: "https://bscscan.com/tx/"},
    polygon: {label: "Polygon", tx: "https://polygonscan.com/tx/"},
    "arbitrum-one": {label: "Arbitrum One", tx: "https://arbiscan.io/tx/"},
    optimism: {label: "Optimism", tx: "https://optimistic.etherscan.io/tx/"},
    base: {label: "Base", tx: "https://basescan.org/tx/"},
    tron: {label: "Tron", tx: "https://tronscan.org/#/transaction/"},
    sepolia: {label: "Sepolia (testnet)", tx: "https://sepolia.etherscan.io/tx/"},
    nile: {label: "Nile (testnet)", tx: "https://nile.tronscan.org/#/transaction/"},
};

export const chainLabel = (code) => {
    if (!code) return "";
    return CHAINS[code]?.label ?? String(code).replace(/-/g, " ");
};

export const explorerTxUrl = (chain, hash) => {
    const base = CHAINS[chain]?.tx;
    return base && hash ? `${base}${hash}` : null;
};

/**
 * Turns a payment method from the API into display data.
 * Xcash methods use asset = "TICKER@chain" (e.g. "USDT@ethereum").
 */
export function describeMethod(method) {
    const asset = method?.asset || "";
    const [ticker, network] = asset.includes("@") ? asset.split("@") : [asset, ""];
    const isCard = method?.provider === "stripe";
    const isGateway = method?.provider === "xcash" && !network;

    return {
        ticker: ticker ? ticker.toUpperCase() : null,
        network: network ? chainLabel(network) : null,
        isCard,
        isGateway,
    };
}

export const shortHash = (value, head = 8, tail = 6) => {
    const text = String(value || "");
    return text.length > head + tail + 3 ? `${text.slice(0, head)}…${text.slice(-tail)}` : text;
};

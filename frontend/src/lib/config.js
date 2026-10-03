const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'http://localhost:8000';

const API_BASE = `${API_BASE_URL}/api/v1`;

export const API_ENDPOINTS = {
    inventory: {
        products: `${API_BASE}/inventory/products/`,
        productDetail: (slug) =>
            `${API_BASE}/inventory/products/${slug}/`,
        priceRange: `${API_BASE}/inventory/price-range/`,
        categories: `${API_BASE}/inventory/categories/`,
        tags: `${API_BASE}/inventory/tags/`,
    },

    auth: {
        authorize: `/api/auth/authorize/`,
        token: `${API_BASE_URL}/api/auth/token/`,
        refresh: `/api/auth/refresh-token`,
        convertToken: `${API_BASE_URL}/api/auth/convert-token/`,
        revokeToken: `${API_BASE_URL}/api/auth/revoke-token/`,
        invalidateSessions:
            `${API_BASE_URL}/api/auth/invalidate-sessions/`,
        invalidateRefreshTokens:
            `${API_BASE_URL}/api/auth/invalidate-refresh-tokens/`,
        disconnectBackend:
            `${API_BASE_URL}/api/auth/disconnect-backend/`,

        social: {
            login: (backend) =>
                `${API_BASE_URL}/api/auth/login/${backend}/`,
            complete: (backend) =>
                `${API_BASE_URL}/api/auth/complete/${backend}/`,
            disconnect: (backend) =>
                `${API_BASE_URL}/api/auth/disconnect/${backend}/`,
            disconnectById: (backend, id) =>
                `${API_BASE_URL}/api/auth/disconnect/${backend}/${id}/`,
        },
    },

    account: {
        me: `${API_BASE}/account/`,
        register: `${API_BASE}/account/register/`,
        address: `${API_BASE}/account/address/`,
        addressDetail: (id) =>
            `${API_BASE}/account/address/${id}/`,
        passwordReset:
            `${API_BASE}/account/password-reset/`,
        passwordResetConfirm:
            `${API_BASE}/account/password-reset-confirm/`,
    },

    checkout: {
        paymentMethods: `${API_BASE}/checkout/payment-methods/`,
        cart: `${API_BASE}/checkout/cart/`,
        cartItem: `${API_BASE}/checkout/cart/items/`,
        cartItemDetail: (id) => `${API_BASE}/checkout/cart/items/${id}/`,
        orderCreate:
            `${API_BASE}/checkout/orders/create/`,
        orderList: `${API_BASE}/checkout/orders/`,
        orderDetail: (id) =>
            `${API_BASE}/checkout/orders/${id}/`,
        orderPay: (id) => `${API_BASE}/checkout/orders/${id}/pay/`,
        orderCancel: (id) => `${API_BASE}/checkout/orders/${id}/cancel/`,
    },

    website: {
        config: `${API_BASE}/settings/`,
    },
};

export const notFoundImage = 'https://placehold.co/200.png?text=Not Found'
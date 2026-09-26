const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'http://localhost:8000';

const API_BASE = `${API_BASE_URL}/api/v1`;

export const API_ENDPOINTS = {
    inventory: {
        products: `${API_BASE}/inventory/products/`,
        productDetail: (slug) =>
            `${API_BASE}/inventory/products/${slug}/`,
        categories: `${API_BASE}/inventory/categories/`,
        tags: `${API_BASE}/inventory/tags/`,
    },

    auth: {
        authorize: `${API_BASE_URL}/api/auth/authorize/`,
        token: `${API_BASE_URL}/api/auth/token/`,
        refresh: `${API_BASE_URL}/api/auth/token/`,
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
        address: `${API_BASE}/account/address/`,
        addressDetail: (id) =>
            `${API_BASE}/account/address/${id}/`,
        passwordReset:
            `${API_BASE}/account/password-reset/`,
        passwordResetConfirm:
            `${API_BASE}/account/password-reset-confirm/`,
    },

    checkout: {
        cart: `${API_BASE}/checkout/cart/`,
        orderCreate:
            `${API_BASE}/checkout/orders/create/`,
        orderList: (page, pageSize) =>
            `${API_BASE}/checkout/orders/?page=${page}&page_size=${pageSize}`,
        orderDetail: (id) =>
            `${API_BASE}/checkout/orders/${id}/`,
    },

    website: {
        config: `${API_BASE}/settings/`,
    },
};
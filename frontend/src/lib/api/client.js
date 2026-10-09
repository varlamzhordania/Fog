import axios from 'axios';
import { API_ENDPOINTS } from '@/lib/config';
import { useAuthStore } from '@/stores/auth';

const apiClient = axios.create({
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

let refreshPromise = null;

async function refreshAccessToken() {
    if (refreshPromise) {
        return refreshPromise;
    }

    refreshPromise = axios
        .post(
            API_ENDPOINTS.auth.refresh,
            {},
            {
                withCredentials: true,
            }
        )
        .then((response) => {
            const {
                access_token,
            } = response.data;

            useAuthStore.setState({
                access_token,
                logged_in: true,
            });

            return true;
        })
        .finally(() => {
            refreshPromise = null;
        });

    return refreshPromise;
}


// Attach access token
apiClient.interceptors.request.use((config) => {
    const { access_token } = useAuthStore.getState();

    if (access_token) {
        config.headers.Authorization =
            `Bearer ${access_token}`;
    }

    return config;
});

const REFRESH_EXCLUDED_URLS = [
    "/api/auth/authorize",
];

apiClient.interceptors.response.use(
    (response) => response,

    async (error) => {
        const originalRequest = error.config;

        const isExcluded = REFRESH_EXCLUDED_URLS.some((url) =>
            originalRequest?.url?.includes(url)
        );

        if (
            error.response?.status === 401 &&
            !originalRequest?._retry &&
            !isExcluded
        ) {
            originalRequest._retry = true;

            try {
                await refreshAccessToken();

                const {access_token} = useAuthStore.getState();

                originalRequest.headers.Authorization =
                    `Bearer ${access_token}`;

                return apiClient(originalRequest);

            } catch {
                useAuthStore.getState().clearAuth();
                fetch("/api/auth/logout/", {method: "POST", credentials: "include"}).catch(() => {});
                return Promise.reject(error);
            }
        }

        throw error;
    }
);

export default apiClient;
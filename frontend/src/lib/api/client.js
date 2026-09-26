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
                expires_in,
            } = response.data;

            useAuthStore.setState({
                access_token,
                expire_in: expires_in,
                logged_in: true,
            });

            return access_token;
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


// Handle 401
apiClient.interceptors.response.use(
    (response) => response,

    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            !originalRequest?._retry
        ) {
            originalRequest._retry = true;

            try {
                const accessToken =
                    await refreshAccessToken();

                originalRequest.headers.Authorization =
                    `Bearer ${accessToken}`;

                return apiClient(originalRequest);
            } catch {
                useAuthStore.getState().clearAuth();

                throw {
                    status: 401,
                    data: {
                        detail:
                            'Unauthorized: Please log in again.',
                    },
                };
            }
        }

        throw {
            status: error.response?.status || 0,
            data:
                error.response?.data || {
                    detail:
                        error.message || 'Network error.',
                },
        };
    }
);

export default apiClient;
import {create} from 'zustand';
import {persist} from 'zustand/middleware';

export const useAuthStore = create(
    persist(
        (set) => ({
            access_token: null,
            refresh_token: null,
            logged_in: false,
            user: null,

            setAuth: ({
                          access_token,
                          refresh_token = null,
                          user = null,
                      }) =>
                set({
                    access_token,
                    refresh_token,
                    logged_in: true,
                    user,
                }),

            clearAuth: () =>
                set({
                    access_token: null,
                    refresh_token: null,
                    logged_in: false,
                    user: null,
                }),
        }),
        {
            name: 'fog_auth',
            skipHydration: true,
        }
    )
);
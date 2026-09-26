import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { API_ENDPOINTS } from '@/lib/config';
import apiClient from '@/lib/api/client';
import { toast } from '@heroui/react';

export const CONFIG_CACHE_TTL_MS = 15 * 60 * 1000;

export const useConfigStore = create(
    persist(
        (set, get) => ({
            config: {},
            loading: false,
            loaded: false,
            lastFetched: null,
            error: null,

            theme: 'dark',

            isCacheExpired: () => {
                const { lastFetched } = get();

                if (!lastFetched) return true;

                return Date.now() - lastFetched > CONFIG_CACHE_TTL_MS;
            },

            toggleTheme: () => {
                const currentTheme = get().theme;
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

                set({ theme: newTheme });

                // Update document theme
                document.documentElement.classList.remove('dark', 'light');

                document.documentElement.classList.add(newTheme);

                document.documentElement.setAttribute(
                    'data-theme',
                    newTheme
                );
            },

            setTheme: (theme) => {
                set({ theme });

                document.documentElement.classList.remove('dark', 'light');

                document.documentElement.classList.add(theme);

                document.documentElement.setAttribute(
                    'data-theme',
                    theme
                );
            },

            load: async (force = false) => {
                const { loaded, config, isCacheExpired } = get();

                if (
                    !force &&
                    loaded &&
                    Object.keys(config).length > 0 &&
                    !isCacheExpired()
                ) {
                    return config;
                }

                set({
                    loading: true,
                    error: null,
                });

                try {
                    const response = await apiClient.get(
                        API_ENDPOINTS.website.config
                    );

                    const data = response.data;

                    set({
                        config: data,
                        loading: false,
                        loaded: true,
                        lastFetched: Date.now(),
                        error: null,
                    });

                    return data;
                } catch (error) {
                    const message =
                        error instanceof Error
                            ? error.message
                            : 'Failed to load website configuration';

                    const id = toast.danger(
                        'Something went wrong!',
                        {
                            actionProps: {
                                children: 'Dismiss',
                                onPress: () => toast.close(id),
                                variant: 'tertiary',
                            },
                            description: message,
                        }
                    );

                    const existingConfig = get().config;
                    const hasExisting =
                        existingConfig &&
                        Object.keys(existingConfig).length > 0;

                    set({
                        loading: false,
                        loaded: hasExisting,
                        error: hasExisting ? null : message,
                    });

                    if (!hasExisting) {
                        throw error;
                    }

                    return existingConfig;
                }
            },

            get: (key, defaultValue = null) => {
                return get().config[key] ?? defaultValue;
            },

            reset: () => {
                set({
                    config: {},
                    loading: false,
                    loaded: false,
                    lastFetched: null,
                    error: null,
                });
            },
        }),
        {
            name: 'fog_config_storage',

            storage: createJSONStorage(() => localStorage),

            partialize: (state) => ({
                config: state.config,
                loaded: state.loaded,
                lastFetched: state.lastFetched,
                theme: state.theme,
            }),

            onRehydrateStorage: () => (state) => {
                if (!state || typeof document === 'undefined') return;

                const theme = state.theme || 'dark';

                document.documentElement.classList.remove(
                    'dark',
                    'light'
                );

                document.documentElement.classList.add(theme);

                document.documentElement.setAttribute(
                    'data-theme',
                    theme
                );
            },
        }
    )
);
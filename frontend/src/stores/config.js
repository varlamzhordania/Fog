import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { API_ENDPOINTS } from '@/lib/config';
import apiClient from "@/lib/api/client";

// Cache configuration for 15 minutes (in milliseconds)
export const CONFIG_CACHE_TTL_MS = 15 * 60 * 1000;

export const useConfigStore = create(
  persist(
    (set, get) => ({
      config: {},
      loading: false,
      loaded: false,
      lastFetched: null,
      error: null,

      /**
       * Checks whether the current cached configuration is stale.
       */
      isCacheExpired: () => {
        const { lastFetched } = get();
        if (!lastFetched) return true;
        return Date.now() - lastFetched > CONFIG_CACHE_TTL_MS;
      },

      /**
       * Loads configuration from cache or network.
       * @param {boolean} force - If true, bypasses the cache TTL and forces a network fetch.
       */
      load: async (force = false) => {
        const { loaded, config, isCacheExpired } = get();

        // 1. Serve from cache if valid and not forcing refresh
        if (!force && loaded && Object.keys(config).length > 0 && !isCacheExpired()) {
          return config;
        }

        set({
          loading: true,
          error: null,
        });

        try {
          const response = await apiClient.get(API_ENDPOINTS.website.config);
          const data = await response.data;

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
            error instanceof Error ? error.message : 'Unknown configuration error';
          console.error('Failed to load website configuration:', message);

          const existingConfig = get().config;
          const hasExisting = existingConfig && Object.keys(existingConfig).length > 0;

          // If network failed but we have cached config, fail gracefully
          set({
            loading: false,
            loaded: hasExisting ? true : false,
            error: hasExisting ? null : message,
          });

          if (!hasExisting) {
            throw error;
          }

          return existingConfig;
        }
      },

      /**
       * Safely retrieves a configuration key with a fallback value.
       */
      get: (key, defaultValue = null) => {
        return get().config[key] ?? defaultValue;
      },

      /**
       * Resets the store and invalidates persisted cache.
       */
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
      // Only persist configuration data, loaded flag, and timestamp
      partialize: (state) => ({
        config: state.config,
        loaded: state.loaded,
        lastFetched: state.lastFetched,
      }),
    }
  )
);
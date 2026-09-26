import { create } from 'zustand';

export const useConfigStore = create((set, get) => ({
  config: {},
  loading: false,
  loaded: false,
  error: null,

  load: async () => {
    // Don't fetch again if already loaded
    if (get().loaded) {
      return;
    }

    set({
      loading: true,
      error: null,
    });

    try {
      const response = await fetch(CONFIG_URL);

      if (!response.ok) {
        throw new Error(
          `Failed to load config: ${response.status}`
        );
      }

      const data = await response.json();

      set({
        config: data,
        loading: false,
        loaded: true,
        error: null,
      });

      return data;
    } catch (error) {
      console.error(
        'Failed to load website configuration:',
        error
      );

      set({
        loading: false,
        loaded: false,
        error: error.message,
      });

      throw error;
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
      error: null,
    });
  },
}));
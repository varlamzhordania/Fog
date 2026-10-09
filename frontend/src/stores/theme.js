import {create} from "zustand";
import {persist, createJSONStorage} from "zustand/middleware";

export const useThemeStore = create(
    persist(
        (set, get) => ({
            theme: "dark",

            toggleTheme: () => {
                const newTheme =
                    get().theme === "dark"
                        ? "light"
                        : "dark";

                set({theme: newTheme});

                document.documentElement.classList.remove(
                    "dark",
                    "light"
                );

                document.documentElement.classList.add(newTheme);
                document.documentElement.setAttribute(
                    "data-theme",
                    newTheme
                );
            },

            setTheme: (theme) => {
                set({theme});

                document.documentElement.classList.remove(
                    "dark",
                    "light"
                );

                document.documentElement.classList.add(theme);
                document.documentElement.setAttribute(
                    "data-theme",
                    theme
                );
            },
        }),
        {
            name: "fog_theme",
            storage: createJSONStorage(() => localStorage),
            skipHydration: true,
            onRehydrateStorage: () => (state) => {
                if (!state || typeof document === "undefined") {
                    return;
                }

                const theme = state.theme || "dark";

                document.documentElement.classList.remove(
                    "dark",
                    "light"
                );

                document.documentElement.classList.add(theme);
                document.documentElement.setAttribute(
                    "data-theme",
                    theme
                );
            },
        }
    )
);
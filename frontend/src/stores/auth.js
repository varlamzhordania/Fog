import {create} from "zustand";

export const useAuthStore = create((set) => ({
    access_token: null,
    logged_in: false,
    user: null,

    setAuth: ({access_token = null, user = null}) =>
        set({access_token, logged_in: true, user}),

    clearAuth: () => set({access_token: null, logged_in: false, user: null}),
}));
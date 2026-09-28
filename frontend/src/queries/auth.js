"use client";

import {useMutation} from "@tanstack/react-query";
import {useAuthStore} from "@/stores/auth";

/**
 * Thin fetch wrapper for Next.js auth API routes.
 * Uses credentials: "include" so httpOnly cookies are sent/received.
 * Does NOT go through apiClient to avoid token-refresh interceptors
 * triggering recursively during auth flows.
 */
async function authFetch(path, body, method = "POST") {
    const options = {
        method,
        credentials: "include",
        headers: {"Content-Type": "application/json"},
    };

    if (body !== undefined) {
        options.body = JSON.stringify(body);
    }

    const res = await fetch(path, options);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        const err = new Error(
            data.error || data.detail || "Request failed."
        );
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

export function useLogin() {
    const setAuth = useAuthStore((s) => s.setAuth);

    return useMutation({
        mutationFn: ({email, password}) =>
            authFetch("/api/auth/login", {email, password}),

        onSuccess: ({access_token, expires_in, user}) => {
            setAuth({access_token, expire_in: expires_in, user});
        },
    });
}

// ─── Register ────────────────────────────────────────────────────────────────

export function useRegister() {
    const setAuth = useAuthStore((s) => s.setAuth);

    return useMutation({
        mutationFn: (formData) =>
            authFetch("/api/auth/register", formData),

        onSuccess: ({access_token, expires_in, user}) => {
            if (access_token) {
                setAuth({access_token, expire_in: expires_in, user});
            }
        },
    });
}


export function useLogout() {
    const clearAuth = useAuthStore((s) => s.clearAuth);

    return useMutation({
        mutationFn: () =>
            authFetch("/api/auth/logout", undefined, "GET"),

        onSuccess: () => {
            clearAuth();
        },

        onError: () => {
            clearAuth();
        },
    });
}

// ─── Password Reset ───────────────────────────────────────────────────────────

export function useRequestPasswordReset() {
    return useMutation({
        mutationFn: ({email}) =>
            authFetch("/api/auth/password-reset", {email}),
    });
}

export function useConfirmPasswordReset() {
    return useMutation({
        mutationFn: ({uid, token, new_password1, new_password2}) =>
            authFetch("/api/auth/password-reset-confirm", {
                uid,
                token,
                new_password1,
                new_password2,
            }),
    });
}

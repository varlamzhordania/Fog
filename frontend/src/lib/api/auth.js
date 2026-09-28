import {API_ENDPOINTS} from "@/lib/config";
import apiClient from "@/lib/api/client";
import {serverFetch} from "@/lib/api/server";

/**
 * Get the currently authenticated user.
 *
 * Server-side only because the access token is passed directly
 * and this function is intended for server authentication flows.
 */
export async function retrieveSelf(token) {
    const res = await serverFetch(API_ENDPOINTS.account.me, {
        token,
        parseJson: false,
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));

        const error = new Error(
            data.error ||
            data.detail ||
            "Something went wrong, please refresh the page."
        );

        error.status = res.status;

        throw error;
    }

    return res.json();
}


/**
 * Login with username/password.
 *
 * Client ID and secret should normally be supplied by the
 * server-side login route rather than the browser.
 */
export async function loginWithPassword({
    username,
    password,
    client_id,
    client_secret,
}) {
    const data = {
        username,
        password,
        grant_type: "password",
        client_id,
        client_secret,
    };

    const res = await apiClient.post(
        API_ENDPOINTS.auth.token,
        data,
        {headers:{'Content-Type':'application/json','Accept':'application/json'}}
    );

    return res.data;
}


/**
 * Refresh an access token.
 */
export async function refreshToken({
    refresh_token,
    client_id,
    client_secret,
}) {
    const data = {
        refresh_token,
        grant_type: "refresh_token",
        client_id,
        client_secret,
    };

    const res = await apiClient.post(
        API_ENDPOINTS.auth.token,
        data
    );

    return res.data;
}


/**
 * Revoke an OAuth token.
 */
export async function revokeToken({
    token,
    client_id,
    client_secret,
}) {
    const data = {
        token,
        client_id,
        client_secret,
    };

    try {
        await apiClient.post(
            API_ENDPOINTS.auth.revokeToken,
            data,
            {
                headers: {
                    Accept: "application/json",
                },
            }
        );

        return true;
    } catch (error) {
        const response = error.response;
        const responseData = response?.data;

        const err = new Error(
            responseData?.error ||
            responseData?.detail ||
            "Failed to revoke token"
        );

        err.status = response?.status;

        throw err;
    }
}


/**
 * Fetch the current user using an access token.
 *
 * Client-side function.
 */
export async function fetchCurrentUser(access_token) {
    try {
        const res = await apiClient.get(
            API_ENDPOINTS.auth.me,
            {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }
        );

        return res.data;
    } catch (error) {
        const response = error.response;
        const responseData = response?.data;

        const err = new Error(
            responseData?.detail ||
            responseData?.error ||
            "Failed to fetch user"
        );

        err.status = response?.status;

        throw err;
    }
}


/**
 * Convert a social-provider token into your OAuth token.
 */
export async function convertSocialToken({
    backend,
    token,
    client_id,
    client_secret,
}) {
    const params = new URLSearchParams({
        grant_type: "convert_token",
        client_id,
        client_secret,
        backend,
        token,
    });

    try {
        const res = await apiClient.post(
            API_ENDPOINTS.auth.convertToken,
            params,
            {
                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded",
                    Accept: "application/json",
                },
            }
        );

        return res.data;
    } catch (error) {
        const response = error.response;
        const responseData = response?.data;

        const err = new Error(
            responseData?.error_description ||
            responseData?.error ||
            responseData?.detail ||
            "Social login failed"
        );

        err.status = response?.status;

        throw err;
    }
}
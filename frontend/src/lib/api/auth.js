import {API_ENDPOINTS} from "@/lib/config";
import apiClient from "@/lib/api/client";
import {serverFetch} from "@/lib/api/server";


export async function retrieveSelf(token) {
    return await serverFetch(API_ENDPOINTS.account.me, {token});
}

export async function authorize() {
    const res = await apiClient.get(API_ENDPOINTS.auth.authorize);

    return await res.data;
}


export async function loginWithPassword({
                                            username, password, client_id, client_secret,
                                        }) {
    const data = {
        username, password, grant_type: "password", client_id, client_secret,
    };

    const res = await apiClient.post(API_ENDPOINTS.auth.token, data, {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    });

    return res.data;
}


export async function refreshToken({
                                       refresh_token, client_id, client_secret,
                                   }) {
    const data = {
        refresh_token, grant_type: "refresh_token", client_id, client_secret,
    };

    const res = await apiClient.post(API_ENDPOINTS.auth.token, data);

    return res.data;
}


export async function revokeToken({
                                      token, client_id, client_secret,
                                  }) {
    const data = {
        token, client_id, client_secret,
    };

    try {
        await apiClient.post(API_ENDPOINTS.auth.revokeToken, data, {
            headers: {
                Accept: "application/json",
            },
        });

        return true;
    } catch (error) {
        const response = error.response;
        const responseData = response?.data;

        const err = new Error(responseData?.error || responseData?.detail || "Failed to revoke token");

        err.status = response?.status;

        throw err;
    }
}


export async function fetchCurrentUser(access_token) {
    try {
        const res = await apiClient.get(API_ENDPOINTS.auth.me, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });

        return res.data;
    } catch (error) {
        const response = error.response;
        const responseData = response?.data;

        const err = new Error(responseData?.detail || responseData?.error || "Failed to fetch user");

        err.status = response?.status;

        throw err;
    }
}


export async function convertSocialToken({
                                             backend, token, client_id, client_secret,
                                         }) {
    const params = new URLSearchParams({
        grant_type: "convert_token", client_id, client_secret, backend, token,
    });

    try {
        const res = await apiClient.post(API_ENDPOINTS.auth.convertToken, params, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json",
            },
        });

        return res.data;
    } catch (error) {
        const response = error.response;
        const responseData = response?.data;

        const err = new Error(responseData?.error_description || responseData?.error || responseData?.detail || "Social login failed");

        err.status = response?.status;

        throw err;
    }
}
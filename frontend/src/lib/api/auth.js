import {API_ENDPOINTS} from "@/lib/config";
import apiClient from "@/lib/api/client";
import {serverFetch} from "@/lib/api/server";
import axios from "axios";

export async function retrieveSelf(token) {
    return await serverFetch(API_ENDPOINTS.account.me, {token});
}

export async function authorize() {
    const res = await apiClient.get(API_ENDPOINTS.auth.authorize);

    return await res.data;
}

async function tokenRequest(url, data, config = {}) {
    try {
        const res = await axios.post(url, data, {
            headers: {"Content-Type": "application/json", Accept: "application/json"},
            timeout: 10000,
            ...config,
        });
        return res.data;
    } catch (e) {
        throw {
            status: e.response?.status ?? 502,
            data: e.response?.data ?? {error_description: "Authentication service is unreachable."},
        };
    }
}

export const loginWithPassword = ({username, password, client_id, client_secret}) =>
    tokenRequest(API_ENDPOINTS.auth.token,
        {username, password, grant_type: "password", client_id, client_secret});

export const refreshToken = ({refresh_token, client_id, client_secret}) =>
    tokenRequest(API_ENDPOINTS.auth.token,
        {refresh_token, grant_type: "refresh_token", client_id, client_secret});

export const revokeToken = ({token, client_id, client_secret}) =>
    tokenRequest(API_ENDPOINTS.auth.revokeToken, {token, client_id, client_secret});
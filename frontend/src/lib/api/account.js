import apiClient from "@/lib/api/client";
import {API_ENDPOINTS} from "@/lib/config";

// ─── Addresses ───────────────────────────────────────────────────────────────

export async function fetchAddresses({params}) {
    const response = await apiClient.get(API_ENDPOINTS.account.address,{
        params:params
    });
    return response.data;
}

export async function fetchAddress(id) {
    const response = await apiClient.get(
        API_ENDPOINTS.account.addressDetail(id)
    );
    return response.data;
}

export async function createAddress(data) {
    const response = await apiClient.post(
        API_ENDPOINTS.account.address,
        data
    );
    return response.data;
}

export async function updateAddress(id, data) {
    const response = await apiClient.put(
        API_ENDPOINTS.account.addressDetail(id),
        data
    );
    return response.data;
}

export async function patchAddress(id, data) {
    const response = await apiClient.patch(
        API_ENDPOINTS.account.addressDetail(id),
        data
    );
    return response.data;
}

export async function deleteAddress(id) {
    const response = await apiClient.delete(
        API_ENDPOINTS.account.addressDetail(id)
    );
    return response.data;
}

// ─── Account ─────────────────────────────────────────────────────────────────

export async function fetchAccount() {
    const response = await apiClient.get(API_ENDPOINTS.account.me);
    return response.data;
}

export async function updateAccount(data) {
    const response = await apiClient.patch(
        API_ENDPOINTS.account.me,
        data
    );
    return response.data;
}

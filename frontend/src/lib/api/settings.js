import apiClient from "@/lib/api/client";
import {API_ENDPOINTS} from "@/lib/config";

export async function createContact(data) {
    const response = await apiClient.post(
        API_ENDPOINTS.website.contact,
        data,
    );

    return response.data;
}
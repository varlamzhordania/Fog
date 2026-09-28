import {API_ENDPOINTS} from "@/lib/config";
import apiClient from "@/lib/api/client";

export async function fetchCategories({
                                          page = 1,
                                          page_size = 25,
                                          pagination = true,
                                          search,
                                          is_featured,
                                      } = {}) {
    const response = await apiClient.get(
        API_ENDPOINTS.inventory.categories,
        {
            params: {
                page,
                page_size,
                pagination,
                search,
                is_featured,
            },
        }
    );

    return response.data;
}
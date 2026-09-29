import {API_ENDPOINTS} from "@/lib/config";
import apiClient from "@/lib/api/client";

export async function fetchCategories({
                                          page = 1,
                                          page_size = 25,
                                          pagination = true,
                                          depth,
                                          search,
                                          is_featured,
                                          is_filterable,
                                      } = {}) {
    const response = await apiClient.get(
        API_ENDPOINTS.inventory.categories,
        {
            params: {
                page,
                page_size,
                pagination,
                depth,
                search,
                is_featured,
                is_filterable,
            },
        }
    );

    return response.data;
}
export async function fetchTags({
                                          page = 1,
                                          page_size = 25,
                                          pagination = true,
                                          search,
                                          is_filterable,
                                      } = {}) {
    const response = await apiClient.get(
        API_ENDPOINTS.inventory.tags,
        {
            params: {
                page,
                page_size,
                pagination,
                search,
                is_filterable,
            },
        }
    );

    return response.data;
}
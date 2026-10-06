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


export async function fetchProducts({
                                        page = 1,
                                        page_size = 25,
                                        pagination = true,
                                        search,
                                        category,
                                        tags,
                                        min_price,
                                        max_price,
                                        stock,
                                        product_type,
                                        is_featured,
                                        discounted,
                                        min_discount,
                                        max_discount,
                                        ids,
                                        ordering,
                                    } = {}) {
    const params = {
        page,
        page_size,
        pagination,
        search,
        category,
        tags,
        min_price,
        max_price,
        stock,
        product_type,
        is_featured,
        discounted,
        min_discount,
        max_discount,
        ids,
        ordering,
    };

    // Multi value filters (category, tags) are sent comma separated: ?tags=a,b
    ["category", "tags"].forEach((key) => {
        if (Array.isArray(params[key])) {
            params[key] = params[key].join(",");
        }
    });

    Object.keys(params).forEach((key) => {
        if (
            params[key] === undefined ||
            params[key] === null ||
            params[key] === ""
        ) {
            delete params[key];
        }
    });

    const response = await apiClient.get(
        API_ENDPOINTS.inventory.products,
        {params}
    );

    return response.data;
}


export async function fetchPriceRange() {
    const response = await apiClient.get(
        API_ENDPOINTS.inventory.priceRange
    );

    return response.data;
}


export async function fetchProductBySlug(slug) {
    if (!slug) {
        throw new Error("Product slug is required");
    }

    const response = await apiClient.get(
        API_ENDPOINTS.inventory.productDetail(slug)
    );

    return response.data;
}
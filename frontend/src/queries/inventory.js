import {keepPreviousData, useQuery} from "@tanstack/react-query";
import {
    fetchCategories,
    fetchTags,
    fetchProducts,
    fetchProductBySlug,
    fetchPriceRange,
} from "@/lib/api/inventory";
import apiClient from "@/lib/api/client";
import {API_ENDPOINTS} from "@/lib/config";

export function useHome() {
    return useQuery({
        queryKey: ["inventory", "home"],
        queryFn: async () => (await apiClient().get(API_ENDPOINTS.inventory.home)).data,
        staleTime: 2 * 60 * 1000,
    });
}

export function useCategories({
                                  page = 1,
                                  page_size = 25,
                                  pagination = true,
                                  depth,
                                  search,
                                  is_featured,
                                  is_filterable,
                              } = {}) {
    return useQuery({
        queryKey: [
            "inventory", "categories",
            {
                page,
                page_size,
                pagination,
                depth,
                search,
                is_featured,
                is_filterable,
            },
        ],
        queryFn: () =>
            fetchCategories({
                page,
                page_size,
                pagination,
                depth,
                search,
                is_featured,
                is_filterable,
            }),
    });
}


export function useTags({
                            page = 1,
                            page_size = 25,
                            pagination = true,
                            search,
                            is_filterable,
                        } = {}) {
    return useQuery({
        queryKey: [
            "inventory", "tags",
            {
                page,
                page_size,
                pagination,
                search,
                is_filterable,
            },
        ],
        queryFn: () =>
            fetchTags({
                page,
                page_size,
                pagination,
                search,
                is_filterable,
            }),
    });
}


export function useProducts({
    page = 1,
    page_size = 25,
    pagination = true,
    search,
    category,
    tags,
    min_price,
    max_price,
    stock,
    is_featured,
    product_type,
    ordering,
} = {}) {
    return useQuery({
        placeholderData: keepPreviousData,
        queryKey: [
            "inventory",
            "products",
            {
                page,
                page_size,
                pagination,
                search,
                category,
                tags,
                min_price,
                max_price,
                stock,
                is_featured,
                product_type,
                ordering,
            },
        ],

        queryFn: () =>
            fetchProducts({
                page,
                page_size,
                pagination,
                search,
                category,
                tags,
                min_price,
                max_price,
                stock,
                is_featured,
                product_type,
                ordering,
            }),
    });
}



export function usePriceRange() {
    return useQuery({
        queryKey: ["inventory", "price-range"],
        queryFn: fetchPriceRange,
    });
}


export function useProductBySlug(slug, options = {}) {
    return useQuery({
        queryKey: [
            "inventory",
            "product",
            slug,
        ],

        queryFn: () => fetchProductBySlug(slug),

        enabled: Boolean(slug),

        ...options,
    });
}
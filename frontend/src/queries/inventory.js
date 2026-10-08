import {keepPreviousData, useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {
    fetchCategories,
    fetchTags,
    fetchProducts,
    fetchProductBySlug,
    fetchPriceRange,
    createReview,
    deleteReview,
    fetchMyReview,
    fetchReviews,
    updateReview,
} from "@/lib/api/inventory";
import apiClient from "@/lib/api/client";
import {API_ENDPOINTS} from "@/lib/config";


export function useHome() {
    return useQuery({
        queryKey: ["inventory", "home"],
        queryFn: async () => (await apiClient.get(API_ENDPOINTS.inventory.home)).data,
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
        queryKey: ["inventory", "categories", {
            page, page_size, pagination, depth, search, is_featured, is_filterable,
        },], queryFn: () => fetchCategories({
            page, page_size, pagination, depth, search, is_featured, is_filterable,
        }),
    });
}


export function useTags({
                            page = 1, page_size = 25, pagination = true, search, is_filterable,
                        } = {}) {
    return useQuery({
        queryKey: ["inventory", "tags", {
            page, page_size, pagination, search, is_filterable,
        },], queryFn: () => fetchTags({
            page, page_size, pagination, search, is_filterable,
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
                                product_type,
                                is_featured,
                                discounted,
                                min_discount,
                                max_discount,
                                ids,
                                ordering,
                            } = {}) {
    return useQuery({
        placeholderData: keepPreviousData, queryKey: ["inventory", "products", {
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
        },], queryFn: () => fetchProducts({
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
        }),
    });
}

export function usePriceRange() {
    return useQuery({
        queryKey: ["inventory", "price-range"], queryFn: fetchPriceRange,
    });
}


export function useProductBySlug(slug, options = {}) {
    return useQuery({
        queryKey: ["inventory", "product", slug,],

        queryFn: () => fetchProductBySlug(slug),

        enabled: Boolean(slug),

        ...options,
    });
}


export function useReviews(slug, page = 1) {
    return useQuery({
        queryKey: ["reviews", slug, "list", page],
        queryFn: () => fetchReviews(slug, page),
        placeholderData: keepPreviousData,
        enabled: Boolean(slug),
    });
}

export function useMyReview(slug, enabled) {
    return useQuery({
        queryKey: ["reviews", slug, "mine"],
        queryFn: () => fetchMyReview(slug),
        enabled: Boolean(slug) && enabled,
        retry: false,
    });
}

export function useSaveReview(slug) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
                         exists, data
                     }) => (exists ? updateReview(slug, data) : createReview(slug, data)),
        onSuccess: () => qc.invalidateQueries({queryKey: ["reviews", slug]}),
    });
}

export function useDeleteReview(slug) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => deleteReview(slug),
        onSuccess: () => qc.invalidateQueries({queryKey: ["reviews", slug]}),
    });
}
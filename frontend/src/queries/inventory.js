import {useQuery} from "@tanstack/react-query";
import {fetchCategories, fetchTags} from "@/lib/api/inventory";

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
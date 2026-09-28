import {useQuery} from "@tanstack/react-query";
import {fetchCategories} from "@/lib/api/inventory";

export function useCategories({
                                  page = 1,
                                  page_size = 25,
                                  pagination = true,
                                  search,
                                  is_featured,
                              } = {}) {
    return useQuery({
        queryKey: [
            "inventory", "categories",
            {
                page,
                page_size,
                pagination,
                search,
                is_featured,
            },
        ],
        queryFn: () =>
            fetchCategories({
                page,
                page_size,
                pagination,
                search,
                is_featured,
            }),
    });
}
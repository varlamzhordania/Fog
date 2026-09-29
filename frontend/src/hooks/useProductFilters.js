"use client"

import {useCallback, useMemo} from "react"
import {usePathname, useRouter, useSearchParams} from "next/navigation"
import {
    ORDERING_OPTIONS,
    PRODUCT_TYPE_OPTIONS,
    STOCK_OPTIONS,
} from "@/data/productFilters"

const FILTER_KEYS = [
    "search",
    "category",
    "tags",
    "min_price",
    "max_price",
    "stock",
    "product_type",
    "is_featured",
]

const parseText = (value) => {
    const text = value?.trim()
    return text ? text : undefined
}

const parseList = (value) => {
    const items = [...new Set((value ?? "").split(",").map((item) => item.trim()).filter(Boolean))]
    return items.length ? items : undefined
}

const parseNumber = (value) => {
    if (value === null || value === undefined || value === "") return undefined

    const number = Number(value)
    return Number.isFinite(number) && number >= 0 ? number : undefined
}

const parseChoice = (value, options) => {
    return options.some((option) => option.value === value) ? value : undefined
}

const isEmpty = (value) => {
    return (
        value === undefined ||
        value === null ||
        value === "" ||
        value === false ||
        (Array.isArray(value) && value.length === 0)
    )
}

/**
 * useProductFilters — the URL is the single source of truth for the products page.
 *
 * Every filter (search, category, tags, price, stock, type, featured, ordering, page)
 * is read from and written to the query string, always merged with the params that are
 * already there, so filters can be combined freely and survive refresh / sharing.
 *
 * Usage:
 *   const {filters, setFilters, resetFilters, activeCount} = useProductFilters()
 *   setFilters({category: ["spores", "kits"]}) // keeps every other filter, resets page
 *   setFilters({page: 3}, {resetPage: false}) // only changes the page
 *   <ProductList {...filters} />              // keys match the `useProducts` hook
 */
export const useProductFilters = () => {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const query = searchParams.toString()

    const filters = useMemo(() => {
        const params = new URLSearchParams(query)
        const page = parseNumber(params.get("page"))

        return {
            search: parseText(params.get("search")),
            category: parseList(params.get("category")),
            tags: parseList(params.get("tags")),
            min_price: parseNumber(params.get("min_price")),
            max_price: parseNumber(params.get("max_price")),
            stock: parseChoice(params.get("stock"), STOCK_OPTIONS),
            product_type: parseChoice(params.get("product_type"), PRODUCT_TYPE_OPTIONS),
            is_featured: params.get("is_featured") === "true" ? true : undefined,
            ordering: parseChoice(params.get("ordering"), ORDERING_OPTIONS),
            page: page && page >= 1 ? Math.floor(page) : 1,
        }
    }, [query])

    const activeCount = useMemo(() => {
        return FILTER_KEYS.filter((key) => !isEmpty(filters[key])).length
    }, [filters])

    const setFilters = useCallback((updates = {}, {resetPage = true} = {}) => {
        const params = new URLSearchParams(query)

        Object.entries(updates).forEach(([key, value]) => {
            if (isEmpty(value)) {
                params.delete(key)
                return
            }

            params.set(key, Array.isArray(value) ? value.join(",") : String(value))
        })

        if (resetPage && !("page" in updates)) {
            params.delete("page")
        }

        if (params.get("page") === "1") {
            params.delete("page")
        }

        const nextQuery = params.toString()

        router.push(nextQuery ? `${pathname}?${nextQuery}` : pathname, {scroll: false})
    }, [query, pathname, router])

    const resetFilters = useCallback(() => {
        const params = new URLSearchParams(query)

        FILTER_KEYS.forEach((key) => params.delete(key))
        params.delete("page")

        const nextQuery = params.toString()

        router.push(nextQuery ? `${pathname}?${nextQuery}` : pathname, {scroll: false})
    }, [query, pathname, router])

    return {filters, setFilters, resetFilters, activeCount}
}

export default useProductFilters

"use client"

import {useRef} from "react";
import {Button, Card, Label, ListBox, Pagination, Select, Skeleton, Typography} from "@heroui/react";
import {PackageSearch, RotateCcw} from "lucide-react";
import Icon from "@/components/Icon/Icon";
import ProductCard from "@/components/inventory/ProductCard";
import {useProducts} from "@/queries/inventory";
import {useProductFilters} from "@/hooks/useProductFilters";
import {DEFAULT_ORDERING, ORDERING_OPTIONS, PRODUCTS_PAGE_SIZE} from "@/data/productFilters";

const getPageNumbers = (current, total) => {
    const pages = new Set([1, total, current - 1, current, current + 1]);
    const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);

    return sorted.reduce((result, page, index) => {
        if (index > 0 && page - sorted[index - 1] > 1) {
            result.push(`ellipsis-${page}`);
        }

        result.push(page);
        return result;
    }, []);
};

const ProductList = () => {
    const listRef = useRef(null);
    const {filters, setFilters, resetFilters, activeCount} = useProductFilters();

    const {data, isLoading, isError, isFetching} = useProducts({
        ...filters,
        page_size: PRODUCTS_PAGE_SIZE,
    });

    const products = data?.results ?? data ?? [];
    const count = data?.count ?? products.length;
    const totalPages = Math.max(1, Math.ceil(count / PRODUCTS_PAGE_SIZE));
    const firstItem = (filters.page - 1) * PRODUCTS_PAGE_SIZE + 1;
    const lastItem = Math.min(filters.page * PRODUCTS_PAGE_SIZE, count);

    const handlePageChange = (page) => {
        setFilters({page}, {resetPage: false});
        listRef.current?.scrollIntoView({behavior: "smooth", block: "start"});
    };

    return (
        <div ref={listRef} className="w-full scroll-mt-28 space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <Typography type="body-sm" color="muted">
                    {isLoading
                        ? "Loading products..."
                        : `${count} ${count === 1 ? "product" : "products"} found`}
                </Typography>

                <SortSelect
                    value={filters.ordering}
                    onChange={(ordering) => setFilters({ordering})}
                />
            </div>

            {isLoading && <ProductGridSkeleton/>}

            {isError && (
                <ListMessage
                    title="Something went wrong"
                    description="We could not load the products. Please try again."
                    actionLabel="Back to first page"
                    onAction={() => setFilters({page: null})}
                />
            )}

            {!isLoading && !isError && products.length === 0 && (
                <ListMessage
                    title="No products found"
                    description="Try changing or clearing some filters to see more results."
                    actionLabel={activeCount > 0 ? "Reset filters" : null}
                    onAction={resetFilters}
                />
            )}

            {!isLoading && !isError && products.length > 0 && (
                <>
                    <div
                        className={`grid grid-cols-1 gap-4 transition-opacity sm:grid-cols-2 xl:grid-cols-3 ${isFetching ? "opacity-60" : ""}`}>
                        {products.map((product) => (
                            <ProductCard key={product.id} data={product}/>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <Pagination className="justify-between">
                            <Pagination.Summary>
                                {firstItem} to {lastItem} of {count} results
                            </Pagination.Summary>
                            <Pagination.Content>
                                <Pagination.Item>
                                    <Pagination.Previous
                                        isDisabled={filters.page === 1}
                                        onPress={() => handlePageChange(filters.page - 1)}
                                    >
                                        <Pagination.PreviousIcon/>
                                        Previous
                                    </Pagination.Previous>
                                </Pagination.Item>

                                {getPageNumbers(filters.page, totalPages).map((page) => (
                                    <Pagination.Item key={page}>
                                        {typeof page === "string" ? (
                                            <Pagination.Ellipsis/>
                                        ) : (
                                            <Pagination.Link
                                                isActive={page === filters.page}
                                                onPress={() => handlePageChange(page)}
                                            >
                                                {page}
                                            </Pagination.Link>
                                        )}
                                    </Pagination.Item>
                                ))}

                                <Pagination.Item>
                                    <Pagination.Next
                                        isDisabled={filters.page === totalPages}
                                        onPress={() => handlePageChange(filters.page + 1)}
                                    >
                                        Next
                                        <Pagination.NextIcon/>
                                    </Pagination.Next>
                                </Pagination.Item>
                            </Pagination.Content>
                        </Pagination>
                    )}
                </>
            )}
        </div>
    );
};

const SortSelect = ({value, onChange}) => {
    return (
        <Select
            name="ordering"
            variant="secondary"
            className="w-full sm:w-56"
            value={value || DEFAULT_ORDERING}
            onChange={(ordering) => onChange(ordering === DEFAULT_ORDERING ? null : ordering)}
        >
            <Label>Sort by</Label>
            <Select.Trigger>
                <Select.Value/>
                <Select.Indicator/>
            </Select.Trigger>
            <Select.Popover>
                <ListBox>
                    {ORDERING_OPTIONS.map((option) => (
                        <ListBox.Item key={option.value} id={option.value} textValue={option.label}>
                            {option.label}
                            <ListBox.ItemIndicator/>
                        </ListBox.Item>
                    ))}
                </ListBox>
            </Select.Popover>
        </Select>
    );
};

const ProductGridSkeleton = () => {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({length: 6}).map((_, index) => (
                <Card key={index} className="h-full w-full">
                    <Skeleton className="aspect-square w-full rounded-xl"/>
                    <Card.Content className="space-y-2">
                        <Skeleton className="h-5 w-3/4 rounded-md"/>
                        <Skeleton className="h-4 w-full rounded-md"/>
                        <Skeleton className="h-5 w-1/4 rounded-md"/>
                    </Card.Content>
                    <Card.Footer>
                        <Skeleton className="h-10 w-full rounded-lg"/>
                    </Card.Footer>
                </Card>
            ))}
        </div>
    );
};

const ListMessage = ({title, description, actionLabel, onAction}) => {
    return (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border py-16 text-center">
            <Icon icon={PackageSearch} className="size-10 text-muted"/>
            <Typography type="h4">{title}</Typography>
            <Typography type="body-sm" color="muted" className="max-w-sm">
                {description}
            </Typography>
            {actionLabel && (
                <Button variant="secondary" className="mt-2 gap-2" onPress={onAction}>
                    <Icon icon={RotateCcw} className="size-4"/>
                    {actionLabel}
                </Button>
            )}
        </div>
    );
};

export default ProductList;

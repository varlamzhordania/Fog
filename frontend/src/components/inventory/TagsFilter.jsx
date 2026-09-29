"use client"

import {Skeleton, Tag, TagGroup} from "@heroui/react";
import {useTags} from "@/queries/inventory";
import {useProductFilters} from "@/hooks/useProductFilters";

const ALL_PRODUCTS = "all-products";

const TagsFilter = () => {
    const {filters, setFilters} = useProductFilters();

    const {data, isLoading} = useTags({
        pagination: false, is_filterable: true
    });

    const tags = data?.results || data || [];
    const selected = new Set(filters.tags?.length ? filters.tags : [ALL_PRODUCTS]);

    const handleSelectionChange = (keys) => {
        const selectedKeys = keys === "all" ? [] : [...keys];

        // "All Products" was just picked, or everything was deselected: clear the tags.
        if (selectedKeys.length === 0 || (!selected.has(ALL_PRODUCTS) && selectedKeys.includes(ALL_PRODUCTS))) {
            setFilters({tags: null});
            return;
        }

        setFilters({tags: selectedKeys.filter((key) => key !== ALL_PRODUCTS)});
    };

    return (
        <TagGroup
            aria-label="Tags Filter"
            selectionMode="multiple"
            selectedKeys={selected}
            onSelectionChange={handleSelectionChange}
            size={"lg"}
        >
            <TagGroup.List>
                {!isLoading && (
                    <Tag id={ALL_PRODUCTS} textValue={"All Products"}>
                        All Products
                    </Tag>
                )}

                {isLoading &&
                    [12, 16, 20, 14, 24, 18].map((_, index) => (
                        <Tag key={index} id={`skeleton-tag-${index}`}
                             textValue={`skeleton-tag-${index}`}>
                            <Skeleton className="h-4 w-12" aria-label={`skeleton-tag-${index}`}/>
                        </Tag>
                    ))
                }

                {!isLoading &&
                    tags.map((item) => (
                        <Tag
                            key={item.slug}
                            id={item.slug}
                            textValue={item.name}
                        >
                            {item.name}
                        </Tag>
                    ))
                }
            </TagGroup.List>
        </TagGroup>
    );
};

export default TagsFilter;

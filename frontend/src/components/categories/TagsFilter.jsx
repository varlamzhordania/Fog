"use client"

import {Skeleton, Tag, TagGroup} from "@heroui/react";
import {useRouter} from "next/navigation";
import {useTags} from "@/queries/inventory";

const TagsFilter = ({
                        selected,
                        setSelected,
                        selectionMode = "single",
                    }) => {
    const router = useRouter();

    const {data, isLoading} = useTags({
        pagination: false, is_filterable: true
    });

    const tags = data?.results || data || [];

    const handleSelectionChange = (keys) => {
        setSelected(keys);

        const selectedKey = [...keys][0];

        // All Products
        if (!selectedKey || selectedKey === "all-products") {
            router.push("/products");
            return;
        }

        router.push(
            `/products?tag=${encodeURIComponent(selectedKey)}`
        );
    };

    return (
        <TagGroup
            aria-label="Tags Filter"
            selectionMode={selectionMode}
            selectedKeys={selected}
            onSelectionChange={handleSelectionChange}
            size={"lg"}
        >
            <TagGroup.List>
                {!isLoading && (
                    <Tag id="all-products" textValue={"all-products"}>
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
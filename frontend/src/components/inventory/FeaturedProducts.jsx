"use client";

import ProductSlider from "@/components/Sliders/ProductSlider";
import {useProducts} from "@/queries/inventory";

export default function FeaturedProducts({title, featured = false, page_size = 12}) {
    const {data, isLoading} = useProducts({
        is_featured: featured ? true : undefined,
        page_size,
    });

    return (
        <ProductSlider
            title={title}
            productData={data?.results ?? []}
            isLoading={isLoading}
            featured={featured}
            cardDepth={featured}
        />
    );
}

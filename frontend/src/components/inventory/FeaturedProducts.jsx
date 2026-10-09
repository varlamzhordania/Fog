"use client";

import ProductSlider from "@/components/Sliders/ProductSlider";
import {useProducts} from "@/queries/inventory";

export default function FeaturedProducts({
    title = "Featured Products",
    featured = false,
    page_size = 12,

    // Card appearance
    cardVariant = "product",
    cardHeight = "min-h-85",
    imageFit = "cover",
    imageOverlay = "from-black/80 via-black/25 to-transparent",
    imagePosition = "center",
    showDescription = true,
    showAction = true,
    actionLabel = "Shop now",

    // Slider layout
    slidesPerView = 1.2,
    spaceBetween = 16,
    breakpoints,
    showNavigation = true,
    showTitle = true,
    titleClassName = "",
    cardClassName = "",

    // Empty state
    emptyMessage = "No products available to display.",

    // Data mapping
    getTitle,
    getDescription,
    getImage,
    getHref,
}) {
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

            cardVariant={cardVariant}
            cardHeight={cardHeight}
            imageFit={imageFit}
            imageOverlay={imageOverlay}
            imagePosition={imagePosition}
            showDescription={showDescription}
            showAction={showAction}
            actionLabel={actionLabel}

            slidesPerView={slidesPerView}
            spaceBetween={spaceBetween}
            breakpoints={breakpoints}
            showNavigation={showNavigation}
            showTitle={showTitle}
            titleClassName={titleClassName}
            cardClassName={cardClassName}

            emptyMessage={emptyMessage}

            {...(getTitle && {getTitle})}
            {...(getDescription && {getDescription})}
            {...(getImage && {getImage})}
            {...(getHref && {getHref})}
        />
    );
}

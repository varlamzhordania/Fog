"use client";

import {useEffect, useState} from "react";
import Image from "next/image";
import Link from "next/link";
import {A11y} from "swiper/modules";
import {Swiper, SwiperSlide} from "swiper/react";
import {Button, Skeleton, Typography} from "@heroui/react";
import {ArrowRight, ChevronLeft, ChevronRight} from "lucide-react";

import Icon from "@/components/icon/Icon";
import ProductCard from "@/components/inventory/ProductCard";

import "swiper/css";
import "swiper/css/scrollbar";

const DEFAULT_BREAKPOINTS = {
    640: {slidesPerView: 2, spaceBetween: 16},
    768: {slidesPerView: 3, spaceBetween: 20},
    1024: {slidesPerView: 4, spaceBetween: 20},
    1280: {slidesPerView: 5, spaceBetween: 24},
};

const IMAGE_BREAKPOINTS = {
    640: {slidesPerView: 1.5, spaceBetween: 16},
    768: {slidesPerView: 2, spaceBetween: 20},
    1024: {slidesPerView: 2.5, spaceBetween: 24},
    1280: {slidesPerView: 3, spaceBetween: 24},
};

const ProductSlider = ({
    productData = [],
    title = "Product Slider Title",
    cardDepth = false,
    featured = false,
    isLoading = false,

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
    emptyMessage = "No products available to display.",

    // Image card fields
    getTitle = (product) => product.name || product.title,
    getDescription = (product) =>
        product.short_description || product.description || "",
    getImage = (product) =>
        product.image_url ||
        product.image ||
        product.thumbnail ||
        product.cover_image,
    getHref = (product) =>
        product.href || `/products/${product.slug}`,
}) => {
    const [swiperInstance, setSwiperInstance] = useState(null);
    const [slideStatus, setSlideStatus] = useState({
        isBeginning: true,
        isEnd: true,
    });

    const isImageCard = cardVariant === "image";
    const responsiveBreakpoints =
        breakpoints ||
        (isImageCard ? IMAGE_BREAKPOINTS : DEFAULT_BREAKPOINTS);

    const updateSlideStatus = (swiper) => {
        setSlideStatus({
            isBeginning: swiper.isBeginning,
            isEnd: swiper.isEnd,
        });
    };

    useEffect(() => {
        if (!swiperInstance || swiperInstance.destroyed) return;

        swiperInstance.update();
        updateSlideStatus(swiperInstance);
    }, [productData, isLoading, swiperInstance]);

    return (
        <section className="relative">
            {/* Header */}
            {(showTitle || showNavigation) && (
                <div className="mb-6 flex flex-row items-center justify-between gap-4">
                    {showTitle ? (
                        isLoading ? (
                            <Skeleton className="h-9 w-48 rounded-lg lg:h-11 lg:w-64 2xl:h-14 2xl:w-80"/>
                        ) : (
                            <Typography
                                type="h3"
                                className={[
                                    "text-2xl font-bold uppercase tracking-tight",
                                    "text-accent/80 lg:text-4xl 2xl:text-5xl",
                                    titleClassName,
                                ].join(" ")}
                            >
                                {title}
                            </Typography>
                        )
                    ) : (
                        <div/>
                    )}

                    {showNavigation && !isLoading && (
                        <div className="flex shrink-0 items-center gap-2">
                            <Button
                                isIconOnly
                                variant="secondary"
                                aria-label="Previous slide"
                                isDisabled={slideStatus.isBeginning}
                                onPress={() => swiperInstance?.slidePrev()}
                            >
                                <Icon icon={ChevronLeft}/>
                            </Button>

                            <Button
                                isIconOnly
                                variant="secondary"
                                aria-label="Next slide"
                                isDisabled={slideStatus.isEnd}
                                onPress={() => swiperInstance?.slideNext()}
                            >
                                <Icon icon={ChevronRight}/>
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Loading */}
            {isLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {Array.from({
                        length: isImageCard ? 3 : featured ? 4 : 5,
                    }).map((_, index) => (
                        <ProductCardSkeleton
                            key={index}
                            featured={featured}
                            imageCard={isImageCard}
                            cardHeight={cardHeight}
                        />
                    ))}
                </div>
            ) : productData.length === 0 ? (
                <div className="py-12 text-center text-default-500">
                    {emptyMessage}
                </div>
            ) : (
                <Swiper
                    key={cardVariant}
                    modules={[A11y]}
                    slidesPerView={slidesPerView}
                    spaceBetween={spaceBetween}
                    breakpoints={responsiveBreakpoints}
                    watchOverflow
                    onSwiper={(swiper) => {
                        setSwiperInstance(swiper);
                        updateSlideStatus(swiper);
                    }}
                    onSlideChange={updateSlideStatus}
                    onResize={updateSlideStatus}
                    className="w-full !pb-8 [&_.swiper-wrapper]:items-stretch"
                >
                    {productData.map((product, index) => (
                        <SwiperSlide
                            key={product.id || product.slug || index}
                            className="!h-auto flex"
                        >
                            {isImageCard ? (
                                <ImageProductCard
                                    product={product}
                                    title={getTitle(product)}
                                    description={getDescription(product)}
                                    image={getImage(product)}
                                    href={getHref(product)}
                                    height={cardHeight}
                                    imageFit={imageFit}
                                    imageOverlay={imageOverlay}
                                    imagePosition={imagePosition}
                                    showDescription={showDescription}
                                    showAction={showAction}
                                    actionLabel={actionLabel}
                                    className={cardClassName}
                                />
                            ) : (
                                <ProductCard
                                    data={product}
                                    depth={cardDepth}
                                    featured={featured}
                                />
                            )}
                        </SwiperSlide>
                    ))}
                </Swiper>
            )}
        </section>
    );
};

function ImageProductCard({
    product,
    title,
    description,
    image,
    href,
    height,
    imageFit,
    imageOverlay,
    imagePosition,
    showDescription,
    showAction,
    actionLabel,
    className,
}) {
    return (
        <Link
            href={href || "/products"}
            className={[
                "group relative flex w-full flex-col justify-end",
                "overflow-hidden rounded-3xl bg-default no-underline",
                height,
                className,
            ].join(" ")}
        >
            {image && (
                <Image
                    src={image}
                    alt={title || ""}
                    fill
                    sizes="(max-width: 639px) 85vw, (max-width: 1023px) 50vw, 33vw"
                    className={[
                        "transition-transform duration-700 group-hover:scale-105",
                        imageFit === "contain" ? "object-contain" : "object-cover",
                        `object-${imagePosition}`,
                    ].join(" ")}
                />
            )}

            <div
                className={[
                    "absolute inset-0 bg-linear-to-t",
                    imageOverlay,
                ].join(" ")}
            />

            <div className="relative z-10 p-6 text-white">
                <p className="text-xl font-semibold">
                    {title}
                </p>

                {showDescription && description && (
                    <p className="mt-1 line-clamp-3 text-sm text-white/80">
                        {description}
                    </p>
                )}

                {showAction && (
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium">
                        {actionLabel}
                        <Icon
                            icon={ArrowRight}
                            className="size-4 transition-transform group-hover:translate-x-1"
                        />
                    </span>
                )}
            </div>
        </Link>
    );
}

function ProductCardSkeleton({
    featured = false,
    imageCard = false,
    cardHeight = "min-h-85",
}) {
    if (imageCard) {
        return (
            <Skeleton
                className={[
                    "w-full overflow-hidden rounded-3xl",
                    cardHeight,
                ].join(" ")}
            />
        );
    }

    return (
        <div className="w-full">
            <Skeleton
                className={[
                    "w-full overflow-hidden rounded-2xl",
                    featured ? "aspect-[4/5]" : "aspect-square",
                ].join(" ")}
            />

            <div className="mt-4 space-y-3">
                <Skeleton className="h-4 w-2/3 rounded-lg"/>
                <Skeleton className="h-5 w-full rounded-lg"/>
                <Skeleton className="h-4 w-1/2 rounded-lg"/>
            </div>
        </div>
    );
}

export default ProductSlider;


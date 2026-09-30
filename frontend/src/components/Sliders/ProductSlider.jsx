"use client";

import {useState} from "react";
import {A11y} from "swiper/modules";
import {Swiper, SwiperSlide} from "swiper/react";
import {Button, Skeleton, Typography} from "@heroui/react";
import {ChevronRight, ChevronLeft} from "lucide-react";

import Icon from "@/components/Icon/Icon";
import ProductCard from "@/components/inventory/ProductCard";

import "swiper/css";
import "swiper/css/scrollbar";

const ProductSlider = ({
    productData = [],
    title = "Product Slider Title",
    cardDepth = false,
    featured = false,
    isLoading = false,
}) => {
    const [swiperInstance, setSwiperInstance] = useState(null);
    const [slideStatus, setSlideStatus] = useState({
        isBeginning: true,
        isEnd: false,
    });

    const handleSlideChange = (swiper) => {
        setSlideStatus({
            isBeginning: swiper.isBeginning,
            isEnd: swiper.isEnd,
        });
    };

    return (
        <section className="relative container container-space">
            {/* Header */}
            <div className="mb-6 flex flex-row items-center justify-between gap-4">
                {isLoading ? (
                    <Skeleton className="h-9 w-48 rounded-lg lg:h-11 lg:w-64 2xl:h-14 2xl:w-80"/>
                ) : (
                    <Typography
                        type="h3"
                        className="text-2xl font-bold uppercase tracking-tight text-accent/80 lg:text-4xl 2xl:text-5xl"
                    >
                        {title}
                    </Typography>
                )}

                {!isLoading && (
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

            {/* Loading */}
            {isLoading ? (
                <div
                    className="
                        grid grid-cols-1 gap-4
                        sm:grid-cols-2
                        md:grid-cols-3
                        lg:grid-cols-4
                        xl:grid-cols-5
                    "
                >
                    {Array.from({length: featured ? 4 : 5}).map((_, index) => (
                        <ProductCardSkeleton
                            key={index}
                            featured={featured}
                        />
                    ))}
                </div>
            ) : productData.length === 0 ? (
                <div className="py-12 text-center text-default-500">
                    No products available to display.
                </div>
            ) : (
                <Swiper
                    modules={[A11y]}
                    spaceBetween={featured ? 24 : 16}
                    slidesPerView={1.2}
                    breakpoints={{
                        640: {
                            slidesPerView: featured ? 1.5 : 2.2,
                            spaceBetween: featured ? 20 : 16,
                        },
                        768: {
                            slidesPerView: featured ? 2 : 3,
                            spaceBetween: featured ? 24 : 20,
                        },
                        1024: {
                            slidesPerView: featured ? 3 : 4,
                            spaceBetween: featured ? 28 : 20,
                        },
                        1280: {
                            slidesPerView: featured ? 3 : 5,
                            spaceBetween: featured ? 32 : 24,
                        },
                    }}
                    onSwiper={(swiper) => {
                        setSwiperInstance(swiper);
                        setSlideStatus({
                            isBeginning: swiper.isBeginning,
                            isEnd: swiper.isEnd,
                        });
                    }}
                    onSlideChange={handleSlideChange}
                    className="w-full !pb-8 [&_.swiper-wrapper]:items-stretch"
                >
                    {productData.map((product, index) => (
                        <SwiperSlide
                            key={product.id || index}
                            className="!h-auto flex"
                        >
                            <ProductCard
                                data={product}
                                depth={cardDepth}
                                featured={featured}
                            />
                        </SwiperSlide>
                    ))}
                </Swiper>
            )}
        </section>
    );
};


function ProductCardSkeleton({featured = false}) {
    return (
        <div className="w-full">
            {/* Image */}
            <Skeleton
                className={[
                    "w-full overflow-hidden rounded-2xl",
                    featured
                        ? "aspect-[4/5]"
                        : "aspect-square",
                ].join(" ")}
            />

            {/* Content */}
            <div className="mt-4 space-y-3">
                <Skeleton className="h-4 w-2/3 rounded-lg"/>
                <Skeleton className="h-5 w-full rounded-lg"/>
                <Skeleton className="h-4 w-1/2 rounded-lg"/>
            </div>
        </div>
    );
}

export default ProductSlider;
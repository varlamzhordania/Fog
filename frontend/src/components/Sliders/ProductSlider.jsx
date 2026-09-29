"use client";

import {useState} from "react";
import {A11y} from "swiper/modules";
import {Swiper, SwiperSlide} from "swiper/react";

import "swiper/css";
import "swiper/css/scrollbar";

import { Button, Typography} from "@heroui/react";
import {ChevronRight, ChevronLeft} from "lucide-react";
import Icon from "@/components/Icon/Icon";
import ProductCard from "@/components/inventory/ProductCard";

const ProductSlider = ({
                           productData = [],
                           title = "Product Slider Title",
                           cardDepth = false,
                           featured = false
                       }) => {
    const [swiperInstance, setSwiperInstance] = useState(null);
    const [slideStatus, setSlideStatus] = useState({isBeginning: true, isEnd: false});

    const handleSlideChange = (swiper) => {
        setSlideStatus({
            isBeginning: swiper.isBeginning,
            isEnd: swiper.isEnd,
        });
    };

    return (
        <section className="relative container container-space">
            <div className="flex flex-row justify-between items-center mb-6 gap-4">
                <Typography type="h3"
                            className="text-2xl lg:text-4xl 2xl:text-5xl text-accent/80 uppercase font-bold tracking-tight">
                    {title}
                </Typography>

                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        isIconOnly
                        variant="secondary"
                        aria-label="Previous slide"
                        isDisabled={slideStatus.isBeginning}
                        onClick={() => swiperInstance?.slidePrev()}
                    >
                        <Icon icon={ChevronLeft}/>
                    </Button>
                    <Button
                        isIconOnly
                        variant="secondary"
                        aria-label="Next slide"
                        isDisabled={slideStatus.isEnd}
                        onClick={() => swiperInstance?.slideNext()}
                    >
                        <Icon icon={ChevronRight}/>
                    </Button>
                </div>
            </div>

            {productData.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
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
                        <SwiperSlide key={product.id || index} className="!h-auto flex">
                            <ProductCard data={product} depth={cardDepth} featured={featured}/>
                        </SwiperSlide>
                    ))}
                </Swiper>
            )}
        </section>
    );
};

export default ProductSlider;


"use client";

import {useRef, useState} from "react";
import {A11y, Navigation, Thumbs} from "swiper/modules";
import {Swiper, SwiperSlide} from "swiper/react";
import {Button} from "@heroui/react";
import {ChevronLeft, ChevronRight} from "lucide-react";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/thumbs";

import Image from "@/components/Image";

const ProductGallery = ({product}) => {
    const [thumbsSwiper, setThumbsSwiper] = useState(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const prevRef = useRef(null);
    const nextRef = useRef(null);

    const primaryImage = product.primary_image;
    const gallery = product.gallery || [];

    const images = [
        ...(primaryImage
            ? [
                {
                    id: primaryImage.id,
                    file: primaryImage.file,
                    alt_text: primaryImage.alt_text,
                    title: primaryImage.title,
                },
            ]
            : []),
        ...gallery.map((item) => item.media).filter((m) => m?.media_type === "IMAGE"),
    ].filter((image, index, array) =>
            array.findIndex((item) => item.id === image.id) === index
    );


    if (!images.length) {
        return (
            <div className="flex aspect-square w-full items-center justify-center rounded-2xl border border-default-200 bg-default-100">
                <div className="text-center">
                    <div className="text-sm uppercase tracking-[0.2em] text-default-400">
                        FOG
                    </div>

                    <div className="mt-2 text-sm text-default-500">
                        No product image
                    </div>
                </div>
            </div>
        );
    }

    if (images.length === 1) {
        const image = images[0];

        return (
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-default-200 bg-default-100">
                <Image
                    src={image.file}
                    alt={
                        image.alt_text ||
                        image.title ||
                        product.name
                    }
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 58vw"
                    className="object-cover"
                />
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Main gallery */}
            <div className="relative">
                <Swiper
                    modules={[A11y, Navigation, Thumbs]}
                    thumbs={{
                        swiper:
                            thumbsSwiper && !thumbsSwiper.destroyed
                                ? thumbsSwiper
                                : null,
                    }}
                    spaceBetween={16}
                    slidesPerView={1}
                    navigation={{
                        prevEl: prevRef.current,
                        nextEl: nextRef.current,
                    }}
                    onBeforeInit={(swiper) => {
                        swiper.params.navigation.prevEl =
                            prevRef.current;
                        swiper.params.navigation.nextEl =
                            nextRef.current;
                    }}
                    onSlideChange={(swiper) => {
                        setActiveIndex(swiper.activeIndex);
                    }}
                    className="aspect-square w-full overflow-hidden rounded-2xl"
                >
                    {images.map((image, index) => (
                        <SwiperSlide
                            key={image.id}
                            className="relative"
                        >
                            <Image
                                src={image.file}
                                alt={
                                    image.alt_text ||
                                    image.title ||
                                    `${product.name} image ${index + 1}`
                                }
                                fill
                                priority={index === 0}
                                sizes="(max-width: 1024px) 100vw, 58vw"
                                className="object-cover"
                            />
                        </SwiperSlide>
                    ))}
                </Swiper>

                {/* Previous */}
                <Button
                    ref={prevRef}
                    isIconOnly
                    size="sm"
                    variant="secondary"
                    aria-label="Previous image"
                    className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/80 shadow-md backdrop-blur-md"
                >
                    <ChevronLeft size={18} />
                </Button>

                {/* Next */}
                <Button
                    ref={nextRef}
                    isIconOnly
                    size="sm"
                    variant="secondary"
                    aria-label="Next image"
                    className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/80 shadow-md backdrop-blur-md"
                >
                    <ChevronRight size={18} />
                </Button>

                {/* Counter */}
                <div className="absolute bottom-4 right-4 z-10 rounded-full bg-background/80 px-3 py-1 text-xs font-medium backdrop-blur-md">
                    {activeIndex + 1} / {images.length}
                </div>
            </div>

            {/* Thumbnails */}
            <div className="mt-4">
                <Swiper
                    modules={[A11y, Thumbs]}
                    onSwiper={setThumbsSwiper}
                    spaceBetween={10}
                    slidesPerView={4}
                    watchSlidesProgress
                    breakpoints={{
                        480: {
                            slidesPerView: 5,
                        },
                        640: {
                            slidesPerView: 6,
                        },
                    }}
                    className="w-full"
                >
                    {images.map((image, index) => (
                        <SwiperSlide
                            key={image.id}
                            className="h-auto! cursor-pointer"
                        >
                            <div
                                className={[
                                    "relative aspect-square overflow-hidden rounded-xl border-2 bg-default-100 transition-all duration-200",
                                    activeIndex === index
                                        ? "border-primary"
                                        : "border-transparent opacity-60 hover:opacity-100",
                                ].join(" ")}
                            >
                                <Image
                                    src={image.file}
                                    alt={
                                        image.alt_text ||
                                        image.title ||
                                        `${product.name} thumbnail ${index + 1}`
                                    }
                                    fill
                                    sizes="(max-width: 480px) 25vw, 100px"
                                    className="object-cover"
                                />
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </div>
    );
};

export default ProductGallery;
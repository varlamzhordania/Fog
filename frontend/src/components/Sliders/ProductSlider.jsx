"use client";

import {useState} from "react";
import Image from "next/image";
import {A11y} from "swiper/modules";
import {Swiper, SwiperSlide} from "swiper/react";

import "swiper/css";
import "swiper/css/scrollbar";

import {Link, Button, Card, Typography} from "@heroui/react";
import {ChevronRight, ChevronLeft, ShoppingCart, MoveRight} from "lucide-react";
import Icon from "@/components/Icon/Icon";
import {notFoundImage} from "@/lib/config";

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

const ProductCard = ({
                         data = {
                             name: "Product Name",
                             slug: "/products/",
                             short_description: "Short description here",
                             img: notFoundImage,
                             price: 45.99,
                         },
                         depth = false,
                         featured = false,
                     }) => {
    const formattedPrice = typeof data.price === "number" ? data.price.toFixed(2) : data.price;

    return (
        <Card className={`h-full w-full ${depth && "bg-transparent shadow-none border-0"}`}>
            <Card.Header
                className={`p-0 overflow-hidden relative ${featured ? 'aspect-video' : 'aspect-square'}  w-full rounded-xl`}>
                <Image
                    src={data.img || notFoundImage}
                    alt={data.name || "Product image"}
                    fill
                    sizes="(max-width: 640px) 80vw, (max-width: 1024px) 33vw, 20vw"
                    className="object-cover rounded-xl transition-transform duration-300 hover:scale-105"
                />
                {
                    featured &&
                    <div className={"absolute left-4 bottom-4 z-20"}>
                        <Typography type="span" className="text-foreground text-lg font-bold ">
                            ${formattedPrice}
                        </Typography>
                    </div>
                }
                {
                    <div
                        className={"absolute inset-0 bg-gradient-to-t from-background/40 via-background/10 to-transparent z-10"}></div>
                }

            </Card.Header>

            <Card.Content>
                <Typography type={"h4"} title={data.name} className={"text-lg"}>
                    {data.name}
                </Typography>
                <Typography type={"body-sm"} color={"muted"} className={"line-clamp-2"}>
                    {data.short_description}
                </Typography>
                {
                    !featured &&
                    <Typography type="span" className="text-foreground text-lg font-bold">
                        ${formattedPrice}
                    </Typography>
                }

            </Card.Content>

            <Card.Footer>
                {featured ?
                    <Link href={data.slug || "/products/"}
                          className={"group flex gap-2 items-center text-accent font-semibold no-underline "}>
                        Show Now
                        <Icon icon={MoveRight}
                              className={"group-hover:translate-x-0.5 transition"}/>
                    </Link> :
                    <Button fullWidth className="capitalize gap-2">
                        Add to cart
                        <Icon icon={ShoppingCart}/>
                    </Button>}

            </Card.Footer>
        </Card>
    );
};

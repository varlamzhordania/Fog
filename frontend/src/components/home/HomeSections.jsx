"use client"
import {useHome} from "@/queries/inventory";
import ProductSlider from "@/components/Sliders/ProductSlider";
import React from "react";

export function LastFew() {
    const {data, isLoading} = useHome();
    if (!isLoading && !data?.last_few?.length) return null;

    return (
        <section className="container">
            <ProductSlider title="Last few left" productData={data?.last_few ?? []}
                           isLoading={isLoading}/>
        </section>
    );
}

export function NewArrivals() {
    const { data, isLoading } = useHome();

    return (
        <section className="container">
            <ProductSlider
                title="New Arrivals"
                productData={data?.new_arrivals ?? []}
                isLoading={isLoading}
            />
        </section>
    );
}

export function Deals() {
    const { data, isLoading } = useHome();

    return (
        <section className="container">
            <ProductSlider
                title="Deals"
                productData={data?.deals ?? []}
                isLoading={isLoading}
            />
        </section>
    );
}


export function BestSellers() {
    const {data, isLoading} = useHome();
    if (!isLoading && !data?.best_sellers?.length) return null;

    return (
        <section className="container">

        <ProductSlider
            title="Populars"
            productData={data?.best_sellers ?? []}
            isLoading={isLoading}
            cardVariant="image"
            slidesPerView={1.15}
            spaceBetween={16}
            breakpoints={{
                640: {slidesPerView: 1.5, spaceBetween: 16},
                768: {slidesPerView: 2, spaceBetween: 20},
                1024: {slidesPerView: 3, spaceBetween: 24},
            }}
            cardHeight="min-h-85"
            imageOverlay="from-black/75 via-black/20 to-transparent"
            showDescription
            showAction
            actionLabel="Show Now"
        />
        </section>
    );
}
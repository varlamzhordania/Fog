"use client"
import {useHome} from "@/queries/inventory";
import ProductSlider from "@/components/Sliders/ProductSlider";
import React from "react";
import ContourField from "@/components/ContourField";
import SporeDrift from "@/components/SporeDrift";

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
    const {data, isLoading} = useHome();

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
    const {data, isLoading} = useHome();

    return (
        <section className="container container-space relative">
            <ProductSlider
                title="Deals"
                productData={data?.deals ?? []}
                isLoading={isLoading}
            />
            <div
                className="fx-grain pointer-events-none absolute inset-0 overflow-hidden text-accent"
                aria-hidden="true"
            >
                <SporeDrift count={200}/>
                <span className="fx-fog -left-1/4 top-1/4"/>
                <span
                    className="fx-fog -right-1/4 mx-auto  bottom-10"
                    style={{
                        animationDelay: "-14s",
                        animationDuration: "40s",
                    }}
                />
            </div>
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
                actionLabel="View product"
            />
        </section>
    );
}
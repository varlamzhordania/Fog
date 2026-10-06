"use client"
import {useHome} from "@/queries/inventory";
import ProductSlider from "@/components/Sliders/ProductSlider";

export function LastFew() {
    const {data, isLoading} = useHome();
    if (!isLoading && !data?.last_few?.length) return null;

    return (
        <section className="container container-space">
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

export function FeaturedProducts() {
    const { data, isLoading } = useHome();

    return (
        <section className="container">
            <ProductSlider
                title="Featured"
                productData={data?.featured ?? []}
                isLoading={isLoading}
            />
        </section>
    );
}
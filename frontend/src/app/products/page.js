"use client"
import BackgroundImage from "@/components/BackgroundImage";
import {Breadcrumbs, Typography} from "@heroui/react";
import TagsFilter from "@/components/inventory/TagsFilter";
import ProductsFilter from "@/components/filters/ProductsFilter";
import ProductList from "@/components/inventory/ProductList";
import SuspenseBoundary from "@/components/SuspenseBoundary";

export default function ProductsPage() {
    return (
        <div className={"w-full flex flex-col items-stretch justify-start"}>
            <BackgroundImage lightImage="/bg/bg-light-r-to-l.jpg" darkImage="/bg/bg-dark-r-to-l.jpg">
                <div className="container relative flex min-h-[320px] flex-col justify-center lg:min-h-[380px]">
                    <div className="relative z-10 flex flex-col gap-5">
                        <Typography
                            type="h1"
                            className="text-4xl font-semibold uppercase leading-[0.95] tracking-tight text-accent sm:text-5xl lg:text-6xl xl:text-7xl"
                        >
                            Explore the Collection
                        </Typography>
                        <Typography
                            type="body"
                            className="max-w-2xl sm:text-lg"
                        >
                            Research materials, laboratory supplies, and carefully selected
                            mycology products for curious minds and serious exploration.
                        </Typography>

                        <Breadcrumbs>
                            <Breadcrumbs.Item href="/">Home</Breadcrumbs.Item>
                            <Breadcrumbs.Item href="/products">Shop</Breadcrumbs.Item>
                        </Breadcrumbs>
                    </div>
                </div>
            </BackgroundImage>
            <SuspenseBoundary>
                <div className={"container grid grid-cols-12 gap-6 pb-16 md:pb-24"}>

                    <div className="col-span-12">
                        <TagsFilter/>
                    </div>

                    <div className="col-span-12 lg:col-span-3">
                        <ProductsFilter/>
                    </div>

                    <div className="col-span-12 lg:col-span-9">
                        <ProductList/>
                    </div>
                </div>
            </SuspenseBoundary>
        </div>
    )
}

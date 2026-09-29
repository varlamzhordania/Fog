"use client";

import Image from "next/image";
import {Typography} from "@heroui/react";
import {useCategories} from "@/queries/inventory";
import {notFoundImage} from "@/lib/config";
import Link from "next/link";

const CategoriesShowCase = ({title = "product discovery"}) => {
    const {
        data,
        isLoading,
        isError,
    } = useCategories({
        page: 1,
        page_size: 4,
        is_featured: true,
    });

    const categories = data?.results ?? data ?? [];

    if (isLoading || isError || !categories.length) {
        return null;
    }

    return (
        <section className="container container-space">
            <div className="mb-6 flex flex-row items-center justify-between gap-4">
                <Typography
                    type="h3"
                    className="text-2xl font-bold uppercase tracking-tight text-accent/80 lg:text-4xl 2xl:text-5xl"
                >
                    {title}
                </Typography>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:grid-rows-3">
                {categories.map((category, index) => {
                    const layouts = [
                        "lg:col-span-5 lg:row-span-3",
                        "lg:col-span-7 lg:row-span-2",
                        "lg:col-span-3 lg:row-span-1",
                        "lg:col-span-4 lg:row-span-1",
                        "lg:col-span-5 lg:row-span-1",
                    ];

                    return (
                        <article
                            key={category.id ?? category.slug ?? index}
                            className={`
                                group relative min-h-[220px] overflow-hidden rounded-2xl
                                bg-default
                                ${layouts[index]}
                            `}
                        >
                            <Image
                                src={category.img || notFoundImage}
                                alt={category.name}
                                fill
                                unoptimized={true}
                                sizes="(max-width: 640px) 100vw,
                                           (max-width: 1024px) 50vw,
                                           50vw"
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div
                                className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"/>

                            <div className="absolute inset-x-0 bottom-0 p-5 lg:p-6">
                                <Typography
                                    type="h4"
                                    className="text-xl font-bold capitalize tracking-tight text-white lg:text-2xl"
                                >
                                    {category.name}
                                </Typography>
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
};

export default CategoriesShowCase;
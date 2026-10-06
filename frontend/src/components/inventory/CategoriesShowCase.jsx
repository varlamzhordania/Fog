"use client";

import Image from "@/components/Image";
import {Button, Card, Typography} from "@heroui/react";
import {useCategories} from "@/queries/inventory";
import Icon from "@/components/icon/Icon"
import {ArrowRight} from "lucide-react";
import {notFoundImage} from "@/lib/config";
import Link from "next/link";
import {useRouter} from "next/navigation";


const CategoriesShowCase = ({title = "product discovery"}) => {
    const {
        data, isLoading, isError,
    } = useCategories({
        page: 1, page_size: 6, is_featured: true,
    });

    const categories = data?.results ?? data ?? [];

    if (isLoading || isError || !categories.length) {
        return null;
    }

    return (<section className="container container-space">
        <div className="mb-6 flex flex-row items-center justify-between gap-4">
            <Typography
                type="h3"
                className="text-2xl font-bold uppercase tracking-tight text-accent/80 lg:text-4xl 2xl:text-5xl"
            >
                {title}
            </Typography>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
            {categories.map((category, index) =>
                <div key={index} className={"col-span1 lg:col-span-4 h-full"}>
                    <CardCategory category={category}/>
                </div>
            )}
        </div>
    </section>);
};

const CardCategory = ({category}) => {
    const router = useRouter()

    const handleClick = () => router.push(`/products/?category=${category.slug}`)

    return (
        <Card className="group relative h-full overflow-hidden min-h-55 border">

            <Image
                src={category.img || notFoundImage}
                alt={category.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
            />


            {/* Bottom → top backdrop */}
            <div
                className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black via-black/35 to-transparent"/>
            <div
                className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-tr from-accent/40 via-transparent to-transparent"/>

            <Card.Header className="absolute inset-x-0 bottom-0 z-10 w-full p-6 text-white">
                <div className="flex w-full items-end justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <Link href={`/products/?category=${category.slug}`}>
                            <Card.Title className="text-xl font-semibold text-white">
                                {category.name}
                            </Card.Title>
                        </Link>

                        <Card.Description className="mt-1 truncate text-white/75">
                            {category.description}
                        </Card.Description>
                    </div>

                    <Button
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        className="shrink-0 rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                        onPress={handleClick}
                    >
                        <Icon icon={ArrowRight}/>
                    </Button>
                </div>
            </Card.Header>
        </Card>
    )
}


export default CategoriesShowCase;
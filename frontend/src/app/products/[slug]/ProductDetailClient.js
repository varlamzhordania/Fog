"use client";

import {
    Breadcrumbs, Chip, Separator, Typography,
} from "@heroui/react";

import {
    CloudDownload, Warehouse,
} from "lucide-react";

import ProductGallery from "@/components/Sliders/ProductGallery";
import Link from "next/link";
import Icon from "@/components/icon/Icon";
import ProductSlider from "@/components/Sliders/ProductSlider";
import {useProducts} from "@/queries/inventory";
import {useCartStore} from "@/stores/cart";
import {useConfig} from "@/queries/config";
import CartQuantityControl from "@/components/inventory/CartQuantityControl";
import ProductReviews from "@/components/inventory/ProductReviews";
import Stars from "@/components/inventory/Stars";


export default function ProductDetailClient({product: initialProduct}) {
    const {incrementItem} = useCartStore(state => state)
    const {data: config} = useConfig();
    const product = initialProduct;

    const {
        data: relatedProducts, isLoading: isRelatedLoading,
    } = useProducts({
        category: product.category.slug,
    });

    const {
        data: featuredProducts, isLoading: isFeaturedLoading,
    } = useProducts({
        is_featured: true,
    });

    const formattedBasePrice = isNaN(Number(product.base_price))
        ? product.base_price
        : Number(product.base_price).toFixed(2);

    const formattedPrice = isNaN(Number(product.store_price))
        ? product.store_price
        : Number(product.store_price).toFixed(2);

    const isOnSale = product.discount_percentage > 0;
    const isDownloadable = product.product_type === "downloadable";
    const isInStock = product.available_stock > 0;

    const handleAddToCart = () => {
        incrementItem(product, 1)
    };

    return (<div className="container container-space md:py-12">

        {/* Breadcrumbs */}
        <div className="mb-8 min-w-0 overflow-hidden">
            <Breadcrumbs className="min-w-0">
                <Breadcrumbs.Item href="/" className="shrink-0">
                    Home
                </Breadcrumbs.Item>

                <Breadcrumbs.Item href="/products" className="shrink-0">
                    Shop
                </Breadcrumbs.Item>

                <Breadcrumbs.Item className="min-w-0 truncate sm:max-w-none">
                    {product.name}
                </Breadcrumbs.Item>
            </Breadcrumbs>
        </div>

        {/* Product */}
        <section className="grid grid-cols-1 gap-10 lg:grid-cols-12">

            {/* Visual */}
            <div className="lg:col-span-7">
                <ProductGallery product={product}/>
            </div>

            {/* Information */}
            <div className="lg:col-span-5">
                <div className="sticky top-28">

                    {/* Category */}
                    {product.category && (<Typography
                        type="body-sm"
                        className="mb-3"
                    >
                        {product.category.breadcrumb || product.category.name}
                    </Typography>)}

                    {/* Tags */}
                    {product.tags?.length > 0 && (<div className="mb-4 flex flex-wrap gap-2">
                        {product.tags.map((tag) => (<Link
                            key={tag.id}
                            href={`/products/?tags=${tag.slug}`}
                        >
                            <Chip
                                size="sm"
                                variant="secondary"
                                color="accent"
                            >
                                <Chip.Label>
                                    {tag.name}
                                </Chip.Label>
                            </Chip>
                        </Link>))}
                    </div>)}

                    {/* Product name */}
                    <Typography type="h1" className="mb-4">
                        {product.name}
                    </Typography>

                    {product.rating_count > 0 && (
                        <a href="#reviews" className="mb-4 flex items-center gap-2 no-underline">
                            <Stars value={product.rating_average}/>
                            <span className="text-sm text-muted">
                                {product.rating_average.toFixed(1)} ({product.rating_count})
                            </span>
                        </a>
                    )}

                    {/* Short description */}
                    {product.short_description && (<Typography type="body">
                        {product.short_description}
                    </Typography>)}

                    {/* Price */}
                    <div className="mt-8 flex items-center gap-3">
                        {isOnSale && (
                            <Typography
                                type="span"
                                className="text-lg font-medium text-foreground/50 line-through"
                            >
                                ${formattedBasePrice}
                            </Typography>
                        )}

                        <Typography
                            type="body"
                            className="text-3xl font-semibold text-accent"
                        >
                            ${formattedPrice}
                        </Typography>
                    </div>

                    <Separator className="my-8"/>

                    <div className={"mb-8 w-full flex justify-between items-start"}>
                        {/* Product type */}
                        <div>
                            <Typography
                                type="body-xs"
                                className="uppercase tracking-wider"
                            >
                                Product type
                            </Typography>

                            <Typography
                                type="body"
                                className="mt-1 font-medium"
                            >
                                {isDownloadable ? "Digital Download" : "Physical Product"}
                            </Typography>
                        </div>

                        {/* Product Stock */}
                        <div className="flex flex-row items-center justify-center gap-2">
                            <Icon icon={isDownloadable ? CloudDownload : Warehouse}/>
                            <Typography
                                type="body-sm"
                                className="text-center"
                            >
                                {isDownloadable ? "Instant download after payment confirmation." : `${product.available_stock} available`}
                            </Typography>
                        </div>
                    </div>


                    <CartQuantityControl product={product}/>
                </div>
            </div>
        </section>

        {/* Description */}
        <section className="mt-24 max-w-4xl">
            <h2 className="text-2xl font-semibold">
                About this product
            </h2>

            <div
                className="prose prose-neutral mt-6 max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{
                    __html: product.description || "",
                }}
            />

            {config?.LEGAL_RESEARCH_DISCLAIMER && (
                <p className="mt-10 max-w-4xl rounded-xl border border-border bg-surface p-4 text-xs leading-relaxed text-muted">
                    {config.LEGAL_RESEARCH_DISCLAIMER}
                </p>
            )}
        </section>

        {/* Information */}
        <ProductInformation product={product}/>

        <div id="reviews">
            <ProductReviews product={product}/>
        </div>

        {/* Related */}
        <section className={"container-space pb-0"}>
            <ProductSlider
                title="Related Products"
                productData={relatedProducts?.results}
                isLoading={isRelatedLoading}
            />
        </section>

        {/* Featured */}
        <section className={"container-space pb-0"}>
            <ProductSlider
                title="Featured Products"
                productData={featuredProducts?.results}
                featured
                cardDepth
                isLoading={isFeaturedLoading}
            />
        </section>
    </div>);
}


function ProductInformation({
                                product
                            }) {
    return (<section className="mt-24 border-t border-default-200 pt-10">
        <h2 className="text-2xl font-semibold">
            Product Information
        </h2>

        <dl className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">

            <div>
                <dt className="text-sm text-default-500">
                    Product type
                </dt>

                <dd className="mt-1 font-medium">
                    {product.product_type}
                </dd>
            </div>

            <div>
                <dt className="text-sm text-default-500">
                    SKU
                </dt>

                <dd className="mt-1 font-medium">
                    {product.sku}
                </dd>
            </div>

            {product.category && (<div>
                <dt className="text-sm text-default-500">
                    Category
                </dt>

                <dd className="mt-1 font-medium">
                    {product.category.name}
                </dd>
            </div>)}

            {product.tags?.length > 0 && (<div>
                <dt className="text-sm text-default-500">
                    Tags
                </dt>

                <dd className="mt-1 font-medium">
                    {product.tags
                        .map((tag) => tag.name)
                        .join(", ")}
                </dd>
            </div>)}

        </dl>
    </section>);
}
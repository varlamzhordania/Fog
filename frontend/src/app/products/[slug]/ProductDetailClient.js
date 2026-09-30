"use client";

import {
    Breadcrumbs,
    Button,
    Chip,
    Separator,
    Skeleton,
    Typography,
} from "@heroui/react";

import {
    CloudDownload,
    Download,
    ShoppingBag,
    Warehouse,
} from "lucide-react";

import ProductGallery from "@/components/Sliders/ProductGallery";
import Link from "next/link";
import Icon from "@/components/Icon/Icon";
import ProductSlider from "@/components/Sliders/ProductSlider";
import {useProducts} from "@/queries/inventory";


export default function ProductDetailClient({product: initialProduct}) {
    const product = initialProduct;

    const {
        data: relatedProducts,
        isLoading: isRelatedLoading,
    } = useProducts({
        category: product.category.slug,
    });

    const {
        data: featuredProducts,
        isLoading: isFeaturedLoading,
    } = useProducts({
        is_featured: true,
    });

    const isDownloadable = product.product_type === "downloadable";
    const isInStock = product.available_stock > 0;

    const handleAddToCart = () => {
    };

    return (
        <div className="container container-space md:py-12">

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
                    <div className="sticky top-24">

                        {/* Category */}
                        {product.category && (
                            <Typography
                                type="body-sm"
                                className="mb-3"
                            >
                                {product.category.breadcrumb ||
                                    product.category.name}
                            </Typography>
                        )}

                        {/* Tags */}
                        {product.tags?.length > 0 && (
                            <div className="mb-4 flex flex-wrap gap-2">
                                {product.tags.map((tag) => (
                                    <Link
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
                                    </Link>
                                ))}
                            </div>
                        )}

                        {/* Product name */}
                        <Typography type="h1" className="mb-4">
                            {product.name}
                        </Typography>

                        {/* Short description */}
                        {product.short_description && (
                            <Typography type="body">
                                {product.short_description}
                            </Typography>
                        )}

                        {/* Price */}
                        <div className="mt-8">
                            <Typography
                                type="body"
                                className="text-3xl font-semibold text-accent"
                            >
                                ${product.base_price}
                            </Typography>
                        </div>

                        <Separator className="my-8"/>

                        {/* Product type */}
                        <div className="mb-6">
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
                                {isDownloadable
                                    ? "Digital Download"
                                    : "Physical Product"}
                            </Typography>
                        </div>

                        <Button
                            size="lg"
                            fullWidth
                            startContent={
                                isDownloadable
                                    ? <Download size={18}/>
                                    : <ShoppingBag size={18}/>
                            }
                            isDisabled={!isInStock}
                            onPress={handleAddToCart}
                        >
                            {isInStock ? "Add to Cart" : "Out of Stock"}
                        </Button>

                        <div className="mt-4 flex flex-row items-center justify-center gap-2">
                            <Icon
                                icon={
                                    isDownloadable
                                        ? CloudDownload
                                        : Warehouse
                                }
                            />

                            <Typography
                                type="body-sm"
                                className="text-center"
                            >
                                {isDownloadable
                                    ? "Instant download after payment confirmation."
                                    : `${product.available_stock} available`}
                            </Typography>
                        </div>

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
            </section>

            {/* Information */}
            <ProductInformation product={product}/>

            {/* Related */}
            <ProductSlider
                title="Related Products"
                productData={relatedProducts?.results}
                isLoading={isRelatedLoading}
            />

            {/* Featured */}
            <ProductSlider
                title="Featured Products"
                productData={featuredProducts?.results}
                featured
                cardDepth
                isLoading={isFeaturedLoading}
            />
        </div>
    );
}


function ProductInformation({product}) {
    return (
        <section className="mt-24 border-t border-default-200 pt-10">
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

                {product.category && (
                    <div>
                        <dt className="text-sm text-default-500">
                            Category
                        </dt>

                        <dd className="mt-1 font-medium">
                            {product.category.name}
                        </dd>
                    </div>
                )}

                {product.tags?.length > 0 && (
                    <div>
                        <dt className="text-sm text-default-500">
                            Tags
                        </dt>

                        <dd className="mt-1 font-medium">
                            {product.tags
                                .map((tag) => tag.name)
                                .join(", ")}
                        </dd>
                    </div>
                )}

            </dl>
        </section>
    );
}
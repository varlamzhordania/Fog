"use client";

import {Breadcrumbs, Chip, Separator, Typography,} from "@heroui/react";
import {CloudDownload, Warehouse,} from "lucide-react";
import ProductGallery from "@/components/Sliders/ProductGallery";
import Link from "next/link";
import Icon from "@/components/icon/Icon";
import ProductSlider from "@/components/Sliders/ProductSlider";
import {useProducts} from "@/queries/inventory";
import {useConfig} from "@/queries/settings";
import CartQuantityControl from "@/components/inventory/CartQuantityControl";
import ProductReviews from "@/components/inventory/ProductReviews";
import Stars from "@/components/inventory/Stars";
import FeaturedProducts from "@/components/inventory/FeaturedProducts";
import {useState} from "react";
import {Label, Radio, RadioGroup} from "@heroui/react";
import {getDefaultPrice, stockLabel, pricePerBase, bestValueId} from "@/lib/pricing";


export default function ProductDetailClient({product: initialProduct}) {
    const {data: config} = useConfig();
    const product = initialProduct;

    const prices = product.prices ?? [];
    const [selectedId, setSelectedId] = useState(() => String(getDefaultPrice(product)?.id ?? ""));
    const price = prices.find((p) => String(p.id) === selectedId) ?? getDefaultPrice(product);
    const bestId = bestValueId(product);
    const perBase = pricePerBase(product, price);

    const formattedBasePrice = Number(price?.base_price ?? product.base_price).toFixed(2);
    const formattedPrice = Number(price?.store_price ?? product.store_price).toFixed(2);
    const isOnSale = (price?.discount_percentage ?? 0) > 0;
    const isDownloadable = product.product_type === "downloadable";


    return (<div className="container container-space md:py-12">

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
                        {perBase && (
                            <Typography type="body-xs"
                                        className="mt-1 text-muted">{perBase}</Typography>
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
                                {isDownloadable ? "Instant download after payment confirmation." : `${stockLabel(product)}`}
                            </Typography>
                            <span className="text-xs text-muted">
                                {product.max_quantity < 1 ? " · out of stock" : product.max_quantity <= 5 ? ` · ${product.max_quantity} left` : ""}
                            </span>
                        </div>
                    </div>


                    {prices.length > 1 && (
                        <div className="mb-6">
                            <Typography type="body-xs" className="mb-2 uppercase tracking-wider">
                                Choose size
                            </Typography>

                            <RadioGroup
                                name="price_option"
                                aria-label="Purchase option"
                                value={selectedId}
                                onChange={setSelectedId}
                                className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                            >
                                {prices.map((p) => {
                                    const soldOut = p.max_quantity < 1;
                                    const selected = String(p.id) === selectedId;
                                    const rate = pricePerBase(product, p);

                                    return (
                                        <Radio
                                            key={p.id}
                                            value={String(p.id)}
                                            isDisabled={soldOut}
                                            className={`relative w-full flex-row rounded-xl border p-3.5 transition-colors ${
                                                soldOut
                                                    ? "cursor-not-allowed border-border opacity-50"
                                                    : selected
                                                        ? "border-accent bg-accent/5 ring-1 ring-accent"
                                                        : "border-border hover:border-accent/50"
                                            }`}
                                        >
                                            <Radio.Content>
                                                <Radio.Control><Radio.Indicator/></Radio.Control>

                                                <div
                                                    className="flex min-w-0 flex-1 flex-col gap-0.5">
                                                    <div
                                                        className="flex items-center justify-between gap-2">
                                                        <Label
                                                            className="font-medium">{p.label}</Label>
                                                        <span className="font-semibold">
                                        ${Number(p.store_price).toFixed(2)}
                                    </span>
                                                    </div>

                                                    {rate && <span
                                                        className="text-xs text-muted">{rate}</span>}

                                                    <div
                                                        className="mt-1 flex flex-wrap items-center gap-1.5">
                                                        {p.id === bestId && (
                                                            <Chip size="sm" color="success"
                                                                  variant="soft">
                                                                <Chip.Label>Best value</Chip.Label>
                                                            </Chip>
                                                        )}
                                                        {p.discount_percentage > 0 && (
                                                            <Chip size="sm" color="danger"
                                                                  variant="soft">
                                                                <Chip.Label>-{p.discount_percentage}%</Chip.Label>
                                                            </Chip>
                                                        )}
                                                        {soldOut ? (
                                                            <span className="text-xs text-danger">Out of stock</span>
                                                        ) : p.max_quantity <= 5 ? (
                                                            <span className="text-xs text-warning">
                                            Only {p.max_quantity} left
                                        </span>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </Radio.Content>
                                        </Radio>
                                    );
                                })}
                            </RadioGroup>
                        </div>
                    )}

                    <CartQuantityControl product={product} price={price}/>
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
            {product.category && <RelatedProducts product={product}/>}
        </section>

        {/* Featured */}
        <section className={"container-space pb-0"}>
            <FeaturedProducts
                title="hand picked"
                cardVariant="image"
                page_size={12}
                slidesPerView={1.15}
                breakpoints={{
                    640: {slidesPerView: 1.5, spaceBetween: 16},
                    768: {slidesPerView: 2, spaceBetween: 20},
                    1024: {slidesPerView: 3, spaceBetween: 24},
                }}
                showDescription={false}
                cardHeight="min-h-85"
                actionLabel="View product"
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


function RelatedProducts({product}) {
    const {data, isLoading} = useProducts({category: product.category.slug, page_size: 11});
    const related = (data?.results ?? []).filter((p) => p.id !== product.id).slice(0, 10);

    if (!isLoading && related.length === 0) return null;

    return (
        <section className="container-space pb-0">
            <ProductSlider title="Related Products" productData={related} isLoading={isLoading}/>
        </section>
    );
}
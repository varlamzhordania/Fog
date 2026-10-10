import ProductDetailClient from "./ProductDetailClient";
import {notFound} from "next/navigation";
import {getProduct} from "@/lib/api/inventory.server";

export const dynamicParams = true;

export async function generateMetadata({params}) {
    const {slug} = await params;

    try {
        const product = await getProduct(slug);

        const description =
            product.short_description ||
            `${product.name} — available from FOG Mycology Research & Supplies.`;

        const image = product.primary_image?.file;

        return {
            title: `${product.name} | FOG`,
            description,

            alternates: {
                canonical: `/products/${product.slug}/`,
            },

            openGraph: {
                title: product.name,
                description,
                type: "website",
                url: `/products/${product.slug}/`,

                ...(image && {
                    images: [
                        {
                            url: image,
                            alt:
                                product.primary_image?.alt_text ||
                                product.name,
                        },
                    ],
                }),
            },

            twitter: {
                card: image
                    ? "summary_large_image"
                    : "summary",

                title: product.name,
                description,

                ...(image && {
                    images: [image],
                }),
            },
        };
    } catch (e) {
        if (e?.status === 404) {
            return {
                title: "Product Not Found | FOG",

                robots: {
                    index: false,
                    follow: false,
                },
            };
        }

        throw e;
    }
}


export default async function ProductDetail({params}) {
    const {slug} = await params;

    let product;

    try {
        product = await getProduct(slug);
    } catch (e) {
        if (e?.status === 404) {
            notFound();
        }

        throw e;
    }

    if (!product) {
        notFound();
    }

    return (
        <>
            <ProductJsonLd product={product}/>

            <ProductDetailClient
                product={product}
            />
        </>
    );
}


function ProductJsonLd({product}) {
    const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL || "";

    const productUrl =
        `${baseUrl}/products/${product.slug}/`;

    const image =
        product.primary_image?.file;

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",

        name: product.name,

        description:
            product.short_description ||
            product.name,

        sku: product.sku,

        url: productUrl,

        brand: {
            "@type": "Brand",
            name: "FOG",
        },

        ...(image && {
            image: [image],
        }),

        ...(product.category?.name && {
            category: product.category.name,
        }),
        ...(product.rating_count > 0 && {
            aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: product.rating_average,
                reviewCount: product.rating_count,
            },
        }),

        offers: {
            "@type": "Offer",

            url: productUrl,

            priceCurrency: "USD",

            price: product.store_price,

            availability:
                product.available_stock > 0
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",

            itemCondition:
                "https://schema.org/NewCondition",
        },
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
            }}
        />
    );
}
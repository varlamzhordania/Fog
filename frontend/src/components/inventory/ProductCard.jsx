import {notFoundImage} from "@/lib/config";
import {Button, Card, Link, Typography} from "@heroui/react";
import Image from "@/components/Image";
import Icon from "@/components/Icon/Icon";
import {MoveRight, ShoppingCartPlus} from "lucide-react";
import {cn} from "tailwind-variants";

const getProductHref = (slug) => {
    if (!slug) return "/products/";

    return slug.startsWith("/") ? slug : `/products/${slug}`;
};

const ProductCard = ({
                         data = {
                             name: "Product Name",
                             slug: "/products/",
                             short_description: "Short description here",
                             img: notFoundImage,
                             price: 45.99,
                         },
                         depth = false,
                         featured = false,
                     }) => {
    // Supports both API products (primary_image / base_price) and static data (img / price).
    const image = data.primary_image?.file || data.img || notFoundImage;
    const imageAlt = data.primary_image?.alt_text || data.name || "Product image";
    const price = data.base_price ?? data.price;
    const formattedPrice = isNaN(Number(price)) ? price : Number(price).toFixed(2);
    const outOfStock = typeof data.available_stock === "number" && data.available_stock <= 0;

    return (
        <Card className={cn("h-full w-full", depth && "bg-transparent shadow-none border-0")}>
            <Card.Header
                className={`p-0 overflow-hidden relative ${featured ? 'aspect-video' : 'aspect-square'}  w-full rounded-xl`}>
                <Image
                    src={image}
                    alt={imageAlt}
                    fill
                    sizes="(max-width: 640px) 80vw, (max-width: 1024px) 33vw, 20vw"
                    className="object-cover rounded-xl transition-transform duration-300 hover:scale-105"
                />
                {
                    featured &&
                    <div className={"absolute left-4 bottom-4 z-20"}>
                        <Typography type="span" className="text-foreground text-lg font-bold ">
                            ${formattedPrice}
                        </Typography>
                    </div>
                }
                {
                    <div
                        className={"absolute inset-0 bg-gradient-to-t from-background/40 via-background/10 to-transparent z-10"}></div>
                }

            </Card.Header>

            <Card.Content>
                <Typography type={"h4"} title={data.name} className={"text-lg"}>
                    {data.name}
                </Typography>
                <Typography type={"body-sm"} color={"muted"} className={"line-clamp-2"}>
                    {data.short_description}
                </Typography>
                {
                    !featured &&
                    <Typography type="span" className="text-foreground text-lg font-bold">
                        ${formattedPrice}
                    </Typography>
                }

            </Card.Content>

            <Card.Footer>
                {featured ?
                    <Link href={getProductHref(data.slug)}
                          className={"group flex gap-2 items-center text-accent font-semibold no-underline "}>
                        Show Now
                        <Icon icon={MoveRight}
                              className={"group-hover:translate-x-0.5 transition"}/>
                    </Link> :
                    <Button fullWidth isDisabled={outOfStock} className="capitalize gap-2">
                        {outOfStock ? "Out of stock" : "Add to cart"}
                        {!outOfStock && <Icon icon={ShoppingCartPlus}/>}
                    </Button>}

            </Card.Footer>
        </Card>
    );
};


export default ProductCard

import Link from "next/link";
import {ArrowRight} from "lucide-react";

import BackgroundImage from "@/components/BackgroundImage";
import Icon from "@/components/icon/Icon";
import {Skeleton, Typography} from "@heroui/react";
import ContourField from "@/components/ContourField";
import SporeDrift from "@/components/SporeDrift";


function BaseBandSkeleton() {
    return (
        <section className="container container-space">
            <div className="overflow-hidden rounded-xl">
                <Skeleton className="h-95 w-full rounded-xl"/>
            </div>
        </section>
    );
}


export default function BaseBand({
                                     isLoading = false,

                                     darkImage,
                                     lightImage,
                                     objectPosition = "right",
                                     opacity = 100,
                                     backdrop = false,

                                     badge,
                                     badgeIcon,
                                     badgeClassName = "border-accent bg-accent-soft",
                                     badgeIconClassName = "text-accent",
                                     badgeTextClassName = "text-accent",

                                     title,
                                     description,

                                     href,
                                     linkText,

                                     children,
                                 }) {
    if (isLoading) {
        return <BaseBandSkeleton/>;
    }

    return (
        <section className="container container-space">
            <div className="overflow-hidden rounded-xl">
                <BackgroundImage
                    darkImage={darkImage}
                    lightImage={lightImage}
                    objectPosition={objectPosition}
                    opacity={opacity}
                    backdrop={backdrop}
                >
                    <div
                        className="fx-grain pointer-events-none absolute inset-0 overflow-hidden text-accent"
                        aria-hidden="true"
                    >
                        <div className="absolute inset-y-0 left-0 w-[75%] opacity-35">
                            <ContourField
                                levels={10}
                                cell={30}
                                speed={0.00006}
                                interactive={false}
                                className="mask-[linear-gradient(to_right,black,transparent_100%)]"
                            />
                        </div>
                        <span className="fx-fog -left-1/4 top-1/4"/>
                        <span
                            className="fx-fog -right-1/4 bottom-0"
                            style={{
                                animationDelay: "-14s",
                                animationDuration: "40s",
                            }}
                        />
                    </div>

                    <div
                        className="
                            grid min-h-95 items-center
                            rounded-xl border border-accent/80
                            p-8 lg:grid-cols-12
                        "
                    >
                        <div className="lg:col-span-5">
                            {badge && (
                                <div
                                    className={`
                                        inline-flex items-center gap-2
                                        rounded-full border
                                        px-2.5 py-1
                                        ${badgeClassName}
                                    `}
                                >
                                    {badgeIcon && (
                                        <Icon
                                            icon={badgeIcon}
                                            className={`size-4 ${badgeIconClassName}`}
                                        />
                                    )}

                                    <Typography
                                        type="body-sm"
                                        className={`font-semibold ${badgeTextClassName}`}
                                    >
                                        {badge}
                                    </Typography>
                                </div>
                            )}

                            {title && (
                                <Typography
                                    type="h3"
                                    className="
                                        mt-3 text-4xl uppercase
                                        tracking-tight text-white
                                        lg:text-5xl
                                    "
                                >
                                    {title}
                                </Typography>
                            )}

                            {description && (
                                <p className="mt-3 max-w-xs text-muted">
                                    {description}
                                </p>
                            )}

                            {href && linkText && (
                                <Link
                                    href={href}
                                    className="
                                        mt-6 inline-flex items-center gap-2
                                        font-medium text-accent no-underline
                                        transition-opacity hover:opacity-80
                                    "
                                >
                                    {linkText}

                                    <Icon
                                        icon={ArrowRight}
                                        className="size-4"
                                    />
                                </Link>
                            )}

                            {children}
                        </div>
                    </div>
                </BackgroundImage>
            </div>
        </section>
    );
}

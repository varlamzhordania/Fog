"use client"

import Image from "next/image";
import {useThemeStore} from "@/stores/theme";
import {cn} from "tailwind-variants";

const objectPositionClasses = {
    left: "object-left",
    center: "object-center",
    right: "object-right",
};

const opacityClasses = {
    20: "opacity-20",
    25: "opacity-25",
    30: "opacity-30",
    35: "opacity-35",
    40: "opacity-40",
    50: "opacity-50",
    60: "opacity-60",
    70: "opacity-70",
    80: "opacity-80",
    90: "opacity-90",
    100: "opacity-40 md:opacity-100",
};


export default function BackgroundImage({
                                            children,
                                            darkImage,
                                            lightImage,
                                            svg,
                                            objectPosition = "left",
                                            opacity = 35,
                                            backdrop = true,
                                        }) {
    const theme = useThemeStore(state => state.theme);

    const bgImage = theme === "dark" ? darkImage : lightImage;

    if (!bgImage && !svg) {
        return <>{children}</>;
    }

    return (
        <div className="relative isolate overflow-hidden">
            <div className="pointer-events-none absolute inset-0 -z-10 text-accent">
                {svg}

                {bgImage && (
                    <>
                        <Image
                            src={bgImage}
                            fill
                            priority
                            sizes="100vw"
                            alt=""
                            className={cn('object-cover', objectPositionClasses[objectPosition], opacityClasses[opacity])}
                        />
                    </>
                )}
                {backdrop && (
                    <>
                        <div
                            className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background"/>

                        <div
                            className="absolute inset-0 bg-linear-to-t from-transparent via-transparent to-background"/>
                    </>
                )}

            </div>
            {children}
        </div>
    );
}
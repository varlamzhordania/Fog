"use client"

import Image from "next/image";
import {useConfigStore} from "@/stores/config";

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
};

export default function BackgroundImage({
                                            children,
                                            darkImage,
                                            lightImage,
                                            objectPosition = "left",
                                            opacity = 35,
                                        }) {
    const theme = useConfigStore(state => state.theme);

    const bgImage = theme === "dark" ? darkImage : lightImage;

    if (!bgImage) {
        return null;
    }

    return (
        <div className="relative isolate overflow-hidden">
            <div className="pointer-events-none absolute inset-0 -z-10">
                <Image
                    src={bgImage}
                    fill
                    priority
                    sizes="100vw"
                    alt=""
                    className={`
                    object-cover
                    ${objectPositionClasses[objectPosition]}
                    ${opacityClasses[opacity]}
                `}
                />

                <div
                    className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background"/>

                <div
                    className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-background"/>
            </div>
            {children}
        </div>
    );
}
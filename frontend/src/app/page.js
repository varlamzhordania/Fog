import {Button, Typography} from "@heroui/react";
import Image from "next/image";

const fungiImages = [{
    src: "/img4.jpg",
    className: "col-start-7 col-span-6 row-start-1 row-span-6 " + "md:col-start-7 md:col-span-6 md:row-start-1 md:row-span-6",
    mobileClassName: "col-span-2 row-span-5",
    backdrop: true,
}, {
    src: "/img2.jpg",
    className: "col-start-1 col-span-6 row-start-7 row-span-3 " + "md:col-start-1 md:col-span-6 md:row-start-7 md:row-span-3",
    mobileClassName: "col-span-1 row-span-3",
    backdrop: true,
}, {
    src: "/img1.jpg",
    className: "col-start-7 col-span-6 row-start-7 row-span-6 " + "md:col-start-7 md:col-span-6 md:row-start-7 md:row-span-6",
    mobileClassName: "col-span-1 row-span-3",
    backdrop: false,
}, {
    src: "/img3.jpg",
    className: "col-start-1 col-span-6 row-start-10 row-span-3 " + "md:col-start-1 md:col-span-6 md:row-start-10 md:row-span-3",
    mobileClassName: "col-span-2 row-span-3",
    backdrop: true,
},];

export default function Home() {
    return (<section className="container relative my-2 overflow-hidden px-4 sm:px-6 lg:px-0">
        <div
            className="
                    relative z-10 flex flex-col items-start justify-center
                    gap-5 py-16
                    sm:gap-6 sm:py-20
                    lg:min-h-[750px] lg:py-0
                "
        >
            <Typography
                type="h2"
                className="
                        text-4xl font-medium uppercase leading-[0.9]
                        sm:text-5xl
                        md:text-6xl
                        lg:text-7xl
                        xl:text-8xl
                        2xl:text-9xl
                    "
            >
                exploring the
                <br/>
                hidden intelligence
                <br/>
                of fungi
            </Typography>

            <Typography
                type="p"
                className="
                        max-w-2xl text-base font-semibold
                        sm:text-lg
                        md:text-xl
                        xl:text-2xl
                    "
            >
                FOG explores mycology through independent research,
                experiments, documentation, and innovation
            </Typography>
            <div className="flex flex-row gap-3">
                <Button
                    size="lg"
                    className="w-full sm:w-auto"
                >
                    Visit Shop
                </Button>
                <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto"
                >
                    Explore Research
                </Button>
            </div>
        </div>

        <div
            className="
                    pointer-events-none
                    absolute inset-y-0 right-0 z-0
                    hidden w-[48%]
                    md:block
                    lg:w-[46%]
                    xl:w-[45%]
                "
        >
            <div className="relative grid h-full grid-cols-12 grid-rows-12 gap-3">
                {fungiImages.map((image, index) => (<div
                    key={index}
                    className={`
                                relative overflow-hidden rounded-2xl p-1
                                ${image.className}
                            `}
                >
                    <Image
                        src={image.src}
                        width={1200}
                        height={1200}
                        alt=""
                        className="h-full w-full rounded-2xl object-cover"
                    />

                    {image.backdrop && (<div
                        className="
                                        absolute inset-0
                                        bg-gradient-to-r
                                        from-background
                                        via-background/60
                                        to-transparent
                                    "
                    />)}
                </div>))}
            </div>
        </div>

        <div
            className="
                    relative z-0
                    grid
                    grid-cols-2
                    auto-rows-[70px]
                    gap-3
                    pb-10
                    md:hidden
                "
        >
            {fungiImages.map((image, index) => (<div
                key={index}
                className={`
                            relative overflow-hidden rounded-2xl
                            ${image.mobileClassName}
                        `}
            >
                <Image
                    src={image.src}
                    width={1200}
                    height={1200}
                    alt=""
                    className="h-full w-full rounded-2xl object-cover"
                />
            </div>))}
        </div>
    </section>);
}
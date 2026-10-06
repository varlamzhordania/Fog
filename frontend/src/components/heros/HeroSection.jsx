"use client"
import {Typography} from "@heroui/react";
import Image from "next/image";
import Link from "next/link";
import {randomFact} from "@/data/facts";
import {useEffect, useState} from "react";
import {MoveRight} from "lucide-react";
import Icon from "@/components/icon/Icon";
import BackgroundImage from "@/components/BackgroundImage";
import ContourBackground from "@/components/ContourBackground";
import {useThemeStore} from "@/stores/theme";

const fungiImages = [
    {
        // IMAGE: Close-up of a Lion's Mane cluster on a dark surface, soft side light, landscape.
        src: "/products/img1.jpeg",
        className: "col-start-7 col-span-6 row-start-1 row-span-6",
        mobileClassName: "col-span-2 row-span-3",
        backdrop: true,
    }, {
        // IMAGE: Amber dropper bottle of dual extract beside dried reishi slices, neutral backdrop.
        src: "/products/img10.jpg",
        className: "col-start-1 col-span-6 row-start-7 row-span-3",
        mobileClassName: "col-span-1 row-span-3",
        backdrop: true,
    }, {
        // IMAGE: Blue oyster grow kit just starting to fruit, natural window light, square.
        src: "/products/img5.jpeg",
        className: "col-start-7 col-span-6 row-start-7 row-span-6",
        mobileClassName: "col-span-1 row-span-3",
        backdrop: false,
    }, {
        // IMAGE: Spore slides and petri dishes on a clean lab bench, cool light, landscape.
        src: "/products/img11.jpg",
        className: "col-start-1 col-span-6 row-start-10 row-span-3",
        mobileClassName: "col-span-2 row-span-3",
        backdrop: true,
    },];

const btnBase = "inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 font-medium no-underline transition sm:w-auto";

const HeroSection = () => {
    const {theme} = useThemeStore()
    const [fact, setFact] = useState("")

    useEffect(() => {
        setFact(randomFact())
    }, []);

    return (
        <BackgroundImage lightImage={"/hero-light.jpg"} darkImage={"/hero-dark.jpg"} objectPosition={"right"} opacity={100}>
            <section className="container relative">
                <div
                    className="relative z-10 flex flex-col items-start justify-center gap-4 py-10 sm:gap-5 sm:py-14 lg:min-h-[520px] lg:py-0 xl:min-h-[540px]"
                >
                    <Typography
                        type="h2"
                        className="text-4xl font-medium uppercase leading-[0.92] sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl 2xl:text-8xl"
                    >
                        exploring the <br/>
                        hidden intelligence <br/>
                        <span className={"text-accent"}>of fungi</span>
                    </Typography>

                    <div className="relative z-10 max-w-xl">
                        <div className="mb-2 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-accent"/>
                            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                                Fungi Fact
                            </span>
                        </div>

                        <Typography type="body" className="leading-relaxed text-foreground/90">
                            {fact}
                        </Typography>
                    </div>

                    <div className="flex w-full flex-row gap-3 sm:w-auto capitalize">
                        <Link href="/products"
                              className={`group ${btnBase} bg-accent text-accent-foreground hover:opacity-90`}>
                            Shop Collection
                            <Icon icon={MoveRight}
                                  className="transition-transform duration-200 group-hover:translate-x-0.5"/>
                        </Link>
                        <Link href="/products?is_featured=true"
                              className={`${btnBase} border border-border text-foreground hover:border-accent hover:text-accent`}>
                            Learn more
                        </Link>
                    </div>
                </div>
            </section>
        </BackgroundImage>
    )
}

export default HeroSection
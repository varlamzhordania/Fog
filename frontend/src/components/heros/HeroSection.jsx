"use client"
import {Button, Typography} from "@heroui/react";
import Image from "next/image";
import {randomFact} from "@/data/facts";
import {useEffect, useState} from "react";
import bgDark from "../../../public/bg/bg-dark-l-to-r.jpg"
import bgLight from "../../../public/bg/bg-light-l-to-r.jpg"
import {MoveRight} from "lucide-react";
import Icon from "@/components/Icon/Icon";
import BackgroundImage from "@/components/BackgroundImage";

const fungiImages = [
    {
        src: "/products/img1.jpeg",
        className: "col-start-7 col-span-6 row-start-1 row-span-6 " + "md:col-start-7 md:col-span-6 md:row-start-1 md:row-span-6",
        mobileClassName: "col-span-2 row-span-3",
        backdrop: true,
    }, {
        src: "/products/img10.jpg",
        className: "col-start-1 col-span-6 row-start-7 row-span-3 " + "md:col-start-1 md:col-span-6 md:row-start-7 md:row-span-3",
        mobileClassName: "col-span-1 row-span-3",
        backdrop: true,
    }, {
        src: "/products/img5.jpeg",
        className: "col-start-7 col-span-6 row-start-7 row-span-6 " + "md:col-start-7 md:col-span-6 md:row-start-7 md:row-span-6",
        mobileClassName: "col-span-1 row-span-3",
        backdrop: false,
    }, {
        src: "/products/img11.jpg",
        className: "col-start-1 col-span-6 row-start-10 row-span-3 " + "md:col-start-1 md:col-span-6 md:row-start-10 md:row-span-3",
        mobileClassName: "col-span-2 row-span-3",
        backdrop: true,
    },];

const HeroSection = () => {
    const [fact, setFact] = useState("")

    useEffect(() => {
        setFact(randomFact())

    }, []);


    return (
        <BackgroundImage darkImage={bgDark} lightImage={bgLight}>
            <section className="container relative my-2 px-4 sm:px-6 lg:px-0">
                <div
                    className="relative z-10 flex flex-col items-start justify-center gap-5 py-16 sm:gap-6 sm:py-20 lg:min-h-[750px] lg:py-0"
                >
                    <Typography
                        type="h2"
                        className="text-4xl font-medium uppercase leading-[0.9] sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl"
                    >
                        exploring the <br/>
                        hidden intelligence <br/>
                        of fungi
                    </Typography>

                    <div className="relative z-10 max-w-2xl">
                        <div className="mb-3 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-accent"/>

                            <span
                                className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                            Fungi Fact
                        </span>
                        </div>

                        <Typography type="body" className="leading-relaxed text-foreground/90">
                            {fact}
                        </Typography>
                    </div>

                    <div className="flex flex-row gap-3">
                        <Button size="lg" className="group w-full sm:w-auto">
                            Shop Mushrooms
                            <Icon icon={MoveRight}
                                  className="transition-transform duration-200 group-hover:translate-x-0.5"/>
                        </Button>
                        <Button size="lg" variant="outline" className="w-full sm:w-auto">
                            Explore Research
                        </Button>
                    </div>
                </div>

                <div
                    className="pointer-events-none absolute inset-y-0 right-0 z-0 hidden w-[48%] md:block lg:w-[46%] xl:w-[45%]"
                >
                    <div
                        className="relative grid h-full grid-cols-12 grid-rows-12 gap-3">
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
                                className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent"
                            />)}
                        </div>))}
                    </div>
                </div>

                <div
                    className="relative z-0 grid grid-cols-2 auto-rows-[70px] gap-3 pb-10 md:hidden">
                    {fungiImages.map((image, index) => (<div key={index}
                                                             className={`relative overflow-hidden rounded-2xl ${image.mobileClassName}`}
                    >
                        <Image src={image.src} width={1200} height={1200} alt=""
                               className="h-full w-full rounded-2xl object-cover"/>
                    </div>))}
                </div>
            </section>
        </BackgroundImage>
    )
}

export default HeroSection
"use client"

import {ArrowUp} from "lucide-react"
import {useEffect, useState} from "react"
import {Button} from "@heroui/react"
import Icon from "@/components/icon/Icon"

const GoToTop = ({
    threshold = 400,
    className = "",
}) => {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setVisible(window.scrollY > threshold)
        }

        handleScroll()

        window.addEventListener(
            "scroll",
            handleScroll,
            {passive: true},
        )

        return () => {
            window.removeEventListener(
                "scroll",
                handleScroll,
            )
        }
    }, [threshold])

    const handleClick = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        })
    }

    return (
        <Button
            isIconOnly
            size="lg"
            variant="secondary"
            aria-label="Go to top"
            onPress={handleClick}
            className={[
                "fixed bottom-6 right-6 z-50",
                "rounded-full shadow-lg",
                "transition-all duration-300",
                visible
                    ? "translate-y-0 opacity-100"
                    : "pointer-events-none translate-y-3 opacity-0",
                className,
            ].join(" ")}
        >
            <Icon
                icon={ArrowUp}
                className="size-4"
            />
        </Button>
    )
}

export default GoToTop

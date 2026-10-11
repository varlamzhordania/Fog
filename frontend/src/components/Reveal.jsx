"use client";

import {useEffect, useRef, useState} from "react";

export default function Reveal({children, delay = 0, as: Tag = "div", className = "", ...props}) {
    const ref = useRef(null);
    const [shown, setShown] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setShown(true);
                    io.disconnect();
                }
            },
            {threshold: 0.12, rootMargin: "0px 0px -8% 0px"}
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    return (
        <Tag
            ref={ref}
            data-visible={shown}
            style={{transitionDelay: `${delay}ms`}}
            className={`reveal ${className}`}
            {...props}
        >
            {children}
        </Tag>
    );
}
"use client";

import {useEffect, useRef, useState} from "react";
import {useHome} from "@/queries/inventory";

const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

function CountUp({to, suffix = "", duration = 2200}) {
    const ref = useRef(null);
    const [value, setValue] = useState(0);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduced) { setValue(to); return; }

        let raf = 0;
        const io = new IntersectionObserver(([e]) => {
            if (!e.isIntersecting) return;
            io.disconnect();
            const start = performance.now();
            const step = (now) => {
                const p = Math.min(1, (now - start) / duration);
                setValue(Math.round(easeOutExpo(p) * to));
                if (p < 1) raf = requestAnimationFrame(step);
            };
            raf = requestAnimationFrame(step);
        }, {threshold: 0.6});
        io.observe(el);
        return () => { io.disconnect(); cancelAnimationFrame(raf); };
    }, [to, duration]);

    return <span ref={ref} className="tabular-nums">{value.toLocaleString()}{suffix}</span>;
}

export default function StatsStrip() {
    const {data} = useHome();
    const s = data?.stats;
    if (!s) return null;

    const items = [
        {label: "Products catalogued", value: s.products},
        {label: "Countries shipped to", value: s.countries},
        {label: "Orders delivered", value: s.orders_delivered},
    ].filter((i) => i.value > 0);
    if (!items.length) return null;

    return (
        <section className="container">
            <dl className="grid grid-cols-1 divide-y divide-border border-y border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {items.map((i) => (
                    <div key={i.label} className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                        <dd className="font-atomic text-5xl tracking-tight text-foreground lg:text-6xl">
                            <CountUp to={i.value}/>
                        </dd>
                        <dt className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted">{i.label}</dt>
                    </div>
                ))}
            </dl>
        </section>
    );
}
"use client";

import {useEffect, useRef} from "react";

export default function SporeDrift({count = 38, className = ""}) {
    const ref = useRef(null);

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        const ctx = canvas.getContext("2d");
        let w = 0, h = 0, raf = 0, visible = true, rgb = "22,135,184";

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const r = canvas.getBoundingClientRect();
            w = r.width; h = r.height;
            canvas.width = w * dpr; canvas.height = h * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const m = getComputedStyle(canvas).color.match(/[\d.]+/g);
            if (m && m.length >= 3) rgb = `${m[0]},${m[1]},${m[2]}`;
        };

        const make = (anywhere) => ({
            x: Math.random() * w,
            y: anywhere ? Math.random() * h : h + 10,
            r: 0.6 + Math.random() * 1.6,
            vy: 0.12 + Math.random() * 0.3,       // px per frame at 60fps
            sway: 0.2 + Math.random() * 0.5,
            f: 0.0003 + Math.random() * 0.0006,
            ph: Math.random() * 6.28,
            tw: 0.0008 + Math.random() * 0.0015,
        });

        resize();
        const motes = Array.from({length: count}, () => make(true));
        const ro = new ResizeObserver(resize);
        ro.observe(canvas);
        const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
        io.observe(canvas);

        const tick = (t) => {
            raf = requestAnimationFrame(tick);
            if (!visible) return;
            ctx.clearRect(0, 0, w, h);
            for (const p of motes) {
                p.y -= p.vy;
                p.x += Math.sin(t * p.f + p.ph) * p.sway * 0.3;
                if (p.y < -10) Object.assign(p, make(false));
                const fade = Math.min(1, Math.min(p.y, h - p.y) / (h * 0.25)); // fade at edges
                const a = (0.15 + 0.4 * (0.5 + 0.5 * Math.sin(t * p.tw + p.ph))) * Math.max(fade, 0);
                ctx.fillStyle = `rgba(${rgb},${a * 0.12})`;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 5, 0, 6.283); ctx.fill();
                ctx.fillStyle = `rgba(${rgb},${a})`;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
            }
        };
        raf = requestAnimationFrame(tick);

        return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); };
    }, [count]);

    return <canvas ref={ref} aria-hidden="true" className={`pointer-events-none absolute inset-0 size-full ${className}`}/>;
}
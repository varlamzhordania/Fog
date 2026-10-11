"use client";

import {useEffect, useRef} from "react";

// marching-squares edge pairs per case: 0 top, 1 right, 2 bottom, 3 left
const SEGMENTS = {
    1: [[3, 2]], 2: [[1, 2]], 3: [[3, 1]], 4: [[0, 1]],
    5: [[0, 1], [3, 2]], 6: [[0, 2]], 7: [[0, 3]], 8: [[0, 3]],
    9: [[0, 2]], 10: [[0, 3], [1, 2]], 11: [[0, 1]], 12: [[3, 1]],
    13: [[1, 2]], 14: [[3, 2]],
};

export default function ContourField({
                                         className = "",
                                         levels = 12,
                                         cell = 24,
                                         speed = 0.00009,
                                         interactive = true,
                                     }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        let w = 0, h = 0, cols = 0, rows = 0, field = new Float32Array(0);
        let raf = 0, visible = true, last = 0, frame = 0, rgb = "22,135,184";
        const mouse = {x: -9999, y: -9999, tx: -9999, ty: -9999, power: 0};

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const rect = canvas.getBoundingClientRect();
            w = rect.width;
            h = rect.height;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            cols = Math.ceil(w / cell) + 1;
            rows = Math.ceil(h / cell) + 1;
            field = new Float32Array(cols * rows);
        };

        const sample = (x, y, t) => {
            let v =
                Math.sin(x * 0.006 + t * 1.3) +
                Math.sin(y * 0.008 - t * 0.9) +
                Math.sin((x + y) * 0.004 + t * 0.7) * 1.2 +
                Math.sin(Math.hypot(x - w * 0.75, y - h * 0.3) * 0.009 - t * 1.6) * 1.4 +
                Math.sin(Math.hypot(x - w * 0.15, y - h * 0.8) * 0.012 + t);
            if (mouse.power > 0.01) {
                const d = Math.hypot(x - mouse.x, y - mouse.y);
                v += Math.exp(-(d * d) / 22000) * 2.6 * mouse.power;
            }
            return v;
        };

        const draw = (now) => {
            raf = requestAnimationFrame(draw);
            if (!visible || now - last < 33) return; // ~30fps is plenty for lines
            last = now;
            frame++;
            if (frame % 90 === 1) {
                const m = getComputedStyle(canvas).color.match(/[\d.]+/g);
                if (m && m.length >= 3) rgb = `${m[0]},${m[1]},${m[2]}`;
            }

            mouse.x += (mouse.tx - mouse.x) * 0.08;
            mouse.y += (mouse.ty - mouse.y) * 0.08;

            const t = now * speed;
            for (let j = 0; j < rows; j++)
                for (let i = 0; i < cols; i++)
                    field[j * cols + i] = sample(i * cell, j * cell, t);

            ctx.clearRect(0, 0, w, h);
            const lit = 0.4 + 0.6 * mouse.power;
            const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 300);
            g.addColorStop(0, `rgba(${rgb},${lit})`);
            g.addColorStop(1, `rgba(${rgb},0.35)`);
            ctx.strokeStyle = g;
            ctx.lineCap = "round";

            for (let k = 0; k < levels; k++) {
                const lvl = -3.2 + (k / (levels - 1)) * 6.4;
                const major = k % 4 === 0;
                ctx.globalAlpha = major ? 1 : 0.55
                ctx.lineWidth = major ? 1 : 0.55
                ctx.beginPath();

                for (let j = 0; j < rows - 1; j++) {
                    for (let i = 0; i < cols - 1; i++) {
                        const tl = field[j * cols + i];
                        const tr = field[j * cols + i + 1];
                        const bl = field[(j + 1) * cols + i];
                        const br = field[(j + 1) * cols + i + 1];
                        const idx = (tl > lvl ? 8 : 0) | (tr > lvl ? 4 : 0) | (br > lvl ? 2 : 0) | (bl > lvl ? 1 : 0);
                        if (idx === 0 || idx === 15) continue;

                        const x0 = i * cell, y0 = j * cell;
                        const pt = (e) => {
                            switch (e) {
                                case 0:
                                    return [x0 + cell * (lvl - tl) / (tr - tl), y0];
                                case 1:
                                    return [x0 + cell, y0 + cell * (lvl - tr) / (br - tr)];
                                case 2:
                                    return [x0 + cell * (lvl - bl) / (br - bl), y0 + cell];
                                default:
                                    return [x0, y0 + cell * (lvl - tl) / (bl - tl)];
                            }
                        };
                        for (const [a, b] of SEGMENTS[idx]) {
                            const p = pt(a), q = pt(b);
                            ctx.moveTo(p[0], p[1]);
                            ctx.lineTo(q[0], q[1]);
                        }
                    }
                }
                ctx.stroke();
            }
            mouse.power += ((mouse.tx > -9000 ? 1 : 0) - mouse.power) * 0.05;
        };

        const onMove = (e) => {
            const r = canvas.getBoundingClientRect();
            mouse.tx = e.clientX - r.left;
            mouse.ty = e.clientY - r.top;
            if (mouse.x < -9000) {
                mouse.x = mouse.tx;
                mouse.y = mouse.ty;
            }
        };
        const onLeave = () => {
            mouse.tx = mouse.ty = -9999;
        };

        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(canvas);
        const io = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
        });
        io.observe(canvas);

        if (reduced) {
            draw(performance.now()); // single static frame
            cancelAnimationFrame(raf);
        } else {
            raf = requestAnimationFrame(draw);
            if (interactive) {
                window.addEventListener("pointermove", onMove, {passive: true});
                window.addEventListener("pointerleave", onLeave);
            }
        }

        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
            io.disconnect();
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerleave", onLeave);
        };
    }, [levels, cell, speed, interactive]);

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 size-full ${className}`}
            style={{
                maskImage: "linear-gradient(to bottom, #000 50%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to bottom, #000 50%, transparent 100%)",
            }}
        />
    );
}
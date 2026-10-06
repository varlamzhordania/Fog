const TAU = Math.PI * 2;

const ring = (cx, cy, r, seed) => {
    const steps = 72;
    let d = "";
    for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * TAU;
        const wobble =
            1 +
            0.16 * Math.sin(3 * a + seed) +
            0.09 * Math.sin(5 * a + seed * 1.7) +
            0.05 * Math.sin(8 * a + seed * 2.3);
        const x = cx + Math.cos(a) * r * wobble * 1.35;
        const y = cy + Math.sin(a) * r * wobble * 0.8;
        d += `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d + "Z";
};

// [centre x, centre y, first radius, ring count, spacing]
const PEAKS = [
    [1120, 300, 22, 17, 34],
    [260, 640, 18, 12, 30],
    [760, 760, 14, 8, 28],
];

export default function ContourBackground({className = ""}) {
    const paths = PEAKS.flatMap(([cx, cy, r0, count, gap], p) =>
        Array.from({length: count}, (_, i) => ({
            key: `${p}-${i}`,
            d: ring(cx, cy, r0 + i * gap, p * 2.1 + i * 0.11),
            major: i % 4 === 0,
        }))
    );

    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 1440 800"
            preserveAspectRatio="xMidYMid slice"
            className={`pointer-events-none absolute inset-0 -z-10 size-full ${className}`}
            style={{
                maskImage: "linear-gradient(to bottom, #000 55%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to bottom, #000 55%, transparent 100%)",
            }}
        >
            <g fill="none" stroke="currentColor" vectorEffect="non-scaling-stroke">
                {paths.map(({key, d, major}) => (
                    <path
                        key={key}
                        d={d}
                        strokeWidth={major ? 1.4 : 0.8}
                        opacity={major ? 0.5 : 0.28}
                        vectorEffect="non-scaling-stroke"
                    />
                ))}
            </g>
        </svg>
    );
}

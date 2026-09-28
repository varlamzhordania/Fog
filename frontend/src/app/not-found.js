import {Typography} from "@heroui/react";
import Link from "next/link";
import {ArrowLeft, Home, SearchX} from "lucide-react";
import Icon from "@/components/Icon/Icon";

export const metadata = {
    title: "404 — Page Not Found",
    description: "The page you're looking for doesn't exist in the FOG index.",
};

export default function NotFound() {
    return (
        <section className="container flex min-h-[70vh] flex-col items-center justify-center py-24 text-center">

            {/* Glitch label */}
            <Typography
                type="span"
                className="text-xs uppercase tracking-widest text-muted font-mono mb-6 block"
            >
                Error / 404
            </Typography>

            {/* Large 404 */}
            <Typography
                type="h1"
                className="text-[120px] md:text-[180px] font-atomic uppercase leading-none tracking-tighter text-foreground/10 select-none mb-0"
            >
                404
            </Typography>

            {/* Icon */}
            <div className="my-6 flex items-center justify-center size-16 rounded-full border border-border bg-surface">
                <Icon icon={SearchX} className="size-7 text-muted"/>
            </div>

            {/* Heading */}
            <Typography
                type="h2"
                className="text-2xl md:text-3xl font-atomic uppercase tracking-tight mb-3"
            >
                Strain Not Found
            </Typography>

            {/* Description */}
            <Typography type="body" className="text-muted max-w-md leading-relaxed mb-10">
                The strain you&apos;re looking for doesn&apos;t exist in our index — it may have
                been moved, delisted, or the URL may be incorrect.
            </Typography>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                    href="/"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold uppercase tracking-widest hover:opacity-90 transition-opacity"
                >
                    <Icon icon={Home} className="size-4"/>
                    Back to Home
                </Link>

                <Link
                    href="/products"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border bg-surface text-xs font-semibold uppercase tracking-widest hover:border-accent hover:text-accent transition-colors"
                >
                    Browse Products
                </Link>
            </div>

            {/* Monospace hint */}
            <Typography type="small" className="mt-14 text-[10px] font-mono text-muted/40 uppercase tracking-[0.2em]">
                FOG DIRECT // INDEX UNAVAILABLE // RETURNING TO SURFACE
            </Typography>

        </section>
    );
}

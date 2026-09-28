export default function Loading() {
    return (
        <div
            className="flex min-h-[60vh] flex-col items-center justify-center gap-8"
            role="status"
            aria-live="polite"
            aria-label="Loading"
        >
            {/* Spinner */}
            <div className="relative flex items-center justify-center">
                {/* Outer ring */}
                <div className="size-16 rounded-full border-2 border-border border-t-accent animate-spin"/>
                {/* Inner dot */}
                <div className="absolute size-2.5 rounded-full bg-accent"/>
            </div>

            {/* Brand label */}
            <div className="flex flex-col items-center gap-1.5">
                <span className="font-atomic text-4xl uppercase tracking-widest text-foreground/80">
                    FOG
                </span>
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted/60">
                    Initializing Sequence
                </span>
            </div>
        </div>
    );
}

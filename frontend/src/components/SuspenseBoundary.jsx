import {Suspense} from "react";

/**
 * SuspenseBoundary — wraps children in React.Suspense with a themed FOG fallback.
 *
 * Usage:
 *   <SuspenseBoundary>
 *     <AsyncComponent />
 *   </SuspenseBoundary>
 *
 *   <SuspenseBoundary fallback={<CustomSkeleton />}>
 *     <AsyncComponent />
 *   </SuspenseBoundary>
 */

function DefaultFallback() {
    return (
        <div
            className="flex items-center justify-center py-16"
            role="status"
            aria-live="polite"
            aria-label="Loading"
        >
            <div className="relative flex items-center justify-center">
                <div className="size-10 rounded-full border-2 border-border border-t-accent animate-spin"/>
                <div className="absolute size-2 rounded-full bg-accent"/>
            </div>
        </div>
    );
}

export default function SuspenseBoundary({children, fallback}) {
    return (
        <Suspense fallback={fallback ?? <DefaultFallback/>}>
            {children}
        </Suspense>
    );
}

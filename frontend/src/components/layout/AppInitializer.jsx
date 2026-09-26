'use client';

import React, { useEffect, useState } from 'react';
import { useConfigStore } from '@/stores/config';

export default function AppInitializer({ children }) {
  const { loaded, loading, error, load } = useConfigStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    load().catch(() => {
      // Error is tracked in the store state
    });
  }, [load]);

  // Prevent SSR hydration mismatch before initial client mount
  if (!mounted || (!loaded && !error)) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#000000] text-[#FFFFFF]"
        role="status"
        aria-live="polite"
      >
        <div className="relative flex items-center justify-center">
          {/* Static subtle track */}
          <div className="h-16 w-16 rounded-full border-4 border-[#E3E3E3]/10" />
          {/* Active rotating spinner */}
          <div className="absolute h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-[#0C6E99] border-r-[#0C6E99]" />
        </div>

        <div className="mt-6 flex flex-col items-center gap-1.5">
          <span className="text-xs font-semibold tracking-widest text-[#E3E3E3] uppercase">
            FOG
          </span>
          <span className="text-xs font-normal text-[#A4ACB0]">
            Initializing application settings...
          </span>
        </div>
      </div>
    );
  }

  // Fallback state if backend settings cannot be fetched
  if (error && !loaded) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#000000] px-4 text-[#FFFFFF]">
        <div className="w-full max-w-sm rounded-lg border border-[#E3E3E3]/20 bg-[#000000] p-6 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#0C6E99]/10 text-[#0C6E99]">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h2 className="text-sm font-semibold text-[#FFFFFF]">
            Configuration Sync Failed
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-[#A4ACB0]">
            Unable to connect to service configuration. Verify network connectivity or backend status.
          </p>

          <button
            type="button"
            onClick={() => load().catch(() => {})}
            disabled={loading}
            className="mt-6 inline-flex w-full items-center justify-center rounded bg-[#0C6E99] px-4 py-2 text-xs font-medium text-[#FFFFFF] transition-colors hover:bg-[#0C6E99]/80 focus:outline-none focus:ring-2 focus:ring-[#0C6E99] focus:ring-offset-2 focus:ring-offset-[#000000] disabled:opacity-50"
          >
            {loading ? 'Retrying...' : 'Retry Connection'}
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
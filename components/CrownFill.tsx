"use client";

import { useId } from "react";

// The fundraiser's central figure: a crown "vessel" filled bottom-up by collected/goal.
// Fill is white, not gold — money is white in this house (design charter). Shared by the
// builder preview and the public page; useId keeps clipPath ids unique across instances.
export function CrownFill({ pct, size = 96 }: { pct: number; size?: number }) {
  const id = useId();
  const top = 8;
  const bottom = 41;
  const h = (bottom - top) * Math.min(1, Math.max(0, pct));
  const crown = "M6 41 L6 14 L16 24 L24 8 L32 24 L42 14 L42 41 Z";
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <defs>
        <clipPath id={id}>
          <path d={crown} />
        </clipPath>
      </defs>
      <rect x="0" y={bottom - h} width="48" height={h} clipPath={`url(#${id})`} fill="var(--text-1)" style={{ transition: "y .6s var(--ease), height .6s var(--ease)" }} />
      <path d={crown} fill="none" stroke="var(--text-3)" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

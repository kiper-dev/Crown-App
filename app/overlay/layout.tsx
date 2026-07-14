"use client";

import { useEffect } from "react";

// Overlay pages render inside OBS as a Browser Source. OBS composites whatever is NON-transparent over
// the stream, so the page background must be transparent (globals.css paints body dark otherwise).
export default function OverlayLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prev = { htmlBg: html.style.background, bodyBg: body.style.background };
    html.style.background = "transparent";
    body.style.background = "transparent";
    return () => {
      html.style.background = prev.htmlBg;
      body.style.background = prev.bodyBg;
    };
  }, []);

  return <>{children}</>;
}

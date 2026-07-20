"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./LivePreview.module.css";

// A phone/desktop device frame with the REAL public page rendered inside, via an iframe.
// This is the whole point: the preview isn't a hand-kept mirror that drifts from the page —
// it IS the page, at the same URL a viewer opens, so it can never be out of sync. Edits in the
// builder are saved to localStorage; the iframe's ProfileProvider hears the `storage` event and
// re-renders, so the preview updates live as you type.
//
// The page is authored at a real device width (390 phone / 1280 desktop) and scaled down to the
// frame with a CSS transform. The iframe is rendered at its FULL content height and the frame is a
// scroll container, so hovering the preview and using the mouse wheel pages through the whole page —
// no content is ever cut off at the bottom.
const LOGICAL_WIDTH = { phone: 390, desktop: 1280 } as const;

export function LivePreview({ src, device }: { src: string; device: "phone" | "desktop" }) {
  const isDesktop = device === "desktop";
  const screenRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const roRef = useRef<ResizeObserver | null>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [contentH, setContentH] = useState(0);

  useEffect(() => {
    const el = screenRef.current;
    if (!el) return;
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [device]);

  // Full scroll height of the real page inside the iframe (same-origin, so readable). Kept fresh
  // via a ResizeObserver on the iframe's document, so the scrollable area tracks live edits.
  const measureContent = useCallback(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    const h = Math.max(doc.documentElement?.scrollHeight || 0, doc.body?.scrollHeight || 0);
    if (h) setContentH(h);
  }, []);

  const onLoad = useCallback(() => {
    roRef.current?.disconnect();
    measureContent();
    const doc = iframeRef.current?.contentDocument;
    if (doc && typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(() => measureContent());
      ro.observe(doc.documentElement);
      if (doc.body) ro.observe(doc.body);
      roRef.current = ro;
    }
  }, [measureContent]);

  useEffect(() => () => roRef.current?.disconnect(), []);

  const logicalW = LOGICAL_WIDTH[device];
  // Never shrink the desktop page past readability. Below this the frame shows the left part of a
  // 1280px page and the rest scrolls sideways — a legible slice beats an illegible whole.
  const MIN_SCALE = device === "desktop" ? 0.52 : 0.3;
  const fitScale = box.w ? box.w / logicalW : 0;
  const scale = fitScale ? Math.max(fitScale, MIN_SCALE) : 0;
  // Full content height once measured; until then, fall back to filling the frame so it never flashes empty.
  const iframeH = contentH || (scale ? box.h / scale : 0);
  const scaledH = iframeH * scale;

  return (
    <div className={`${styles.frame} ${isDesktop ? styles.desktop : styles.phone}`}>
      {isDesktop ? (
        <div className={styles.browserBar}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.url}>{src}</span>
        </div>
      ) : (
        // The phone's chrome, sized like the desktop's browser bar above: a real row, so the notch
        // reads as a phone without ever sitting on top of the page.
        <div className={styles.bezel} aria-hidden>
          <span className={styles.notch} />
        </div>
      )}
      <div className={styles.screen} ref={screenRef}>
        {scale > 0 && (
          <div className={styles.scaler} style={{ height: scaledH, width: logicalW * scale }}>
            <iframe
              ref={iframeRef}
              onLoad={onLoad}
              title="Live page preview"
              src={src}
              className={styles.iframe}
              style={{ width: logicalW, height: iframeH, transform: `scale(${scale})` }}
              scrolling="no"
              tabIndex={-1}
              aria-hidden
            />
          </div>
        )}
      </div>
    </div>
  );
}

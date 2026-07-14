"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./LivePreview.module.css";

// A phone/desktop device frame with the REAL public page rendered inside, via an iframe.
// This is the whole point: the preview isn't a hand-kept mirror that drifts from the page —
// it IS the page, at the same URL a viewer opens, so it can never be out of sync. Edits in the
// builder are saved to localStorage; the iframe's ProfileProvider hears the `storage` event and
// re-renders, so the preview updates live as you type.
//
// The page is authored at a real device width (390 phone / 1280 desktop) and scaled down to the
// frame with a CSS transform, so layout/wrapping match what that device actually gets.
const LOGICAL_WIDTH = { phone: 390, desktop: 1280 } as const;

export function LivePreview({ src, device }: { src: string; device: "phone" | "desktop" }) {
  const isDesktop = device === "desktop";
  const screenRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = screenRef.current;
    if (!el) return;
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [device]);

  const logicalW = LOGICAL_WIDTH[device];
  const scale = box.w ? box.w / logicalW : 0;
  const iframeH = scale ? box.h / scale : 0;

  return (
    <div className={`${styles.frame} ${isDesktop ? styles.desktop : styles.phone}`}>
      {isDesktop && (
        <div className={styles.browserBar}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.url}>{src}</span>
        </div>
      )}
      <div className={styles.screen} ref={screenRef}>
        {scale > 0 && (
          <iframe
            title="Live page preview"
            src={src}
            className={styles.iframe}
            style={{ width: logicalW, height: iframeH, transform: `scale(${scale})` }}
            scrolling="no"
            tabIndex={-1}
            aria-hidden
          />
        )}
      </div>
    </div>
  );
}

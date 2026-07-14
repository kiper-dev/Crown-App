"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { CopyIcon, QrIcon } from "@/components/icons";
import { OVERLAYS, type OverlayKind } from "@/lib/data/overlays";
import styles from "./WidgetsPanel.module.css";

function overlayUrl(origin: string, handle: string, kind: OverlayKind): string {
  return `${origin || "https://crown.tv"}/overlay/@${handle}/${kind}`;
}

// Static mini-illustration of each overlay — a hint of what OBS will show, not the live thing.
function MiniPreview({ kind }: { kind: OverlayKind }) {
  if (kind === "alerts") {
    return (
      <div className={`${styles.mini} ${styles.miniCenterTop}`}>
        <div className={styles.miniAlert}>
          <span className={styles.miniAvatar} />
          <div className={styles.miniAlertBody}>
            <span className={styles.miniLine} />
            <span className={`${styles.miniLine} ${styles.miniLineShort}`} />
          </div>
        </div>
      </div>
    );
  }
  if (kind === "goal") {
    return (
      <div className={`${styles.mini} ${styles.miniCenterBottom}`}>
        <div className={styles.miniGoal}>
          <div className={styles.miniGoalTop}>
            <span className={`${styles.miniLine} ${styles.miniLineShort}`} />
            <span className={styles.miniGoalNum} />
          </div>
          <div className={styles.miniTrack}>
            <span className={styles.miniFill} />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={`${styles.mini} ${styles.miniLeft}`}>
      <div className={styles.miniTop}>
        <span className={styles.miniTopHead} />
        {[0, 1, 2].map((i) => (
          <div className={styles.miniTopRow} key={i}>
            <span className={styles.miniRank} />
            <span className={styles.miniLine} />
            <span className={styles.miniAmt} />
          </div>
        ))}
      </div>
    </div>
  );
}

function OverlayCard({ handle, kind, label, desc }: { handle: string; kind: OverlayKind; label: string; desc: string }) {
  // Resolve the real host after mount (dev vs prod) to avoid an SSR/client hydration mismatch —
  // the same pattern PageBuilder uses. Rendering window.location.origin during render diverges from SSR.
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const url = overlayUrl(origin, handle, kind);
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qr, setQr] = useState("");

  useEffect(() => {
    if (!qrOpen) return;
    QRCode.toDataURL(url, { margin: 1, width: 220, color: { dark: "#F1EFF7", light: "#00000000" } })
      .then(setQr)
      .catch(() => setQr(""));
  }, [qrOpen, url]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  }

  return (
    <div className={styles.card}>
      <MiniPreview kind={kind} />
      <div className={styles.cardBody}>
        <div className={styles.cardTitle}>{label}</div>
        <p className={styles.cardDesc}>{desc}</p>

        <div className={styles.urlRow}>
          <span className={styles.url}>{url.replace(/^https?:\/\//, "")}</span>
        </div>

        <div className={styles.actions}>
          <button type="button" className="btn-outline" onClick={copy}>
            <CopyIcon /> {copied ? "Copied" : "Copy URL"}
          </button>
          <button type="button" className="btn-outline" onClick={() => setQrOpen((v) => !v)}>
            <QrIcon /> QR
          </button>
          <a className="btn-outline" href={url} target="_blank" rel="noreferrer">
            Open ↗
          </a>
        </div>

        {qrOpen && (
          <div className={styles.qrPop}>
            {qr ? <img src={qr} alt={`QR for ${label} overlay`} width={180} height={180} /> : <div className={styles.qrLoading}>Generating…</div>}
          </div>
        )}
      </div>
    </div>
  );
}

export function WidgetsPanel({ handle }: { handle: string }) {
  return (
    <div className={styles.wrap}>
      <p className={styles.help}>
        Add any overlay to OBS as a <b>Browser Source</b> — paste its URL. It updates live when someone donates.
      </p>
      <div className={styles.grid}>
        {OVERLAYS.map((o) => (
          <OverlayCard key={o.kind} handle={handle} kind={o.kind} label={o.label} desc={o.desc} />
        ))}
      </div>
    </div>
  );
}

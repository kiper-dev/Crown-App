"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { CopyIcon, QrIcon, SearchIcon, NavIcon, GameIcon } from "@/components/icons";
import { OVERLAYS, type OverlayDef, type OverlayKind } from "@/lib/data/overlays";
import { GAMES, type GameId } from "@/lib/data/games";
import styles from "./WidgetsPanel.module.css";

function overlayUrl(origin: string, handle: string, kind: OverlayKind): string {
  return `${origin || "https://crown.tv"}/overlay/@${handle}/${kind}`;
}

// Static mini-illustration of each overlay — a hint of what OBS will show, not the live thing.
// New kinds reuse the closest of the three shapes: a popup (alerts/rank/task), a progress bar
// (goal/fundraiser), or a list (top/roulette).
function MiniPreview({ kind }: { kind: OverlayKind }) {
  if (kind === "alerts" || kind === "rank" || kind === "task") {
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
  if (kind === "goal" || kind === "fundraiser") {
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

// Categories come from the data, not a hand-kept list: "General" is everything not tied to a game,
// then one per mini-game that actually ships a widget — so adding a game widget adds its category,
// with the game's own title as the label.
type Cat = "all" | "general" | GameId;

const CATS: { key: Cat; label: string }[] = [
  { key: "all", label: "All" },
  { key: "general", label: "General" },
  ...GAMES.filter((g) => OVERLAYS.some((o) => o.game === g.id)).map((g) => ({ key: g.id as Cat, label: g.title })),
];

const inCat = (o: OverlayDef, c: Cat) => (c === "all" ? true : c === "general" ? !o.game : o.game === c);

// Every row carries an icon, like the platform rows on /discover: the games use their own game
// icon, so a category reads as the game it belongs to at a glance.
function CatIcon({ cat }: { cat: Cat }) {
  if (cat === "all") return <NavIcon name="widgets" />;
  if (cat === "general") return <NavIcon name="donations" />;
  return <GameIcon id={cat} width={16} height={16} />;
}

export function WidgetsPanel({ handle }: { handle: string }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Cat>("all");

  const term = q.trim().toLowerCase();
  const hits = (o: OverlayDef) => !term || o.label.toLowerCase().includes(term) || o.desc.toLowerCase().includes(term);
  const shown = OVERLAYS.filter((o) => inCat(o, cat) && hits(o));
  // counts follow the search, so a category tells you what you'd actually get if you clicked it
  const countIn = (c: Cat) => OVERLAYS.filter((o) => inCat(o, c) && hits(o)).length;

  return (
    <div className={styles.wrap}>
      <p className={styles.help}>
        Add any overlay to OBS as a <b>Browser Source</b> — paste its URL. It updates live when someone donates.
      </p>

      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <div className="search-field">
            <SearchIcon width={16} height={16} />
            <input type="text" placeholder="Search widgets…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search widgets" />
          </div>

          <div className={styles.filterGroup}>
            <div className={styles.filterLabel}>Categories</div>
            <div className={styles.catList}>
              {CATS.map((c) => {
                const n = countIn(c.key);
                return (
                  <button
                    key={c.key}
                    type="button"
                    className={`${styles.catRow} ${cat === c.key ? styles.catOn : ""}`}
                    aria-pressed={cat === c.key}
                    // nothing to show and not the current pick → nothing to click
                    disabled={n === 0 && cat !== c.key}
                    onClick={() => setCat(c.key)}
                  >
                    <CatIcon cat={c.key} />
                    <span className={styles.catLabel}>{c.label}</span>
                    <span className={styles.catCount}>{n}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {shown.length === 0 ? (
          <div className="empty-log">No widget matches “{q.trim()}”.</div>
        ) : (
          <div className={styles.grid}>
            {shown.map((o) => (
              <OverlayCard key={o.kind} handle={handle} kind={o.kind} label={o.label} desc={o.desc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

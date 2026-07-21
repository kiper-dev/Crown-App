import { ImageResponse } from "next/og";

// Notification cards for the Telegram bot — the site's design, drawn as a PNG. The bot downloads
// from here and uploads to Telegram as a photo (Telegram can't reach localhost itself).
// Layouts are fixed, values come in as query params: ?t=notify&label=…&value=…&title=…&sub=…
// or ?t=stats&title=…&rows=Label:Value|Label:Value|…
//
// Charter (docs/front.md §II): the exact site tokens, one purple accent per card — the brand mark
// (the same CrownBadge gradient hexagon as the nav) plus its echo in the footer strip. Everything
// else neutral: the label is a pill (status by shape, not color), figures are big white bold.

export const runtime = "edge";

// globals.css tokens, inlined (an edge image route can't read CSS variables).
const BG = "#141318"; // --bg-0
const PANEL = "#1B1A21"; // --bg-1
const LINE = "rgba(235, 233, 244, 0.08)"; // --line
const LINE_STRONG = "rgba(235, 233, 244, 0.16)"; // --line-strong
const TEXT_1 = "#F1EFF7";
const TEXT_2 = "#A6A2B4";
const GRAD_TOP = "#8B7CF6"; // --grad-top (accent gradient: GRAD_TOP → GRAD_END)
const GRAD_END = "#F4F2FE";
// The public domain printed on shared cards. Configurable so a non-crown.tv deployment shows its
// own host instead of a hardcoded one; crown.tv is the documented production default.
const SITE_DOMAIN = process.env.NEXT_PUBLIC_SITE_DOMAIN || "crown.tv";

// The site's brand mark, verbatim from components/CrownBadge.tsx — the gradient hexagon with the
// crown punched through to the page. This is the card's one accent-gradient spot.
function Wordmark() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GRAD_TOP} />
            <stop offset="100%" stopColor={GRAD_END} />
          </linearGradient>
        </defs>
        <path d="M24 1.5 44.5 13.25 44.5 34.75 24 46.5 3.5 34.75 3.5 13.25Z" fill="url(#g)" />
        <path d="M24 5.6 40.9 15.3 40.9 32.7 24 42.4 7.1 32.7 7.1 15.3Z" fill="none" stroke={BG} strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M12.6 32.4 14.2 19.4 19.3 26.2 24 14.6 28.7 26.2 33.8 19.4 35.4 32.4C29.6 34.6 18.4 34.6 12.6 32.4Z" fill={BG} />
        <circle cx="14.2" cy="17.6" r="2.4" fill={BG} />
        <circle cx="24" cy="12.8" r="2.7" fill={BG} />
        <circle cx="33.8" cy="17.6" r="2.4" fill={BG} />
        <path d="M14.4 30.6C20 33 28 33 33.6 30.6 28 31.9 20 31.9 14.4 30.6Z" fill="url(#g)" />
      </svg>
      <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.5, color: TEXT_1 }}>Crown</div>
    </div>
  );
}

// The category label — a neutral pill, like every status on the site: shape carries the meaning,
// color stays out of it (the accent belongs to the brand mark alone).
function Chip({ text }: { text: string }) {
  return (
    <div
      style={{
        display: "flex",
        padding: "10px 22px",
        borderRadius: 999,
        border: `2px solid ${LINE_STRONG}`,
        color: TEXT_2,
        fontSize: 22,
        fontWeight: 600,
        letterSpacing: 3,
      }}
    >
      {text.toUpperCase()}
    </div>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: BG,
        padding: 56,
      }}
    >
      {children}
      <div
        style={{
          display: "flex",
          height: 8,
          width: 320,
          borderRadius: 999,
          background: `linear-gradient(90deg, ${GRAD_TOP}, ${GRAD_END})`,
          marginTop: "auto",
        }}
      />
    </div>
  );
}

export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const t = p.get("t") ?? "notify";
  const title = p.get("title") ?? "";
  const sub = p.get("sub") ?? "";
  const label = p.get("label") ?? "";
  const value = p.get("value") ?? "";
  const handle = p.get("handle") ?? "";

  if (t === "stats") {
    // rows: "Label:Value|Label:Value" — the prepared captions; only the figures change.
    // "|" as the row separator because the figures themselves contain commas ($4,120).
    const rows = (p.get("rows") ?? "")
      .split("|")
      .map((r) => r.split(":"))
      .filter((r) => r.length === 2);

    return new ImageResponse(
      (
        <Frame>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Wordmark />
            {label ? <Chip text={label} /> : null}
          </div>
          <div style={{ display: "flex", fontSize: 46, fontWeight: 700, color: TEXT_1, marginTop: 48 }}>{title}</div>
          <div style={{ display: "flex", flexWrap: "wrap", marginTop: 28 }}>
            {rows.map(([k, v], i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: 500,
                  marginRight: i % 2 === 0 ? 44 : 0,
                  marginBottom: 22,
                  padding: "22px 28px",
                  background: PANEL,
                  border: `1px solid ${LINE}`,
                  borderRadius: 18,
                }}
              >
                <div style={{ display: "flex", fontSize: 22, fontWeight: 600, color: TEXT_2, letterSpacing: 1 }}>{k}</div>
                <div style={{ display: "flex", fontSize: 44, fontWeight: 700, color: TEXT_1, marginTop: 4 }}>{v}</div>
              </div>
            ))}
          </div>
        </Frame>
      ),
      { width: 1200, height: 630 }
    );
  }

  return new ImageResponse(
    (
      <Frame>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Wordmark />
          {label ? <Chip text={label} /> : null}
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: value ? 40 : 72 }}>
          {value ? <div style={{ display: "flex", fontSize: 150, fontWeight: 700, color: TEXT_1, lineHeight: 1, letterSpacing: -3 }}>{value}</div> : null}
          <div style={{ display: "flex", fontSize: 52, fontWeight: 700, color: TEXT_1, marginTop: 28, lineHeight: 1.15, maxWidth: 1050 }}>
            {title}
          </div>
          {sub ? (
            <div style={{ display: "flex", fontSize: 30, color: TEXT_2, marginTop: 18, lineHeight: 1.35, maxWidth: 1000 }}>{sub}</div>
          ) : null}
        </div>
        {handle ? (
          <div style={{ display: "flex", fontSize: 24, color: TEXT_2, marginTop: 30 }}>{`${SITE_DOMAIN}/@${handle}`}</div>
        ) : null}
      </Frame>
    ),
    { width: 1200, height: 630 }
  );
}

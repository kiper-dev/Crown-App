import { ImageResponse } from "next/og";

// Notification cards for the Telegram bot — the site's design, drawn as a PNG. The bot downloads
// from here and uploads to Telegram as a photo (Telegram can't reach localhost itself).
// Layouts are fixed, values come in as query params: ?t=notify&label=…&value=…&title=…&sub=…
// or ?t=stats&title=…&rows=Label:Value,Label:Value,…
//
// Charter: dark, one purple accent, numbers white and bold. No gold, no traffic lights.

export const runtime = "edge";

const BG = "#0F0E14";
const PANEL = "#16151D";
const LINE = "#2A2833";
const TEXT_1 = "#EDECF4";
const TEXT_2 = "#9AA0AE";
const ACCENT = "#8B7CF6";
const ACCENT_SOFT = "rgba(139, 124, 246, 0.14)";
// The public domain printed on shared cards. Configurable so a non-crown.tv deployment shows its
// own host instead of a hardcoded one; crown.tv is the documented production default.
const SITE_DOMAIN = process.env.NEXT_PUBLIC_SITE_DOMAIN || "crown.tv";

function Wordmark() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
        <path d="M3 8.5 7.5 12 12 5.5 16.5 12 21 8.5 19 18.5H5L3 8.5Z" fill={ACCENT} />
      </svg>
      <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 10, color: TEXT_1 }}>CROWN</div>
    </div>
  );
}

function Chip({ text }: { text: string }) {
  return (
    <div
      style={{
        display: "flex",
        padding: "10px 22px",
        borderRadius: 999,
        background: ACCENT_SOFT,
        border: `2px solid ${ACCENT}`,
        color: TEXT_1,
        fontSize: 24,
        fontWeight: 700,
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
        background: `linear-gradient(160deg, #17141F 0%, ${BG} 45%, ${BG} 100%)`,
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
          background: `linear-gradient(90deg, ${ACCENT}, #C9BEFF)`,
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
          {value ? <div style={{ display: "flex", fontSize: 150, fontWeight: 700, color: TEXT_1, lineHeight: 1 }}>{value}</div> : null}
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

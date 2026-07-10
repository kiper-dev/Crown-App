"use client";

import type { ReactNode } from "react";

export function money(n: number) {
  return `${Math.round(n).toLocaleString("en-US")} $`;
}
export function shortMoney(n: number) {
  return n >= 1000 ? `${Math.round(n / 1000)}k $` : `${n} $`;
}

export function StatTile({ k, v, s }: { k: string; v: string; s?: string }) {
  return (
    <div className="stat">
      <div className="k">{k}</div>
      <div className="v num">{v}</div>
      {s ? <div className="s">{s}</div> : null}
    </div>
  );
}

export type Bar = { label: string; value: number; icon?: ReactNode; display?: string };

// Magnitude bars: neutral track, value in white, length = comparison.
export function BarList({ bars, unit }: { bars: Bar[]; unit?: "money" | "count" }) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <div className="barlist">
      {bars.map((b) => (
        <div className="barrow" key={b.label} title={`${b.label}: ${b.display ?? b.value}`}>
          <span className="bl">
            {b.icon}
            {b.label}
          </span>
          <div className="bartrack">
            <div className="barfill" style={{ width: `${Math.max((b.value / max) * 100, b.value ? 3 : 0)}%` }} />
          </div>
          <span className="bv num">{b.display ?? (unit === "money" ? shortMoney(b.value) : b.value)}</span>
        </div>
      ))}
    </div>
  );
}

// Money growth — white area (money = white per the charter).
export function MiniArea({ data, color = "var(--text-1)" }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  const W = 100;
  const H = 40;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * W, H - (v / max) * (H - 3)]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(" ");
  const area = `${line} L${W} ${H} L0 ${H} Z`;
  const gid = `g-${color.replace(/[^a-z]/gi, "")}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="trend">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// Viewer growth — purple bars (shape distinguishes it from money).
export function MiniBars({ data, color = "var(--accent)" }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  const W = 100;
  const H = 40;
  const gap = 1.2;
  const bw = (W - gap * (data.length - 1)) / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="viewer trend">
      {data.map((v, i) => {
        const h = Math.max((v / max) * (H - 2), 1);
        return <rect key={i} x={i * (bw + gap)} y={H - h} width={bw} height={h} fill={color} rx={0.6} />;
      })}
    </svg>
  );
}

export function StatusPill({ tone, children }: { tone: "wait" | "attn" | "ok" | "bad" | "neutral"; children: ReactNode }) {
  return (
    <span className={`pill ${tone}`}>
      <span className="dot" />
      {children}
    </span>
  );
}

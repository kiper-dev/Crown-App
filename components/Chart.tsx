"use client";

import { useState } from "react";
import type { SVGProps } from "react";

type View = "bar" | "line";

function BarsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden {...props}>
      <path d="M5 19V10M12 19V5M19 19v-6" />
    </svg>
  );
}
function LineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M4 16.5 9 10l4 3 7-9.5" />
    </svg>
  );
}

// Line view — same points as the bars, but a curve. Money = white (charter), same as the peak bar.
function LineView({ days, max, peakIndex, peakLabel }: { days: number[]; max: number; peakIndex: number; peakLabel: string }) {
  const W = 100;
  const H = 100;
  const top = 6; // top margin so the peak doesn't hit the edge
  const step = days.length > 1 ? W / (days.length - 1) : W;
  const pts = days.map((v, i) => [i * step, H - (v / max) * (H - top)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${W} ${H} L0 ${H} Z`;
  const peak = peakIndex >= 0 ? pts[peakIndex] : null;

  return (
    <div style={{ paddingTop: 32 }}>
      <div style={{ height: 160, position: "relative" }}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: "100%", display: "block" }} aria-hidden>
          <defs>
            <linearGradient id="chart-line-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--text-1)" stopOpacity="0.16" />
              <stop offset="100%" stopColor="var(--text-1)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#chart-line-fill)" />
          <path d={line} fill="none" stroke="var(--text-1)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          {peak ? <circle cx={peak[0]} cy={peak[1]} r="1.7" fill="var(--text-1)" /> : null}
        </svg>
        {peak ? (
          <span
            className="num"
            style={{
              position: "absolute",
              left: `${peak[0]}%`,
              top: `${peak[1]}%`,
              transform: "translate(-50%, calc(-100% - 10px))",
              fontSize: 14,
              color: "var(--text-2)",
              whiteSpace: "nowrap",
            }}
          >
            {peakLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function Chart({
  title,
  days,
  peakValue,
  peakLabel,
  axis,
}: {
  title: string;
  days: number[];
  peakValue: number;
  peakLabel: string;
  axis: string[];
}) {
  const [view, setView] = useState<View>("bar");
  const max = Math.max(peakValue, ...days) || 1;
  const peakIndex = days.indexOf(peakValue);

  return (
    <>
      <div className="main-head" style={{ marginBottom: 0 }}>
        <h2>{title}</h2>
        <div className="seg" role="group" aria-label="Chart view">
          <button
            type="button"
            className={view === "bar" ? "active" : ""}
            onClick={() => setView("bar")}
            aria-label="Bars"
            title="Bars"
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
          >
            <BarsIcon />
          </button>
          <button
            type="button"
            className={view === "line" ? "active" : ""}
            onClick={() => setView("line")}
            aria-label="Line"
            title="Line"
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
          >
            <LineIcon />
          </button>
        </div>
      </div>

      {view === "bar" ? (
        <div className="chart" aria-hidden>
          {days.map((v, i) => {
            const peak = v === peakValue;
            return (
              <div className={`col${peak ? " peak" : ""}`} key={i}>
                <div className="b" style={{ height: `${Math.max((v / max) * 100, v ? 4 : 2)}%` }} />
                {peak ? <span className="peak-tag num">{peakLabel}</span> : null}
              </div>
            );
          })}
        </div>
      ) : (
        <LineView days={days} max={max} peakIndex={peakIndex} peakLabel={peakLabel} />
      )}

      <div className="axis num">
        {axis.map((a) => (
          <span key={a}>{a}</span>
        ))}
      </div>
    </>
  );
}

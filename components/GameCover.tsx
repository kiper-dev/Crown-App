import type { GameId } from "@/lib/data/games";
import styles from "./GameCover.module.css";

// Poster art for each mini-game — drawn here as SVG rather than shipped as image files:
// it stays on the design tokens (one purple accent on a dark field), scales to any card size,
// and costs no network request. Each game gets the motif its own page already uses, so the
// catalog and the game read as the same thing.
//
// Composition: one big motif centred at y≈185 of a 300×400 poster — large enough to fill the
// card, high enough that the caption's scrim (bottom ~90px) never covers it.
const CX = 150;
const CY = 185;

// 0° = top, growing clockwise (same convention as RouletteWheel).
function slicePath(startDeg: number, endDeg: number, r: number): string {
  const pt = (deg: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return [r * Math.cos(a), r * Math.sin(a)] as const;
  };
  const [x1, y1] = pt(startDeg);
  const [x2, y2] = pt(endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M0 0 L${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`;
}

// Neighbouring dark neutrals — slices separate by value, never by hue.
const SLICE_FILLS = ["#2C2A3A", "#383450", "#232230", "#413B5E", "#2E2B3E"];

function Defs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="0.6" y2="1">
        <stop offset="0%" stopColor="#252334" />
        <stop offset="55%" stopColor="#1B1A21" />
        <stop offset="100%" stopColor="#0F0E14" />
      </linearGradient>
      {/* the single accent glow that lifts the motif off the dark field */}
      <radialGradient id={`glow-${id}`} cx="50%" cy="46%" r="62%">
        <stop offset="0%" stopColor="var(--grad-top)" stopOpacity="0.42" />
        <stop offset="60%" stopColor="var(--grad-top)" stopOpacity="0.10" />
        <stop offset="100%" stopColor="var(--grad-top)" stopOpacity="0" />
      </radialGradient>
      {/* the house accent ramp — same purple→light as the buttons (top-lit) */}
      <linearGradient id={`ramp-${id}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#9A8CFA" />
        <stop offset="55%" stopColor="var(--grad-top)" />
        <stop offset="100%" stopColor="#F4F2FE" />
      </linearGradient>
      {/* a cool→warm radial for round motifs (wheel lead slice, bullseye) — light core, purple rim */}
      <radialGradient id={`orb-${id}`} cx="42%" cy="34%" r="80%">
        <stop offset="0%" stopColor="#EDEAFE" />
        <stop offset="45%" stopColor="#9A8CFA" />
        <stop offset="100%" stopColor="#6D5EE0" />
      </radialGradient>
      {/* soft drop shadow so the motif sits ABOVE the field, not painted on it */}
      <filter id={`sh-${id}`} x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#000000" floodOpacity="0.45" />
      </filter>
      {/* a faint sheen sweeping across the accent, top-left → bottom-right */}
      <linearGradient id={`sheen-${id}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.34" />
        <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0" />
      </linearGradient>
    </defs>
  );
}

export function GameCover({ id }: { id: GameId }) {
  const common = {
    viewBox: "0 0 300 400",
    preserveAspectRatio: "xMidYMid slice",
    className: styles.svg,
    "aria-hidden": true as const,
  };

  if (id === "roulette") {
    // Uneven slices — the wheel's whole point is that shares differ. The largest carries the accent
    // orb; the rest stay neutral. A rim ring + accent halo and a layered hub give it real depth.
    const slices = [
      [0, 104],
      [104, 172],
      [172, 236],
      [236, 292],
      [292, 338],
      [338, 360],
    ] as const;
    const R = 112;
    return (
      <svg {...common}>
        <Defs id="rl" />
        <rect width="300" height="400" fill="url(#bg-rl)" />
        <rect width="300" height="400" fill="url(#glow-rl)" />
        <g transform={`translate(${CX} ${CY})`} filter="url(#sh-rl)">
          {slices.map(([a, b], i) => (
            <path
              key={i}
              d={slicePath(a, b, R)}
              // the biggest share carries the accent — the rest stay neutral
              fill={i === 0 ? "url(#orb-rl)" : SLICE_FILLS[i % SLICE_FILLS.length]}
              stroke="#0F0E14"
              strokeWidth="2.5"
            />
          ))}
          {/* rim: hairline + soft accent halo just outside it */}
          <circle r={R + 3} fill="none" stroke="rgba(235,233,244,.22)" strokeWidth="2.5" />
          <circle r={R + 6} fill="none" stroke="var(--grad-top)" strokeWidth="2" opacity="0.30" />
          {/* axle: layered hub */}
          <circle r="17" fill="#141318" stroke="rgba(235,233,244,.22)" strokeWidth="2.5" />
          <circle r="6" fill="var(--grad-top)" />
        </g>
        {/* pointer — white, with a dark seam so it survives landing on the light slice */}
        <path d={`M${CX} 84 L${CX - 12} 48 Q${CX} 42 ${CX + 12} 48 Z`} fill="#0F0E14" opacity="0.85" />
        <path d={`M${CX} 79 L${CX - 9} 50 Q${CX} 45 ${CX + 9} 50 Z`} fill="var(--text-1)" />
      </svg>
    );
  }

  if (id === "fundraiser") {
    // The crown vessel from the fundraiser page, filling bottom-up toward the goal line. A soft
    // accent pool under it and a sheen on the fill make it a glowing trophy, not a flat icon.
    const crown = "M6 41 L6 14 L16 24 L24 8 L32 24 L42 14 L42 41 Z";
    const top = 8;
    const bottom = 41;
    const h = (bottom - top) * 0.64;
    const S = 5;
    return (
      <svg {...common}>
        <Defs id="fr" />
        <rect width="300" height="400" fill="url(#bg-fr)" />
        <rect width="300" height="400" fill="url(#glow-fr)" />
        {/* the goal: a dashed line at the crown's tips, where the fill is headed */}
        <line x1="46" y1={62.5 + top * S} x2="254" y2={62.5 + top * S} stroke="rgba(235,233,244,.28)" strokeWidth="2" strokeDasharray="6 7" />
        <g transform={`translate(30 62.5) scale(${S})`} filter="url(#sh-fr)">
          <clipPath id="crown-clip-fr">
            <path d={crown} />
          </clipPath>
          {/* unfilled part reads as an empty vessel, not blank card */}
          <path d={crown} fill="#181722" />
          <rect x="0" y={bottom - h} width="48" height={h} clipPath="url(#crown-clip-fr)" fill="url(#ramp-fr)" />
          {/* sheen across the filled portion */}
          <rect x="0" y={bottom - h} width="26" height={h} clipPath="url(#crown-clip-fr)" fill="url(#sheen-fr)" />
          <path d={crown} fill="none" stroke="rgba(235,233,244,.55)" strokeWidth="1.1" strokeLinejoin="round" />
        </g>
      </svg>
    );
  }

  if (id === "auction") {
    // The lot board mid-bidding: bars climbing left to right, the leader carrying the accent —
    // and the gavel's strike marks it as an auction, not a chart.
    const bars = [
      { x: 46, h: 70 },
      { x: 96, h: 104 },
      { x: 146, h: 142 },
      { x: 196, h: 192 },
    ];
    const base = 292;
    return (
      <svg {...common}>
        <Defs id="au" />
        <rect width="300" height="400" fill="url(#bg-au)" />
        <rect width="300" height="400" fill="url(#glow-au)" />
        {/* base line the lots stand on */}
        <line x1="34" y1={base + 1} x2="266" y2={base + 1} stroke="rgba(235,233,244,.14)" strokeWidth="2" />
        <g filter="url(#sh-au)">
          {bars.map((b, i) => {
            const lead = i === bars.length - 1;
            return (
              <g key={i}>
                <rect
                  x={b.x}
                  y={base - b.h}
                  width="36"
                  height={b.h}
                  rx="8"
                  // only the leading lot carries the accent — the rest stay neutral
                  fill={lead ? "url(#ramp-au)" : SLICE_FILLS[i % SLICE_FILLS.length]}
                />
                {lead && <rect x={b.x} y={base - b.h} width="16" height={b.h} rx="8" fill="url(#sheen-au)" />}
              </g>
            );
          })}
        </g>
        {/* the gavel, mid-strike above the leader */}
        <g transform="translate(214 58) rotate(35)" stroke="var(--text-1)" strokeWidth="10" strokeLinecap="round" fill="none" filter="url(#sh-au)">
          <path d="M0 22 L46 22" />
          <path d="M9 2 L9 42" />
          <path d="M24 30 L24 78" strokeWidth="7" opacity="0.7" />
        </g>
      </svg>
    );
  }

  // task — a target: the dare a viewer sets, and the money riding on hitting it.
  // Concentric rings step up in value toward a glowing accent bullseye; a slim dart, already
  // landed, carries the stakes. Rings use a subtle gradient and a soft halo for depth.
  const RINGS = [
    { r: 112, w: 20, fill: "#332F49" },
    { r: 84, w: 20, fill: "#433D63" },
    { r: 56, w: 20, fill: "#564E82" },
  ];
  return (
    <svg {...common}>
      <Defs id="tk" />
      <rect width="300" height="400" fill="url(#bg-tk)" />
      <rect width="300" height="400" fill="url(#glow-tk)" />
      <g transform={`translate(${CX} ${CY})`} filter="url(#sh-tk)">
        {RINGS.map((ring) => (
          <circle key={ring.r} r={ring.r} fill="none" stroke={ring.fill} strokeWidth={ring.w} />
        ))}
        {/* the bullseye — a glowing accent orb, the money riding on the hit */}
        <circle r="30" fill="url(#orb-tk)" />
        <circle r="30" fill="url(#sheen-tk)" />
      </g>
      {/* the dart, already landed just off-centre in the bullseye */}
      <g transform={`translate(${CX + 20} ${CY + 20}) rotate(-45)`} filter="url(#sh-tk)">
        {/* tip */}
        <path d="M0 0 L-6 13 L6 13 Z" fill="var(--text-1)" />
        {/* shaft */}
        <rect x="-2" y="13" width="4" height="70" rx="2" fill="#E8E5F2" />
        {/* flights */}
        <path d="M-2 74 L-13 88 L-2 90 Z" fill="var(--text-1)" opacity="0.9" />
        <path d="M2 74 L13 88 L2 90 Z" fill="var(--text-2)" opacity="0.85" />
      </g>
    </svg>
  );
}

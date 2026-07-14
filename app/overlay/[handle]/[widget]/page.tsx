"use client";

import { useParams, useSearchParams } from "next/navigation";
import { AlertsOverlay, GoalOverlay, TopOverlay } from "@/components/overlays/Overlays";
import { isOverlayKind } from "@/lib/data/overlays";

// /overlay/<handle>/<widget> — a bare page for OBS Browser Source. Transparent background (see
// app/overlay/layout.tsx). ?demo=1 fabricates donations so it's lively without a real donor.
export default function OverlayPage() {
  const params = useParams<{ handle: string; widget: string }>();
  const search = useSearchParams();

  const handle = decodeURIComponent(params.handle || "").replace(/^@/, "");
  const widget = decodeURIComponent(params.widget || "");
  const demo = search.get("demo") === "1";

  if (!isOverlayKind(widget)) {
    return <div style={{ color: "#fff", padding: 24, fontFamily: "system-ui" }}>Unknown overlay: {widget}</div>;
  }

  if (widget === "alerts") return <AlertsOverlay handle={handle} demo={demo} />;
  if (widget === "top") return <TopOverlay handle={handle} demo={demo} />;

  // Parse numeric params by presence + finiteness, not truthiness — so a legitimate 0 isn't dropped
  // to the demo default.
  const num = (key: string): number | undefined => {
    const raw = search.get(key);
    if (raw === null) return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  };
  const title = search.get("title") || undefined;
  return <GoalOverlay handle={handle} demo={demo} title={title} goal={num("goal")} raised={num("raised")} />;
}

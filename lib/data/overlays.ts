// The three OBS overlays (front.md §1, §6). Data-only so both the overlay routes and the cabinet
// Widgets panel iterate the same list. A streamer adds an overlay to OBS as a Browser Source by its URL.

export type OverlayKind = "alerts" | "goal" | "top";

export interface OverlayDef {
  kind: OverlayKind;
  label: string;
  desc: string;
}

export const OVERLAYS: OverlayDef[] = [
  { kind: "alerts", label: "Alerts", desc: "A popup for every new donation — name, amount, message." },
  { kind: "goal", label: "Goal", desc: "A progress bar toward your fundraising goal." },
  { kind: "top", label: "Top donors", desc: "A live leaderboard of your biggest supporters." },
];

export function isOverlayKind(v: string): v is OverlayKind {
  return v === "alerts" || v === "goal" || v === "top";
}

// Default goal for the demo/mock goal overlay (real value will come from the streamer's campaign).
export const DEMO_GOAL = 500;
export const DEMO_GOAL_START = 327;

import type { CSSProperties } from "react";
import type { PageDesign, PageWidget, Profile } from "./types";

export const BIO_MAX = 160;

export const WIDGET_LABEL: Record<PageWidget["kind"], string> = {
  donate: "Donate form",
  socials: "Social icons",
};

export const DEFAULT_WIDGETS: PageWidget[] = [
  { kind: "donate", enabled: true },
  { kind: "socials", enabled: true },
];

export const DEFAULT_DESIGN: PageDesign = {
  background: { type: "color", value: "#141318" },
};

// Neutral, on-charter swatches only (design charter II.1: one purple accent, no gold, no rainbow).
// These change the page BACKDROP, never the accent — the donate button stays Crown purple everywhere.
export const BACKGROUND_COLOR_PRESETS = ["#141318", "#1B1A21", "#101014", "#15181F"];
export const BACKGROUND_GRADIENT_PRESETS: { id: string; label: string; css: string }[] = [
  { id: "dusk", label: "Dusk", css: "linear-gradient(160deg, #1B1A21, #141318 65%)" },
  { id: "violet-wash", label: "Violet wash", css: "linear-gradient(160deg, rgba(139,124,246,.14), #141318 60%)" },
  { id: "deep", label: "Deep", css: "linear-gradient(160deg, #15181F, #0F0E14 70%)" },
];

// Ready-made looks the streamer can pick in one click (the "templates" gallery). On-charter: themes
// differ by BACKDROP only — the donate button and every accent stay Crown purple (design charter II.1).
export const THEMES: { id: string; label: string; design: PageDesign }[] = [
  { id: "midnight", label: "Midnight", design: { background: { type: "color", value: "#141318" } } },
  { id: "slate", label: "Slate", design: { background: { type: "color", value: "#1B1A21" } } },
  { id: "ink", label: "Ink", design: { background: { type: "color", value: "#101014" } } },
  { id: "dusk", label: "Dusk", design: { background: { type: "gradient", value: "dusk" } } },
  { id: "violet", label: "Violet wash", design: { background: { type: "gradient", value: "violet-wash" } } },
  { id: "deep", label: "Deep", design: { background: { type: "gradient", value: "deep" } } },
];

export function sameBackground(a: PageDesign, b: PageDesign): boolean {
  return a.background.type === b.background.type && a.background.value === b.background.value;
}

// Back-fills profiles saved before the page builder shipped, so they render with sane defaults
// instead of undefined widgets/design.
export function withPageDefaults(profile: Profile): Required<Pick<Profile, "avatarEnabled" | "bioEnabled" | "widgets" | "design">> & Profile {
  return {
    ...profile,
    avatarEnabled: profile.avatarEnabled ?? true,
    bioEnabled: profile.bioEnabled ?? true,
    widgets: profile.widgets?.length ? profile.widgets : DEFAULT_WIDGETS,
    design: profile.design ?? DEFAULT_DESIGN,
  };
}

export function backgroundStyle(design: PageDesign): CSSProperties {
  const { type, value } = design.background;
  if (type === "image") return { backgroundImage: `url(${value})`, backgroundSize: "cover", backgroundPosition: "center" };
  if (type === "gradient") {
    const preset = BACKGROUND_GRADIENT_PRESETS.find((g) => g.id === value);
    return { backgroundImage: preset?.css ?? BACKGROUND_GRADIENT_PRESETS[0].css };
  }
  return { background: value || DEFAULT_DESIGN.background.value };
}

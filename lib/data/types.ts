export type DataMode = "mock" | "chain";

export interface Social {
  kind: "youtube" | "twitch" | "kick" | "x" | "tiktok" | "instagram" | "telegram" | "onlyfans";
  url: string;
}

export interface Streamer {
  handle: string; // without "@"
  name: string;
  bio: string;
  address: `0x${string}`; // where donations arrive
  socials: Social[];
  levels: number[]; // level thresholds in dollars, e.g. [10, 100, 1000]
}

export interface Donation {
  id: string;
  from: string; // viewer name (or address)
  amount: number; // in dollars
  message?: string;
  time: string; // human-readable "2 min ago"
  fresh?: boolean;
}

export interface Campaign {
  handle: string;
  slug: string;
  kind: "raise" | "game" | "ask";
  title: string;
  lead: string;
  goal?: number; // goal in dollars (for kind=raise)
  raised: number;
  count: number;
}

export interface DonateInput {
  handle: string;
  amount: number;
  name?: string;
  message?: string;
}

// A block on the streamer's public page that can be toggled on/off and reordered.
export interface PageWidget {
  kind: "donate" | "socials";
  enabled: boolean;
}

export interface PageBackground {
  type: "color" | "gradient" | "image";
  value: string; // hex for "color", preset id for "gradient", data URL for "image"
}

export interface PageDesign {
  background: PageBackground;
}

// Streamer profile (localStorage — the "mock backend"). widgets/design/avatar* are optional so
// profiles saved before the page builder shipped still load — see lib/data/pagebuilder.ts defaults.
export interface Profile {
  handle: string;
  name: string;
  bio: string;
  address: `0x${string}` | "";
  socials: Social[];
  levels: number[];
  avatarEnabled?: boolean;
  avatarUrl?: string; // data URL, mock upload
  bioEnabled?: boolean;
  widgets?: PageWidget[];
  design?: PageDesign;
}

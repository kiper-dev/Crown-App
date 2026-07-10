import type { Streamer, Donation, Campaign } from "./types";
import type { GameId } from "./games";

// One shared mock world (the same one used in the F1 mockups).
export const MOCK_STREAMERS: Record<string, Streamer> = {
  kira: {
    handle: "kira",
    name: "Kira",
    bio: "Indie horrors and cozy co-ops. Streams Tue, Thu, and Sat at 7 PM MSK.",
    address: "0x1111111111111111111111111111111111111111",
    socials: [
      { kind: "twitch", url: "https://twitch.tv/kira" },
      { kind: "youtube", url: "https://youtube.com/@kira" },
      { kind: "telegram", url: "https://t.me/kira" },
    ],
    levels: [10, 100, 1000],
  },
  nova: {
    handle: "nova",
    name: "Nova",
    bio: "Painting digital art live — from sketch to final piece.",
    address: "0x2222222222222222222222222222222222222222",
    socials: [
      { kind: "youtube", url: "https://youtube.com/@nova" },
      { kind: "instagram", url: "https://instagram.com/nova" },
      { kind: "twitch", url: "https://twitch.tv/nova" },
    ],
    levels: [10, 100, 1000],
  },
  glitch: {
    handle: "glitch",
    name: "Glitch",
    bio: "Speedruns and retro platformers, no editing.",
    address: "0x3333333333333333333333333333333333333333",
    socials: [
      { kind: "twitch", url: "https://twitch.tv/glitch" },
      { kind: "kick", url: "https://kick.com/glitch" },
      { kind: "x", url: "https://x.com/glitch" },
    ],
    levels: [10, 100, 1000],
  },
  miradev: {
    handle: "miradev",
    name: "Mira",
    bio: "Live coding: side projects, game dev, Q&A.",
    address: "0x4444444444444444444444444444444444444444",
    socials: [
      { kind: "youtube", url: "https://youtube.com/@miradev" },
      { kind: "telegram", url: "https://t.me/miradev" },
      { kind: "x", url: "https://x.com/miradev" },
    ],
    levels: [10, 100, 1000],
  },
  volk: {
    handle: "volk",
    name: "Wolf",
    bio: "Tactical shooters at night. I queue straight from ranked.",
    address: "0x5555555555555555555555555555555555555555",
    socials: [
      { kind: "twitch", url: "https://twitch.tv/volk" },
      { kind: "kick", url: "https://kick.com/volk" },
      { kind: "telegram", url: "https://t.me/volk" },
    ],
    levels: [10, 100, 1000],
  },
  sonya: {
    handle: "sonya",
    name: "Sonya",
    bio: "Music, karaoke, and cozy home concerts.",
    address: "0x6666666666666666666666666666666666666666",
    socials: [
      { kind: "youtube", url: "https://youtube.com/@sonya" },
      { kind: "tiktok", url: "https://tiktok.com/@sonya" },
      { kind: "instagram", url: "https://instagram.com/sonya" },
    ],
    levels: [10, 100, 1000],
  },
  raidkeeper: {
    handle: "raidkeeper",
    name: "Keeper",
    bio: "MMO raids, guides, and patch breakdowns.",
    address: "0x7777777777777777777777777777777777777777",
    socials: [
      { kind: "twitch", url: "https://twitch.tv/raidkeeper" },
      { kind: "x", url: "https://x.com/raidkeeper" },
      { kind: "youtube", url: "https://youtube.com/@raidkeeper" },
    ],
    levels: [10, 100, 1000],
  },
  pixelira: {
    handle: "pixelira",
    name: "Pixie",
    bio: "Pixel art and chill lo-fi vibes.",
    address: "0x8888888888888888888888888888888888888888",
    socials: [
      { kind: "instagram", url: "https://instagram.com/pixelira" },
      { kind: "tiktok", url: "https://tiktok.com/@pixelira" },
      { kind: "telegram", url: "https://t.me/pixelira" },
    ],
    levels: [10, 100, 1000],
  },
};

// Homepage showcase: per-streamer aggregates (hardcoded in mock,
// will come from the indexer in chain mode). The "crown" goes to whoever donated the most.
export interface RealmStat {
  handle: string; // without "@", the key in MOCK_STREAMERS
  receivedAll: number; // total received, $
  received7d: number; // received over the last 7 days, $
  spark: number[]; // mini-chart points (receipts over time)
  crown: string; // name of whoever holds the crown
}

export const MOCK_REALMS: RealmStat[] = [
  { handle: "kira", receivedAll: 48920, received7d: 3120, crown: "Timur", spark: [12, 10, 14, 13, 18, 16, 22, 20, 26, 24, 30, 28, 34, 33, 40, 44] },
  { handle: "nova", receivedAll: 31450, received7d: 2740, crown: "lesya", spark: [8, 9, 7, 11, 10, 14, 13, 17, 15, 19, 18, 22, 20, 25, 24, 28] },
  { handle: "glitch", receivedAll: 27200, received7d: 4100, crown: "Anonymous", spark: [20, 16, 22, 18, 26, 21, 15, 24, 28, 22, 30, 26, 34, 29, 38, 41] },
  { handle: "miradev", receivedAll: 19880, received7d: 1580, crown: "Dan", spark: [6, 7, 6, 9, 8, 11, 10, 9, 13, 12, 15, 14, 17, 16, 19, 20] },
  { handle: "volk", receivedAll: 15340, received7d: 2210, crown: "Maximus", spark: [14, 12, 16, 13, 18, 20, 15, 22, 19, 24, 21, 26, 23, 28, 25, 30] },
  { handle: "sonya", receivedAll: 11760, received7d: 1890, crown: "anna_k", spark: [9, 11, 10, 13, 12, 15, 14, 16, 15, 18, 17, 20, 19, 21, 20, 23] },
  { handle: "raidkeeper", receivedAll: 8430, received7d: 990, crown: "Whale", spark: [10, 8, 12, 9, 11, 14, 10, 13, 16, 12, 15, 18, 14, 17, 15, 19] },
  { handle: "pixelira", receivedAll: 4275, received7d: 640, crown: "Julia", spark: [4, 5, 4, 6, 5, 7, 6, 8, 7, 9, 8, 10, 9, 11, 10, 12] },
];

export const MOCK_FEED: Donation[] = [
  { id: "d1", from: "Max", amount: 10, message: "For yesterday's stream. That ending was top tier", time: "2 min ago" },
  { id: "d2", from: "anna_k", amount: 5, message: "Hey from Saint Petersburg!", time: "34 min ago" },
  { id: "d3", from: "Anonymous", amount: 1, time: "1 hour ago" },
  { id: "d4", from: "Timur", amount: 50, message: "For the mic. Waiting for that hiss-free sound", time: "3 hours ago" },
  { id: "d5", from: "lesya", amount: 5, message: "Thanks for the cozy streams", time: "yesterday" },
  { id: "d6", from: "Dan", amount: 25, message: "GG on the horror marathon", time: "yesterday" },
];

// A viewer's reputation with a streamer.
export const MOCK_REPUTATION: Record<string, number> = { kira: 42 };

export const MOCK_CAMPAIGNS: Record<string, Campaign> = {
  "kira/mikrofon": {
    handle: "kira",
    slug: "mikrofon",
    kind: "raise",
    title: "Raising for a new microphone",
    lead: "The old one started buzzing — you've heard it. Raising for a Shure MV7 and a stand.",
    goal: 500,
    raised: 327,
    count: 23,
  },
};

// Cabinet data — three periods ("7", "30", "all"). In chain mode this will come from
// the indexer; here it's hardcoded to mock out the cabinet's "Home" screen.
export type DashboardPeriodKey = "7" | "30" | "all";

// Breakdown of donations by source: "direct" is a regular donation with no game, the rest are lib/data/games.GameId.
export interface ByGameRow {
  id: GameId | "direct";
  amount: number;
}

export interface DashboardPeriod {
  received: number;
  donations: number;
  newViewers: number;
  peakLabel: string;
  days: number[]; // chart points for the period (days, or for "all", months)
  peakValue: number;
  axis: string[]; // 3 axis labels
  byGame: ByGameRow[];
}

export const MOCK_DASHBOARD: Record<DashboardPeriodKey, DashboardPeriod> = {
  "7": {
    received: 332,
    donations: 23,
    newViewers: 3,
    peakLabel: "Jul 6 · 84 $",
    days: [38, 56, 84, 30, 64, 18, 42],
    peakValue: 84,
    axis: ["Jul 4", "Jul 7", "Jul 10"],
    byGame: [
      { id: "direct", amount: 258 },
      { id: "task", amount: 46 },
      { id: "roulette", amount: 20 },
      { id: "battles", amount: 8 },
    ],
  },
  "30": {
    received: 1284,
    donations: 96,
    newViewers: 12,
    peakLabel: "Jul 4 · 120 $",
    days: [32, 18, 44, 45, 0, 51, 38, 22, 60, 15, 34, 48, 20, 55, 28, 42, 36, 39, 64, 31, 25, 47, 58, 33, 120, 52, 46, 39, 61, 44, 17],
    peakValue: 120,
    axis: ["Jun 10", "Jun 25", "Jul 10"],
    byGame: [
      { id: "direct", amount: 954 },
      { id: "task", amount: 210 },
      { id: "roulette", amount: 84 },
      { id: "battles", amount: 36 },
    ],
  },
  all: {
    received: 20490,
    donations: 1830,
    newViewers: 640,
    peakLabel: "Jun 2026 · 3,240 $",
    days: [820, 910, 760, 1040, 1180, 1340, 1520, 1890, 2210, 2640, 3240, 2940],
    peakValue: 3240,
    axis: ["Aug 2025", "Feb 2026", "Jul 2026"],
    byGame: [
      { id: "direct", amount: 14400 },
      { id: "task", amount: 3600 },
      { id: "roulette", amount: 1800 },
      { id: "battles", amount: 690 },
    ],
  },
};

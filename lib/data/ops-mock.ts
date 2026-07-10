import type { Social } from "./types";

// Operator panel data — mock (real data will come from crown-app/api + the canister).
// Terms per the charter: streamers (not realms), donations/received (not crowned), viewers (not supporters).

export const OPS_STATS = {
  streamers: 22,
  streamersActive: 22,
  streamersLive: 9,
  received: 720635, // total received, $
  last7d: 9105,
  fee: 21619, // 3% fee, $
  viewers: 24,
  avgPerStreamer: 32756,
  largest: 304335,
};

// Growth: two separate series (one chart = one axis). Money in white, viewers in purple.
export const OPS_GROWTH = {
  received: [12, 34, 58, 96, 150, 205, 250, 300, 355, 400, 430, 470, 505, 540, 560, 590, 610, 630, 650, 665, 678, 690, 700, 706, 712, 716, 719, 720.6],
  viewers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 20, 21, 22, 22, 23, 23, 24, 24],
};

export const OPS_BY_PLATFORM = [
  { kind: "twitch" as Social["kind"], label: "Twitch", value: 559000 },
  { kind: "youtube" as Social["kind"], label: "YouTube", value: 129000 },
  { kind: "tiktok" as Social["kind"], label: "TikTok", value: 24000 },
  { kind: "instagram" as Social["kind"], label: "Instagram", value: 9000 },
];

export const OPS_BY_SIZE = [
  { label: "under $1k", value: 1 },
  { label: "$1k–10k", value: 10 },
  { label: "$10k–100k", value: 10 },
  { label: "$100k+", value: 1 },
];

export const OPS_GAME_ADOPTION = [
  { label: "Tasks", value: 6 },
  { label: "Roulette", value: 0 },
  { label: "Battles", value: 0 },
];

// Tasks (escrow) by status — for the summary.
export const OPS_TASK_STATUS = [
  { label: "Awaiting streamer", value: 3, tone: "wait" as const },
  { label: "In progress", value: 2, tone: "wait" as const },
  { label: "In review", value: 2, tone: "wait" as const },
  { label: "Dispute", value: 1, tone: "attn" as const },
  { label: "Completed", value: 2, tone: "ok" as const },
];

export type StreamerRow = {
  handle: string;
  name: string;
  socials: Social["kind"][];
  received: number;
  d7: number;
  viewers: number;
  live: boolean;
};

export const OPS_STREAMERS: StreamerRow[] = [
  { handle: "raidboss", name: "RAIDBOSS", socials: ["twitch", "kick", "x"], received: 304335, d7: 275, viewers: 8, live: true },
  { handle: "pixelqueen", name: "PIXELQUEEN", socials: ["twitch", "x", "instagram", "telegram"], received: 71805, d7: 1265, viewers: 9, live: false },
  { handle: "latenight", name: "LATE NIGHT", socials: ["twitch", "tiktok"], received: 58065, d7: 485, viewers: 7, live: false },
  { handle: "retroarcade", name: "RETROARCADE", socials: ["twitch", "x", "kick"], received: 44210, d7: 510, viewers: 4, live: true },
  { handle: "novapaints", name: "NOVA", socials: ["youtube", "instagram", "x"], received: 42320, d7: 320, viewers: 5, live: true },
  { handle: "djmix", name: "DJ MIX", socials: ["twitch", "instagram", "tiktok"], received: 36110, d7: 30, viewers: 4, live: false },
  { handle: "flashrun", name: "FLASHRUN", socials: ["twitch", "x", "kick"], received: 31240, d7: 140, viewers: 4, live: false },
  { handle: "petpals", name: "PETPALS", socials: ["tiktok", "instagram", "youtube"], received: 23855, d7: 355, viewers: 4, live: true },
  { handle: "astronyx", name: "ASTRONYX", socials: ["youtube", "twitch", "kick"], received: 18020, d7: 120, viewers: 4, live: false },
  { handle: "lofimira", name: "MIRA", socials: ["youtube", "instagram", "tiktok", "telegram"], received: 16530, d7: 610, viewers: 8, live: false },
  { handle: "devbyte", name: "DEVBYTE", socials: ["youtube", "twitch"], received: 10940, d7: 290, viewers: 7, live: true },
  { handle: "marinacooks", name: "MARINA COOKS", socials: ["youtube", "instagram"], received: 9135, d7: 835, viewers: 6, live: true },
  { handle: "beatlab", name: "BEATLAB", socials: ["youtube", "instagram", "twitch"], received: 8240, d7: 740, viewers: 4, live: false },
  { handle: "paintpal", name: "PAINTPAL", socials: ["youtube", "twitch"], received: 7880, d7: 380, viewers: 3, live: false },
  { handle: "talehunter", name: "TALEHUNTER", socials: ["twitch", "youtube", "kick"], received: 7550, d7: 650, viewers: 4, live: false },
  { handle: "kira", name: "KIRA", socials: ["twitch", "youtube", "telegram"], received: 5830, d7: 90, viewers: 4, live: false },
];

export type TaskStatus = "await" | "progress" | "review" | "dispute" | "vote" | "refund" | "paid";

export const TASK_STATUS_META: Record<TaskStatus, { label: string; tone: "wait" | "attn" | "ok" | "bad"; note?: string }> = {
  await: { label: "Awaiting streamer", tone: "wait" },
  progress: { label: "In progress", tone: "wait" },
  review: { label: "Review window", tone: "wait" },
  dispute: { label: "Dispute", tone: "attn" },
  vote: { label: "Vote", tone: "attn" },
  refund: { label: "Refunded to viewer", tone: "bad", note: "not completed" },
  paid: { label: "Paid to streamer", tone: "ok", note: "completed" },
};

export type TaskRow = {
  date: string;
  handle: string;
  task: string;
  supporter: string;
  amount: number;
  status: TaskStatus;
};

export const OPS_TASKS: TaskRow[] = [
  { date: "Jul 10, 2026", handle: "codegolf", task: "Break down yesterday's one-liner for shortest path.", supporter: "tXPG…W5u4", amount: 10, status: "await" },
  { date: "Jul 9, 2026", handle: "raidboss", task: "Beat the boss using a dance pad — no keyboard, live.", supporter: "S3m2…AK9C", amount: 25, status: "await" },
  { date: "Jul 9, 2026", handle: "rooknroll", task: "Solve today's chess puzzle blindfolded.", supporter: "5mer…1fJg", amount: 10, status: "await" },
  { date: "Jul 8, 2026", handle: "devbyte", task: "Refactor the auth module live and explain every step.", supporter: "cb9a…27qN", amount: 30, status: "progress" },
  { date: "Jul 8, 2026", handle: "codegolf", task: "Golf FizzBuzz down to 60 bytes and explain the tricks.", supporter: "V9UY…H9EY", amount: 35, status: "progress" },
  { date: "Jul 7, 2026", handle: "retroarcade", task: "Clear the first level of Pac-Man on the arcade cabinet.", supporter: "JqhC…n9Kx", amount: 20, status: "review" },
  { date: "Jul 6, 2026", handle: "raidboss", task: "No-damage run through the tutorial zone tonight.", supporter: "NZBv…Cou2", amount: 40, status: "review" },
  { date: "Jul 4, 2026", handle: "flashrun", task: "Any% run of level 1 under 20 seconds, no skips.", supporter: "xMDU…nmDz", amount: 60, status: "dispute" },
  { date: "Jul 1, 2026", handle: "rooknroll", task: "Win a game after opening with the Bongcloud.", supporter: "4Hjz…2qKv", amount: 15, status: "refund" },
  { date: "Jun 28, 2026", handle: "devbyte", task: "Review my open-source PR live and merge it if it's good.", supporter: "XMQk…Xsg4", amount: 50, status: "paid" },
];

export type ViewerRow = {
  addr: string;
  donated: number;
  reputation: number;
  streamers: number;
  last: string;
};

export const OPS_VIEWERS: ViewerRow[] = [
  { addr: "0x7a3f…c21b", donated: 1240, reputation: 1240, streamers: 5, last: "2 min ago" },
  { addr: "0x11de…9f04", donated: 860, reputation: 860, streamers: 3, last: "34 min ago" },
  { addr: "0x9c02…4a7e", donated: 610, reputation: 610, streamers: 4, last: "1 hour ago" },
  { addr: "0x3b88…d5c1", donated: 505, reputation: 505, streamers: 2, last: "3 hours ago" },
  { addr: "0xf27a…8b90", donated: 430, reputation: 430, streamers: 6, last: "today" },
  { addr: "0x62c4…1e3d", donated: 355, reputation: 355, streamers: 2, last: "yesterday" },
  { addr: "0x08a1…7cf2", donated: 290, reputation: 290, streamers: 3, last: "yesterday" },
  { addr: "0xd4e9…2b60", donated: 210, reputation: 210, streamers: 1, last: "2 days ago" },
];

export const PENALTY_LADDER = [
  { n: 1, label: "Hide / remove message", severe: false },
  { n: 2, label: "Block the streamer's page", severe: false },
  { n: 3, label: "Temporarily suspend the page", severe: false },
  { n: 4, label: "Revoke streamer role", severe: true },
  { n: 5, label: "Full wallet block", severe: true },
  { n: 6, label: "Refer to law enforcement", severe: true },
];

export const APPLY_ACTIONS = [
  "Hide message",
  "Block page",
  "Suspend page",
  "Revoke streamer role",
  "Block wallet",
];

// Roulette page helpers — draft defaults and the localStorage mock of the open round,
// mirroring lib/data/fundraiser.ts. Data only, no React. Round mechanics (weighted pick,
// mock seed round, history) stay in lib/data/roulette-mock.ts.

import type { PageWidget, Profile, RouletteDraft } from "./types";
import { isFreshScope } from "./freshScope";
import { DEFAULT_DESIGN } from "./pagebuilder";
import { MOCK_ROUND, MOCK_ROULETTE_HISTORY, type GameGenre, type RouletteRound, type RouletteSuggestion } from "./roulette-mock";

export const RL_HEADLINE_MAX = 140;
export const RL_DESCRIPTION_MAX = 300;
export const MAX_RL_PRESETS = 6;

export const DEFAULT_RL_WIDGETS: PageWidget[] = [
  { kind: "donate", enabled: true },
  { kind: "socials", enabled: true },
];

export const DEFAULT_RL_PRESETS: number[] = [5, 10, 25];

export const DEFAULT_ROULETTE: RouletteDraft = {
  headline: "",
  description: "",
  descriptionEnabled: true,
  presets: DEFAULT_RL_PRESETS,
  widgets: DEFAULT_RL_WIDGETS,
  design: DEFAULT_DESIGN,
};

// Back-fills drafts saved before the roulette builder existed (same idea as withPageDefaults).
export function withRouletteDefaults(profile: Profile): RouletteDraft {
  const rl = profile.roulette;
  return {
    ...DEFAULT_ROULETTE,
    ...rl,
    presets: rl?.presets?.length ? rl.presets : DEFAULT_RL_PRESETS,
    widgets: rl?.widgets?.length ? rl.widgets : DEFAULT_RL_WIDGETS,
    design: rl?.design ?? DEFAULT_DESIGN,
  };
}

// ---- mock open round (localStorage, like the rest of the mock backend) ----
// The real round will live on crown-app/api; until then the public page starts from the
// seeded MOCK_ROUND and viewer suggestions accumulate on top, merged by game title —
// backing an existing suggestion grows its pool (and odds), a new title adds a slice.

const ROUND_KEY = "crown-roulette-round";

interface LocalSuggestion {
  title: string;
  genre: GameGenre;
  pool: number;
  backers: number;
}

function readLocal(handle: string): LocalSuggestion[] {
  try {
    const raw = localStorage.getItem(`${ROUND_KEY}:${handle}`);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function readRound(handle: string): RouletteSuggestion[] {
  // A fresh session starts with an empty wheel — the seeded round belongs to the first scope only.
  const merged: RouletteSuggestion[] = isFreshScope(handle) ? [] : MOCK_ROUND.map((s) => ({ ...s }));
  for (const l of readLocal(handle)) {
    const hit = merged.find((s) => s.title.toLowerCase() === l.title.toLowerCase());
    if (hit) {
      hit.pool += l.pool;
      hit.backers += l.backers;
    } else {
      merged.push({ id: `local-${l.title.toLowerCase()}`, title: l.title, genre: l.genre, pool: l.pool, backers: l.backers, suggestedBy: "you" });
    }
  }
  return merged.sort((a, b) => b.pool - a.pool);
}

export function addSuggestion(handle: string, title: string, genre: GameGenre, amount: number): RouletteSuggestion[] {
  const local = readLocal(handle);
  const hit = local.find((s) => s.title.toLowerCase() === title.toLowerCase());
  if (hit) {
    hit.pool += amount;
    hit.backers += 1;
  } else {
    local.push({ title, genre, pool: amount, backers: 1 });
  }
  try {
    localStorage.setItem(`${ROUND_KEY}:${handle}`, JSON.stringify(local));
  } catch {}
  return readRound(handle);
}

// ---- round lifecycle (mock) ----
// The round clock starts when the page is first opened and the wheel spins either when the
// clock runs out or when the streamer hits "Spin now" — время вышло / решение КМ. The verdict
// is stored so the streamer's cabinet and the public page converge on the same winner.

export interface RoundMeta {
  startedAt: number; // epoch ms — the round clock's zero
  winner: { id: string; title: string } | null; // set once the wheel lands
  // Who gets to PUT a game on the wheel — everyone-by-donating (classic), or free for viewers
  // at minTier and above (the КМ picks the tier when the session is created). Backing an
  // existing suggestion is a donation in both modes.
  mode?: "donate" | "rank";
  minTier?: string;
}

const META_KEY = "crown-roulette-meta";

export function readRoundMeta(handle: string): RoundMeta | null {
  try {
    const raw = localStorage.getItem(`${META_KEY}:${handle}`);
    if (!raw) return null;
    const meta = JSON.parse(raw);
    return typeof meta?.startedAt === "number"
      ? { startedAt: meta.startedAt, winner: meta.winner ?? null, mode: meta.mode, minTier: meta.minTier }
      : null;
  } catch {
    return null;
  }
}

function writeMeta(handle: string, meta: RoundMeta) {
  try {
    localStorage.setItem(`${META_KEY}:${handle}`, JSON.stringify(meta));
  } catch {}
}

// Open a round with its mode — called when the session is created. Classic sessions never call
// this and fall through to ensureRound's default (donate).
export function initRound(handle: string, opts: { mode: "donate" | "rank"; minTier?: string }): RoundMeta {
  const fresh: RoundMeta = { startedAt: Date.now(), winner: null, mode: opts.mode, minTier: opts.minTier };
  writeMeta(handle, fresh);
  return fresh;
}

// Returns the current round, starting its clock on first sight.
export function ensureRound(handle: string): RoundMeta {
  const meta = readRoundMeta(handle);
  if (meta) return meta;
  const fresh: RoundMeta = { startedAt: Date.now(), winner: null };
  writeMeta(handle, fresh);
  return fresh;
}

export function setRoundWinner(handle: string, winner: { id: string; title: string }): RoundMeta {
  const meta = ensureRound(handle);
  const next: RoundMeta = { ...meta, winner };
  writeMeta(handle, next);
  return next;
}

// Fresh round: clears the local suggestions and the verdict, restarts the clock.
export function newRound(handle: string): RoundMeta {
  try {
    localStorage.removeItem(`${ROUND_KEY}:${handle}`);
  } catch {}
  const prev = readRoundMeta(handle);
  const fresh: RoundMeta = { startedAt: Date.now(), winner: null, mode: prev?.mode, minTier: prev?.minTier };
  writeMeta(handle, fresh);
  return fresh;
}

// ---- played history (mock) ----
// Every round that actually spins gets recorded here, newest-first, so the cabinet's History
// tab reflects real rounds instead of a frozen sample. MOCK_ROULETTE_HISTORY trails behind as
// seeded "older" rounds so a new streamer's table isn't empty.

const HISTORY_KEY = "crown-roulette-history";

function readLocalHistory(handle: string): RouletteRound[] {
  try {
    const raw = localStorage.getItem(`${HISTORY_KEY}:${handle}`);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function readHistory(handle: string): RouletteRound[] {
  return [...readLocalHistory(handle), ...MOCK_ROULETTE_HISTORY];
}

export function appendHistory(handle: string, entry: RouletteRound): RouletteRound[] {
  const next = [entry, ...readLocalHistory(handle)].slice(0, 50);
  try {
    localStorage.setItem(`${HISTORY_KEY}:${handle}`, JSON.stringify(next));
  } catch {}
  return next;
}

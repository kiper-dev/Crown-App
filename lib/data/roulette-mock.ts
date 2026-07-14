// Mock data for the Roulette game — viewers suggest a game to play by donating toward it, then
// a weighted spin picks one (front.md I §5: the game is a front-end layer, donations are plain
// donations). No backend yet — this seeds the cabinet's Overview/History tabs.

export const GAME_GENRES = ["Action", "Shooter", "Strategy", "RPG", "Sports", "Horror", "Party", "Simulation", "Racing", "Other"] as const;
export type GameGenre = (typeof GAME_GENRES)[number];

export interface RouletteSuggestion {
  id: string;
  title: string;
  genre: GameGenre;
  pool: number; // $ total backing this suggestion
  backers: number; // distinct donors
  suggestedBy: string; // whoever proposed it first
}

// The open round: what viewers have suggested and backed so far.
export const MOCK_ROUND: RouletteSuggestion[] = [
  { id: "s1", title: "Warcraft III", genre: "Strategy", pool: 1000, backers: 6, suggestedBy: "Timur" },
  { id: "s2", title: "Fortnite", genre: "Shooter", pool: 500, backers: 4, suggestedBy: "anna_k" },
  { id: "s3", title: "Dota 2", genre: "Strategy", pool: 100, backers: 2, suggestedBy: "Dan" },
];

export interface RouletteRound {
  id: string;
  date: string;
  winner: string;
  genre: GameGenre;
  pot: number;
  entries: number;
  playedMinutes: number;
}

export const MOCK_ROULETTE_HISTORY: RouletteRound[] = [
  { id: "r1", date: "Jul 10, 2026", winner: "Elden Ring", genre: "RPG", pot: 820, entries: 4, playedMinutes: 90 },
  { id: "r2", date: "Jul 6, 2026", winner: "Warcraft III", genre: "Strategy", pot: 640, entries: 3, playedMinutes: 60 },
  { id: "r3", date: "Jun 30, 2026", winner: "Fortnite", genre: "Shooter", pot: 410, entries: 5, playedMinutes: 45 },
];

// Weighted-random pick — pool share = odds. Mirrors what the real spin will do server-side
// later; kept pure (rand passed in) so the Overview tab can demo it client-side with no backend.
export function pickWeighted(rows: RouletteSuggestion[], rand: number): RouletteSuggestion | null {
  const total = rows.reduce((sum, r) => sum + r.pool, 0);
  if (!total) return null;
  let acc = 0;
  const target = rand * total;
  for (const r of rows) {
    acc += r.pool;
    if (target <= acc) return r;
  }
  return rows[rows.length - 1];
}

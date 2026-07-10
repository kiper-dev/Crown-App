// Mini-games catalog — data, and only data (no React/logic), so it can be imported anywhere:
// the /games page, the homepage teaser, later — cabinet settings. Adding a game = adding a row here;
// the UI iterates this list instead of hardcoding each game.
//
// Games are a layer on top of donations (front.md §5–6): money and reputation travel the same path,
// the game just sets the moment. None are built yet — all are in "building" status (shown as "Soon" in the catalog).

export type GameId = "task" | "roulette" | "battles";

// building — still under construction: shown in the catalog as "Soon", can't be enabled on a streamer's page.
// available — can be enabled.
export type GameStatus = "building" | "available";

export interface GameModule {
  id: GameId;
  title: string; // UI name
  tagline: string; // one line — what it is, for the catalog card
  status: GameStatus;
}

export const GAMES: readonly GameModule[] = [
  {
    id: "task",
    title: "Task for donation",
    tagline: "A paid task for a viewer: complete it — the money's theirs; miss it — it's returned.",
    status: "building",
  },
  {
    id: "roulette",
    title: "Roulette",
    tagline: "A live wheel picks one viewer to the center — reputation gives you weight, not luck.",
    status: "building",
  },
  {
    id: "battles",
    title: "Battles",
    tagline: "Two streamers face off — viewers rally behind their favorite.",
    status: "building",
  },
];

export function getGame(id: GameId): GameModule | undefined {
  return GAMES.find((g) => g.id === id);
}

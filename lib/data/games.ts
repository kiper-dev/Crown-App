// Mini-games catalog — data, and only data (no React/logic), so it can be imported anywhere:
// the /games page, the homepage teaser, later — cabinet settings. Adding a game = adding a row here;
// the UI iterates this list instead of hardcoding each game.
//
// Games are a layer on top of donations (front.md §5–6): money and reputation travel the same path,
// the game just sets the moment. None are built yet — all are in "building" status (shown as "Soon" in the catalog).

export type GameId = "task" | "roulette" | "fundraiser";

// building — still under construction: shown in the catalog as "Soon", can't be enabled on a streamer's page.
// available — can be enabled.
export type GameStatus = "building" | "available";

export interface GameModule {
  id: GameId;
  title: string; // UI name
  tagline: string; // one line — what it is, for the catalog card
  status: GameStatus;
  // The next three are only filled in once a game actually has its own page (hasPage: true) —
  // no description/steps written ahead of the page that would show them (post-front.md discipline).
  hasPage?: boolean;
  description?: string; // longer paragraph, for the detail page hero
  howItWorks?: string[]; // 2–4 short steps, detail page
  coverUrl?: string; // a real screenshot, once one exists; unset falls back to the icon placeholder
}

export const GAMES: readonly GameModule[] = [
  {
    id: "task",
    title: "Task for donation",
    tagline: "A paid task for a viewer: complete it — the money's theirs; miss it — it's returned.",
    status: "building",
    hasPage: true,
    description:
      "A viewer pays to set you a task — a dare, a request, a challenge, whatever you allow. The money sits in escrow, not in anyone's pocket: complete the task and the payout — plus reputation — goes to the viewer who set it; miss the deadline and it's returned to them automatically. Crown never holds the funds in between.",
    howItWorks: [
      "A viewer pays a task amount, at or above the minimum you set",
      "You complete it on stream, on your own terms",
      "The verdict releases the money automatically, on-chain — to you if it's done, back to the viewer if the deadline passes",
    ],
  },
  {
    id: "roulette",
    title: "Roulette",
    tagline: "Viewers pitch a game by donating to it — the wheel spins, weighted by the pool.",
    status: "building",
    hasPage: true,
    description:
      "Anyone can suggest a game by donating toward it — Warcraft, Dota, Fortnite, whatever they want to watch. Backers can stack donations on the same suggestion, growing its pool. When the round closes, the wheel spins: each suggestion's odds match its share of the pot, not just its rank. Whatever wins, you play it for the time you committed to. Money on the suggestions that don't win isn't refunded — it's a donation either way.",
    howItWorks: [
      "Viewers suggest any game by donating toward it, at or above the minimum you set",
      "Others can back the same suggestion — its pool grows, and so do its odds",
      "When the round closes, the wheel spins, weighted by each suggestion's share of the pot",
      "You play the winner for the time you committed to; the rest of the pot stays donated, not refunded",
    ],
  },
  {
    id: "fundraiser",
    title: "Fundraiser",
    tagline: "Viewers chip in toward a goal — deliver it, or everyone gets their money back.",
    status: "building",
    hasPage: true,
    description:
      "You open a fundraiser with a promise: \"if we collect this much, I'll do this\" — a special video, a marathon stream, whatever you commit to. Viewers chip in, and every contribution sits in its own escrow the whole time; nobody holds the money. Deliver on the promise and the pot goes to you, with every backer earning reputation for exactly what they put in. Don't deliver — even if the goal was fully met — and everyone is refunded to the cent. Nobody can ever earn more than they contributed.",
    howItWorks: [
      "You open a fundraiser: what you'll do, the goal, and how long the collection runs",
      "Viewers chip in — each contribution locks in escrow, and the total grows in the open",
      "You accept the amount (the full goal, or less if you agree) and deliver within the window you promised",
      "Your reputation holders confirm delivery: yes — the money is yours and backers earn reputation; no, or silence — everyone gets their money back",
    ],
  },
];

// Accepts a plain string so route params (always string) can be looked up directly,
// without callers needing to prove the id is a valid GameId before asking.
export function getGame(id: string): GameModule | undefined {
  return GAMES.find((g) => g.id === id);
}

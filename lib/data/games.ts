// Mini-games catalog — data, and only data (no React/logic), so it can be imported anywhere:
// the /games page, the homepage teaser, later — cabinet settings. Adding a game = adding a row here;
// the UI iterates this list instead of hardcoding each game.
//
// Games are a layer on top of donations (front.md §5–6): money and reputation travel the same path,
// the game just sets the moment. None are built yet — all are in "building" status (never surfaced as a label).

export type GameId = "task" | "roulette" | "fundraiser" | "auction";

// building — still under construction: shows only as a dim dot in the cabinet, never as a label.
// available — can be enabled.
export type GameStatus = "building" | "available";

// One knob the streamer owns. Every game page renders these the same way, and the same labels
// appear inside the rules text wrapped in [[…]] — so "what I control" is never guesswork.
export interface GameControl {
  label: string; // the knob's name, e.g. "Minimum amount"
  example: string; // a plausible value, shown in the demo panel, e.g. "$5"
  hint: string; // one short line — what it changes, in plain words
}

// A headline fact about the game — three of these replace the opening wall of prose, so the page
// answers "what's in it for me" before anyone has to read a paragraph.
export interface GamePitch {
  label: string; // the question being answered, e.g. "You get"
  value: string; // the answer, short enough to read at a glance
}

export interface GameModule {
  id: GameId;
  title: string; // UI name
  tagline: string; // one line — what it is, for the catalog card
  status: GameStatus;
  pitch?: GamePitch[]; // 3 headline facts, shown as cards at the top of the page
  // The next three are only filled in once a game actually has its own page (hasPage: true) —
  // no description/steps written ahead of the page that would show them (post-front.md discipline).
  hasPage?: boolean;
  description?: string; // longer paragraph, for the detail page hero
  howItWorks?: string[]; // 2–4 short steps, detail page
  coverUrl?: string; // a real screenshot, once one exists; unset falls back to the icon placeholder
  // The rules of the game, one line each. Anything the streamer sets is written in [[double
  // brackets]] — the page renders those inline as marked, editable-looking chips, so reading the
  // rules tells you exactly which parts are yours to decide. Keep bracket text identical to a
  // control's label + value where they refer to the same knob.
  rules?: string[];
  controls?: GameControl[]; // the streamer's knobs, listed in the demo panel
}

export const GAMES: readonly GameModule[] = [
  {
    id: "task",
    title: "Task for donation",
    tagline: "A paid task for a viewer: complete it — the money's theirs; miss it — it's returned.",
    status: "building",
    pitch: [
      { label: "You get", value: "Paid for doing the thing you'd do anyway" },
      { label: "The viewer gets", value: "To pick the moment — and reputation for it" },
      { label: "The risk", value: "None. Miss it and their money just goes back" },
    ],
    hasPage: true,
    description:
      "A viewer pays to set you a task — a dare, a request, a challenge, whatever you allow. The money sits in escrow, not in anyone's pocket: complete the task and the payout — plus reputation — goes to the viewer who set it; miss the deadline and it's returned to them automatically. Crown never holds the funds in between.",
    howItWorks: [
      "A viewer pays a task amount, at or above the minimum you set",
      "You complete it on stream, on your own terms",
      "The verdict releases the money automatically, on-chain — to you if it's done, back to the viewer if the deadline passes",
    ],
    rules: [
      "A viewer offers a task and pays at least [[$5 minimum]] to set it.",
      "Only viewers with [[10+ reputation]] with you can offer one — it keeps strangers out.",
      "The money locks in escrow the moment it's offered. Nobody holds it — not the viewer, not you, not Crown.",
      "You see the task text first and decide: accept it or turn it down. Turn it down and the viewer is refunded in full.",
      "Accept, and the task goes public with a countdown — the viewer picks how long you get, within your [[6h–3d window]].",
      "Complete it and the money is yours, plus the viewer earns reputation. Miss the deadline and it returns to them automatically.",
    ],
    controls: [
      { label: "Minimum amount", example: "$5", hint: "The least a viewer can pay to set you a task." },
      { label: "Minimum reputation", example: "10", hint: "How well a viewer must know you before they can offer one." },
      { label: "Time window", example: "6h – 3d", hint: "The range a viewer can pick a deadline from." },
      { label: "On / off", example: "On", hint: "Turn the whole game off on your page at any time." },
    ],
  },
  {
    id: "roulette",
    title: "Roulette",
    tagline: "Viewers pitch a game by donating to it — the wheel spins, weighted by the pool.",
    status: "building",
    pitch: [
      { label: "You get", value: "The whole pot — winners and losers both" },
      { label: "The viewer gets", value: "Real odds on the game they want to see" },
      { label: "The catch", value: "You play whatever wins. That's the deal" },
    ],
    hasPage: true,
    description:
      "Anyone can suggest a game by donating toward it — Warcraft, Dota, Fortnite, whatever they want to watch. Backers can stack donations on the same suggestion, growing its pool. When the round closes, the wheel spins: each suggestion's odds match its share of the pot, not just its rank. Whatever wins, you play it for the time you committed to. Money on the suggestions that don't win isn't refunded — it's a donation either way.",
    howItWorks: [
      "Viewers suggest any game by donating toward it, at or above the minimum you set",
      "Others can back the same suggestion — its pool grows, and so do its odds",
      "When the round closes, the wheel spins, weighted by each suggestion's share of the pot",
      "You play the winner for the time you committed to; the rest of the pot stays donated, not refunded",
    ],
    rules: [
      "You open a round and promise to play the winner for [[2 hours]].",
      "Any viewer suggests a game by donating at least [[$3 per suggestion]] toward it.",
      "Others stack donations on the same suggestion — its pool grows, and so do its odds.",
      "The round stays open for [[30 minutes]], or until you close it yourself.",
      "The wheel spins weighted by the pot: a suggestion with half the money has half the odds — no rank, no jury.",
      "Every donation is a donation — money on the suggestions that lose isn't refunded, and all of it is yours.",
    ],
    controls: [
      { label: "Minimum per suggestion", example: "$3", hint: "The least a viewer pays to put a game on the wheel." },
      { label: "Round length", example: "30 min", hint: "How long viewers can suggest and back games." },
      { label: "What you promise", example: "2 hours of play", hint: "How long you'll play whatever wins." },
      { label: "On / off", example: "On", hint: "Turn the whole game off on your page at any time." },
    ],
  },
  {
    id: "fundraiser",
    title: "Fundraiser",
    tagline: "Viewers chip in toward a goal — deliver it, or everyone gets their money back.",
    status: "building",
    pitch: [
      { label: "You get", value: "The gear, the trip, the thing — funded up front" },
      { label: "The viewer gets", value: "Their money back if you don't deliver" },
      { label: "The catch", value: "You promise it, your viewers confirm it" },
    ],
    hasPage: true,
    description:
      "You open a fundraiser with a promise: \"if we collect this much, I'll do this\" — a special video, a marathon stream, whatever you commit to. Viewers chip in, and every contribution sits in its own escrow the whole time; nobody holds the money. Deliver on the promise and the pot goes to you, with every backer earning reputation for exactly what they put in. Don't deliver — even if the goal was fully met — and everyone is refunded to the cent. Nobody can ever earn more than they contributed.",
    howItWorks: [
      "You open a fundraiser: what you'll do, the goal, and how long the collection runs",
      "Viewers chip in — each contribution locks in escrow, and the total grows in the open",
      "You accept the amount (the full goal, or less if you agree) and deliver within the window you promised",
      "Your reputation holders confirm delivery: yes — the money is yours and backers earn reputation; no, or silence — everyone gets their money back",
    ],
    rules: [
      "You open a fundraiser with a promise: [[\"New stream setup\"]] — whatever you commit to do.",
      "You set the goal at [[$2,000]] and the collection runs for [[14 days]].",
      "Viewers chip in any amount from [[$1]] up. Every contribution sits in its own escrow the whole time.",
      "You accept the amount — the full goal, or less if you agree to deliver for it anyway.",
      "Deliver within [[7 days]] of accepting, and your reputation holders confirm it.",
      "Confirmed: the pot is yours, every backer earns reputation for exactly what they put in. Not confirmed, or you don't deliver: everyone is refunded to the cent — even if the goal was met.",
    ],
    controls: [
      { label: "The promise", example: "New stream setup", hint: "What you'll do if the goal is reached." },
      { label: "Goal", example: "$2,000", hint: "How much you're collecting toward it." },
      { label: "Collection window", example: "14 days", hint: "How long viewers can chip in." },
      { label: "Delivery window", example: "7 days", hint: "How long you get to deliver after accepting." },
    ],
  },
  {
    id: "auction",
    title: "Auction",
    tagline: "Viewers bid tasks with money — the richest lot you accept wins your time.",
    status: "building",
    pitch: [
      { label: "You get", value: "Top dollar for one task — you pick which lots even compete" },
      { label: "The viewer gets", value: "To outbid rivals for the thing they want to see" },
      { label: "The catch", value: "Your reputation holders confirm you delivered" },
    ],
    hasPage: true,
    description:
      "A viewer names their price and their condition — a dare, a request, anything you allow. The text stays private to you until you accept the lot; accept it and it goes public, and anyone can top it up to push it higher. When the bidding closes, the richest accepted lot wins and every other lot is refunded instantly. Deliver the winning condition, your reputation holders confirm it — and the money is yours, with every backer of the winning lot earning reputation for exactly what they put in.",
    howItWorks: [
      "A viewer places a lot: money in escrow plus a condition only you can read",
      "You accept the lots you're willing to do — accepted texts go public and open for top-ups",
      "Bidding closes: the richest accepted lot wins, all the others are refunded instantly",
      "Deliver it, your reputation holders confirm — the money is yours, backers earn reputation",
    ],
    rules: [
      "A viewer places a lot: at least [[$5 minimum]] in escrow plus a condition text.",
      "The text is private to you until you accept it — accept, and it goes public into the bidding. Turn it down and the money goes back.",
      "Anyone can top up an accepted lot — their own escrow joins it, the lot climbs the board.",
      "Bidding runs for [[24 hours]]. When it closes, the richest accepted lot wins; every other lot is refunded on the spot.",
      "You deliver the winning condition within [[48 hours]] and hit Done — then your reputation holders vote on whether you did.",
      "Confirmed: the money is yours, every backer of the lot earns reputation for their share. Not confirmed, or you miss the window: everyone is refunded.",
    ],
    controls: [
      { label: "Minimum bid", example: "$5", hint: "The least a single bid can put into a lot." },
      { label: "Bidding window", example: "24h", hint: "How long viewers can place and top up lots." },
      { label: "Time to deliver", example: "48h", hint: "Your window to do the winning condition after the final." },
      { label: "On / off", example: "On", hint: "Turn the whole game off on your page at any time." },
    ],
  },
];

// Accepts a plain string so route params (always string) can be looked up directly,
// without callers needing to prove the id is a valid GameId before asking.
export function getGame(id: string): GameModule | undefined {
  return GAMES.find((g) => g.id === id);
}

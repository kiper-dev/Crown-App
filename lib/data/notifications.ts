// Notifications for the streamer — data and rules only, no React, so the bell, a future settings
// panel and (later) the real backend feed all agree on what a notification is.
//
// Urgency is the whole design here. Everything that can cost the streamer money is "action";
// everything else must never be allowed to bury it. Only "action" may ever push (front.md §4:
// the front promises nothing it can't keep — a notification that money "will" arrive is a lie,
// one that says it HAS arrived is a fact).

export type NotifUrgency =
  | "action" // needs a decision or money is lost — the only kind allowed to push
  | "money" // money moved, in or out — a fact, after the fact
  | "nice" // pleasant, never urgent — bell only
  | "digest" // periodic summary
  | "system"; // something is broken and needs fixing

export type NotifKind =
  // action
  | "task_offered"
  | "task_deadline_soon"
  | "task_expiring"
  | "roulette_closing"
  | "auction_lot_offered"
  | "auction_closing"
  | "fundraiser_goal_hit"
  | "fundraiser_delivery_due"
  | "vote_started"
  // money
  | "payout"
  | "task_refunded"
  | "fundraiser_refunded"
  | "roulette_settled"
  | "auction_settled"
  // nice
  | "donation"
  | "big_donation"
  | "rank_up"
  | "first_donation"
  | "record"
  // digest
  | "stream_summary"
  | "week_summary"
  // system
  | "wallet_problem"
  | "game_disabled";

export interface Notif {
  id: string;
  kind: NotifKind;
  urgency: NotifUrgency;
  title: string;
  body: string;
  at: number; // ms since epoch
  read: boolean;
  href?: string; // where the notification takes you — the cabinet section that acts on it
  amount?: number; // shown as a figure when the notification is about money
  deadline?: number; // ms since epoch — renders as a live countdown
}

export const URGENCY_OF: Record<NotifKind, NotifUrgency> = {
  task_offered: "action",
  task_deadline_soon: "action",
  task_expiring: "action",
  roulette_closing: "action",
  auction_lot_offered: "action",
  auction_closing: "action",
  fundraiser_goal_hit: "action",
  fundraiser_delivery_due: "action",
  vote_started: "action",
  payout: "money",
  task_refunded: "money",
  fundraiser_refunded: "money",
  roulette_settled: "money",
  auction_settled: "money",
  donation: "nice",
  big_donation: "nice",
  rank_up: "nice",
  first_donation: "nice",
  record: "nice",
  stream_summary: "digest",
  week_summary: "digest",
  wallet_problem: "system",
  game_disabled: "system",
};

// Group labels for the bell. Kept short — the list is scanned, not read.
export const URGENCY_LABEL: Record<NotifUrgency, string> = {
  action: "Needs you",
  money: "Money",
  nice: "Good news",
  digest: "Summary",
  system: "Fix this",
};

export function isActionable(n: Notif) {
  return URGENCY_OF[n.kind] === "action";
}

// "in 4h 20m" / "in 12m" / "expired" — a deadline is only useful as time remaining.
export function timeLeft(deadline: number, now: number): string {
  const ms = deadline - now;
  if (ms <= 0) return "expired";
  const mins = Math.floor(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h >= 24) return `in ${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `in ${h}h ${m}m`;
  return `in ${m}m`;
}

// "2m ago" / "3h ago" / "yesterday"
export function timeAgo(at: number, now: number): string {
  const mins = Math.floor((now - at) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "yesterday" : `${d}d ago`;
}

// The mock feed — one of every kind in the list, so the bell shows the real spread of urgencies.
// Offsets are relative to "now" and resolved at read time (see seedNotifications).
const SEED: (Omit<Notif, "id" | "at" | "read" | "urgency"> & { agoMin: number; inMin?: number })[] = [
  {
    kind: "task_offered",
    title: "toffi offers you a task — $50",
    body: "“Beat the boss with no armor on.” Accept it or turn it down.",
    amount: 50,
    agoMin: 4,
    inMin: 320,
    href: "/space",
  },
  {
    kind: "fundraiser_delivery_due",
    title: "Deliver the fundraiser — $2,000",
    body: "“New stream setup.” Miss the window and every backer is refunded.",
    amount: 2000,
    agoMin: 50,
    inMin: 4320,
    href: "/space",
  },
  {
    kind: "task_expiring",
    title: "A task expires soon — $30",
    body: "“Play one round blindfolded.” Decide now or the money goes back.",
    amount: 30,
    agoMin: 62,
    inMin: 55,
    href: "/space",
  },
  {
    kind: "auction_lot_offered",
    title: "New auction lot — $60",
    body: "Private until you accept: “Finish the map on the hardest difficulty.”",
    amount: 60,
    agoMin: 9,
    inMin: 460,
    href: "/space",
  },
  {
    kind: "auction_closing",
    title: "Auction bell in 30m — $120 leads",
    body: "“Hardest difficulty, no saves” is on top. 3 lots in play.",
    amount: 120,
    agoMin: 40,
    inMin: 30,
    href: "/space",
  },
  {
    kind: "auction_settled",
    title: "Auction paid out — $120",
    body: "The vote confirmed delivery. Every backer of the lot earned reputation.",
    amount: 120,
    agoMin: 260,
  },
  {
    kind: "roulette_closing",
    title: "Your roulette round closes",
    body: "$1,600 in the pot, 3 games suggested. Time to spin.",
    amount: 1600,
    agoMin: 75,
    inMin: 12,
    href: "/space",
  },
  {
    kind: "vote_started",
    title: "Your viewers are voting",
    body: "They're confirming whether you delivered “New stream setup”.",
    agoMin: 96,
    href: "/space",
  },
  {
    kind: "fundraiser_goal_hit",
    title: "Goal reached — $2,000",
    body: "“New stream setup” is fully funded. Accept it and deliver.",
    amount: 2000,
    agoMin: 130,
    href: "/space",
  },
  {
    kind: "task_deadline_soon",
    title: "2 hours left on a task — $50",
    body: "“Beat the boss with no armor on.”",
    amount: 50,
    agoMin: 140,
    inMin: 120,
    href: "/space",
  },
  {
    kind: "payout",
    title: "$50 landed in your wallet",
    body: "Task completed — toffi earned +50 reputation with you.",
    amount: 50,
    agoMin: 180,
  },
  {
    kind: "roulette_settled",
    title: "Warcraft III won the round",
    body: "All $1,600 is yours. You play it for 2 hours.",
    amount: 1600,
    agoMin: 220,
  },
  {
    kind: "task_refunded",
    title: "Task expired — $30 returned",
    body: "“Play one round blindfolded” wasn't done in time.",
    amount: 30,
    agoMin: 300,
  },
  {
    kind: "fundraiser_refunded",
    title: "$2,000 refunded to 40 backers",
    body: "The delivery wasn't confirmed, so everyone got their money back.",
    amount: 2000,
    agoMin: 1500,
  },
  {
    kind: "big_donation",
    title: "mira.eth donated $250",
    body: "“keep going, this stream is unreal”",
    amount: 250,
    agoMin: 25,
  },
  {
    kind: "rank_up",
    title: "mira.eth reached Legend",
    body: "Your top tier. She's put in $1,400 all-time.",
    agoMin: 33,
  },
  {
    kind: "first_donation",
    title: "n0va donated for the first time",
    body: "$15 — say hi on stream.",
    amount: 15,
    agoMin: 210,
  },
  {
    kind: "record",
    title: "Best day ever — $340",
    body: "Your previous record was $290, three weeks ago.",
    amount: 340,
    agoMin: 400,
  },
  {
    kind: "stream_summary",
    title: "Last stream: $420",
    body: "12 donations · 3 tasks · 1 roulette round.",
    amount: 420,
    agoMin: 700,
  },
  {
    kind: "week_summary",
    title: "This week: $1,840",
    body: "Up 22% on last week. Top supporter: mira.eth.",
    amount: 1840,
    agoMin: 2880,
  },
  {
    kind: "wallet_problem",
    title: "A payout didn't go through",
    body: "Your wallet didn't respond. Check it and we'll retry.",
    agoMin: 340,
    href: "/space",
  },
  {
    kind: "game_disabled",
    title: "Task for donation turned itself off",
    body: "Too many expired tasks in a row. Turn it back on when you're ready.",
    agoMin: 1200,
    href: "/space",
  },
];

// Builds the feed against a caller-supplied `now`, so nothing here depends on module-load time
// (which would drift, and would differ between server render and hydration).
export function seedNotifications(now: number): Notif[] {
  return SEED.map((s, i) => ({
    id: `n${i}`,
    kind: s.kind,
    urgency: URGENCY_OF[s.kind],
    title: s.title,
    body: s.body,
    amount: s.amount,
    href: s.href,
    at: now - s.agoMin * 60000,
    deadline: s.inMin ? now + s.inMin * 60000 : undefined,
    // the three oldest are already read, so the bell doesn't open on a wall of unread noise
    read: s.agoMin > 600,
  })).sort((a, b) => b.at - a.at);
}

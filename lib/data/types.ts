import type { GameId } from "./games";

export type DataMode = "mock" | "chain";

export interface Social {
  kind: "youtube" | "twitch" | "kick" | "x" | "tiktok" | "instagram" | "telegram" | "onlyfans";
  url: string;
}

// A named, colored reputation tier a streamer defines for their viewers.
// threshold is in dollars donated (== reputation, front.md I §4: $1 donated = 1 reputation).
export interface Tier {
  name: string;
  threshold: number;
  color: string; // hex, chosen by the streamer
}

export interface Streamer {
  handle: string; // without "@"
  name: string;
  bio: string;
  address: string; // where donations arrive — a base58 Solana pubkey (validated at entry, lib/chain/config isValidAddress)
  socials: Social[];
  tiers: Tier[];
  donatePresets?: number[]; // custom amount chips from the page builder; DonateForm falls back to [1,5,10]
  avatarUrl?: string; // uploaded avatar (data URL); when absent, surfaces fall back to the monogram
  avatarEnabled?: boolean; // owner can hide the avatar entirely
}

export interface Donation {
  id: string;
  from: string; // viewer name (or address)
  amount: number; // in dollars
  message?: string;
  time: string; // human-readable "2 min ago"
  date?: string; // ISO "2026-07-14" — the calendar day, for grouping/filtering in the cabinet
  source?: GameId | "direct"; // which mini-game it came through, or a plain donation
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
  slug?: string; // set when donating on a campaign page — only that campaign's total is bumped
  source?: GameId | "direct"; // which mini-game settled this money; defaults to a plain donation
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

// Rules for the "Task for donation" game — the streamer's own limits on what they're on the
// hook for. Not on-chain: the contract only knows amount + deadline + outcome (front.md I §4);
// these are front-end guardrails the streamer sets for themselves before the game goes live.
export interface TaskGameConfig {
  minAmount: number; // $ — a task can't be submitted for less than this
  deadlineHours: number; // hours the streamer has to finish it before a refund can be claimed
  requireApproval: boolean; // streamer must accept the task before the deadline clock starts
  maxActiveTasks: number; // queue cap — new tasks pause once this many are in progress
}

// Rules for the Roulette game — viewers suggest a game to play by donating toward it; a
// weighted spin picks one (pool share = odds). These are the streamer's guardrails on who's
// allowed to suggest what, and how long a round runs. Not on-chain — a suggestion is just a
// plain donation (front.md I §5); the spin itself is a front-end/backend concern, not a contract.
export interface RouletteConfig {
  minTier: string; // tier name required to suggest a game, "" = everyone can
  excludeTopTier: boolean; // if true, the streamer's highest tier can't suggest (e.g. they get asked directly instead)
  genres: string[]; // allowed game genres for a suggestion, empty = all genres allowed
  minDonation: number; // $ — a suggestion needs at least this much to register
  roundMinutes: number; // how long the submission window stays open before the spin
  playMinutes: number; // how long the streamer commits to playing the winning pick
}

// The Fundraiser page itself — the promise viewers are chipping in toward, plus everything
// the streamer arranges on that page (same builder pattern as the Task page). One active
// fundraiser per streamer for now; on-chain each one becomes its own collection of escrows.
export interface FundraiserDraft {
  pledge: string; // headline — what the streamer commits to do if the goal is met
  description: string; // longer text under the pledge (details, terms, why)
  descriptionEnabled: boolean;
  goal: number; // $ target
  presets: number[]; // chip-in amount chips, at least 1
  widgets: PageWidget[]; // chip-in form + socials — toggle/reorder, same shape as the main page
  design: PageDesign; // the fundraiser page's own backdrop
  fillImage?: string; // data URL — the content maker's own photo for the fill-up figure; empty = Crown badge
}

// The Task page itself — what a viewer sees when they open the link to set a paid task.
// Same builder shape as the Fundraiser and Roulette drafts; the queue of real tasks is live
// data (lib/data/tasks.ts), not part of the draft.
export interface TaskDraft {
  headline: string; // the pitch — what you're taking tasks for
  description: string; // longer text under it (what you'll do, what you won't)
  descriptionEnabled: boolean;
  presets: number[]; // task amount chips, at least 1
  widgets: PageWidget[]; // task form + socials — toggle/reorder, same shape as the main page
  design: PageDesign; // the task page's own backdrop
}

// The Roulette page itself — what viewers see when they open the round: the streamer's own
// pitch plus the page furniture (same builder pattern as the Task and Fundraiser pages).
// The round's suggestions/pools are live data, not part of the draft.
export interface RouletteDraft {
  headline: string; // the streamer's pitch — what this wheel is about
  description: string; // longer text under the headline (house rules, schedule)
  descriptionEnabled: boolean;
  presets: number[]; // suggestion amount chips, at least 1
  widgets: PageWidget[]; // suggest form + socials — toggle/reorder, same shape as the main page
  design: PageDesign; // the roulette page's own backdrop
}

// Rules for the Fundraiser game — the streamer's standing guardrails, applied to every
// fundraiser they open. Not on-chain: the contracts only know amounts, deadlines and the
// verdict; these keep the collection sane (e.g. dust contributions cost more gas to claim
// than they're worth).
export interface FundraiserConfig {
  minContribution: number; // $ — a contribution below this doesn't register
  fundingDays: number; // how long the collection stays open
  deliveryDays: number; // window to deliver after accepting the amount
  allowBelowGoal: boolean; // streamer may accept a partially funded goal
  minAcceptPct: number; // % of the goal required to accept when allowBelowGoal is on
}

// The Auction page itself — what viewers see when they open the bidding: the streamer's pitch
// plus the page furniture (same builder pattern as the other game pages). Lots and bids are live
// data (lib/data/auction.ts), not part of the draft.
export interface AuctionDraft {
  headline: string; // the pitch — what you're auctioning your time for
  description: string; // longer text under it (what you will/won't do)
  descriptionEnabled: boolean;
  presets: number[]; // bid amount chips, at least 1
  widgets: PageWidget[]; // bid form + socials — toggle/reorder, same shape as the main page
  design: PageDesign; // the auction page's own backdrop
}

// Rules for the Auction game — the streamer's knobs from the spec (duration, perform window,
// min bid). Not on-chain in mock mode; on chain they are fixed per auction at creation.
export interface AuctionConfig {
  minBid: number; // $ — a single bid below this doesn't register
  biddingHours: number; // how long the bidding stays open
  performHours: number; // window to deliver the winning condition after the final
}

// Streamer profile (localStorage — the "mock backend"). widgets/design/avatar* are optional so
// profiles saved before the page builder shipped still load — see lib/data/pagebuilder.ts defaults.
export interface Profile {
  handle: string;
  name: string;
  bio: string;
  address: string; // base58 Solana pubkey, or "" until the wallet step sets one
  socials: Social[];
  tiers: Tier[];
  avatarEnabled?: boolean;
  avatarUrl?: string; // data URL, mock upload
  bioEnabled?: boolean;
  widgets?: PageWidget[];
  design?: PageDesign;
  task?: string; // legacy: the old author-page builder's task line — TaskDraft.headline supersedes it
  taskPage?: TaskDraft; // the Task game's own public page — see TaskDraft
  donatePresets?: number[]; // the donate widget's amount chips — streamer can add/remove, at least 1
  taskConfig?: TaskGameConfig; // rules for the Task for donation game — see TaskGameConfig
  rouletteConfig?: RouletteConfig; // rules for the Roulette game — see RouletteConfig
  roulette?: RouletteDraft; // the Roulette page — see RouletteDraft
  fundraiser?: FundraiserDraft; // the active Fundraiser page — see FundraiserDraft
  fundraiserConfig?: FundraiserConfig; // rules for the Fundraiser game — see FundraiserConfig
  auction?: AuctionDraft; // the Auction page — see AuctionDraft
  auctionConfig?: AuctionConfig; // rules for the Auction game — see AuctionConfig
}

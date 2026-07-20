// Server side of the Telegram bot. ALL bot behaviour lives here (and in the api/telegram routes) —
// the bot process (bot/bot.mjs) is a dumb pipe that forwards Telegram updates in and messages out.
// One writer (this Next server), one JSON file on disk, no database until the real backend lands.
//
// Every notification ships as a CARD — a PNG in the site's design rendered by /api/telegram/card —
// with an HTML caption and, where a decision is involved, inline buttons. No emoji anywhere.
// Money rule (front.md §4): the bot states facts after the fact ("$50 landed"), never promises.

import { promises as fs } from "fs";
import path from "path";
import { db, now } from "./db";
import { URGENCY_OF, URGENCY_LABEL, type NotifUrgency, type NotifKind } from "@/lib/data/notifications";

// The old JSON file — read ONCE to import legacy state into the DB, then ignored.
const LEGACY_FILE = path.join(process.cwd(), "bot", "data", "store.json");

export interface TgLink {
  chatId: number;
  tgName: string; // who connected, as Telegram reports them
  name: string; // the streamer's display name
  categories: Record<NotifUrgency, boolean>;
  monthly: boolean;
  at: number;
}

export interface TgButton {
  text: string;
  data?: string; // callback button
  url?: string; // link button
}

// One queued message. With `card` the bot renders /api/telegram/card?<card params> and sends a
// photo with the caption; without it, a plain HTML message.
export interface OutboxItem {
  chatId: number;
  caption: string; // HTML
  card?: Record<string, string>;
  buttons?: TgButton[][];
}

export interface TgStore {
  botUsername: string | null;
  pending: Record<string, { handle: string; name: string; at: number }>; // link code → who is connecting
  links: Record<string, TgLink>; // handle → linked chat
  founders: number[]; // chat ids that entered the founder secret
  outbox: OutboxItem[]; // queued messages, drained by the bot
}

const EMPTY: TgStore = { botUsername: null, pending: {}, links: {}, founders: [], outbox: [] };

// ---- persistence: the Crown DB (was bot/data/store.json) ----
// Same read-whole/write-whole contract the routes were built on, backed by
// real tables. writeStore replaces state transactionally, so the outbox
// drain pattern (read → splice → write) stays exactly as it was.

async function importLegacyOnce(): Promise<void> {
  const c = await db();
  const done = await c.execute(`SELECT 1 FROM tg_meta WHERE key = 'legacy_imported'`);
  if (done.rows.length) return;
  try {
    const legacy = JSON.parse(await fs.readFile(LEGACY_FILE, "utf8")) as TgStore;
    await writeStore({ ...EMPTY, ...legacy });
  } catch {
    // no legacy file — nothing to carry over
  }
  await c.execute(`INSERT INTO tg_meta (key, value) VALUES ('legacy_imported', '1') ON CONFLICT(key) DO NOTHING`);
}

export async function readStore(): Promise<TgStore> {
  await importLegacyOnce();
  const c = await db();
  const [meta, pending, links, founders, outbox] = await Promise.all([
    c.execute(`SELECT value FROM tg_meta WHERE key = 'bot_username'`),
    c.execute(`SELECT * FROM tg_pending`),
    c.execute(`SELECT * FROM tg_links`),
    c.execute(`SELECT chat_id FROM tg_founders`),
    c.execute(`SELECT * FROM tg_outbox ORDER BY id`),
  ]);
  const s: TgStore = {
    botUsername: meta.rows.length ? String(meta.rows[0].value) : null,
    pending: {},
    links: {},
    founders: founders.rows.map((r) => Number(r.chat_id)),
    outbox: outbox.rows.map((r) => ({
      chatId: Number(r.chat_id),
      caption: String(r.caption),
      card: r.card ? (JSON.parse(String(r.card)) as Record<string, string>) : undefined,
      buttons: r.buttons ? (JSON.parse(String(r.buttons)) as TgButton[][]) : undefined,
    })),
  };
  for (const r of pending.rows) s.pending[String(r.code)] = { handle: String(r.handle), name: String(r.name), at: Number(r.at) };
  for (const r of links.rows)
    s.links[String(r.handle)] = {
      chatId: Number(r.chat_id),
      tgName: String(r.tg_name),
      name: String(r.name),
      categories: JSON.parse(String(r.categories)) as Record<NotifUrgency, boolean>,
      monthly: Boolean(Number(r.monthly)),
      at: Number(r.at),
    };
  return s;
}

export async function writeStore(s: TgStore): Promise<void> {
  const c = await db();
  const tx = await c.transaction("write");
  try {
    await tx.execute(`DELETE FROM tg_pending`);
    await tx.execute(`DELETE FROM tg_links`);
    await tx.execute(`DELETE FROM tg_founders`);
    await tx.execute(`DELETE FROM tg_outbox`);
    if (s.botUsername) {
      await tx.execute({
        sql: `INSERT INTO tg_meta (key, value) VALUES ('bot_username', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        args: [s.botUsername],
      });
    } else {
      await tx.execute(`DELETE FROM tg_meta WHERE key = 'bot_username'`);
    }
    for (const [code, p] of Object.entries(s.pending)) {
      await tx.execute({ sql: `INSERT INTO tg_pending (code, handle, name, at) VALUES (?, ?, ?, ?)`, args: [code, p.handle, p.name, p.at] });
    }
    for (const [handle, l] of Object.entries(s.links)) {
      await tx.execute({
        sql: `INSERT INTO tg_links (handle, chat_id, tg_name, name, categories, monthly, at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [handle, l.chatId, l.tgName, l.name, JSON.stringify(l.categories), l.monthly ? 1 : 0, l.at],
      });
    }
    for (const chatId of s.founders) {
      await tx.execute({ sql: `INSERT OR IGNORE INTO tg_founders (chat_id) VALUES (?)`, args: [chatId] });
    }
    for (const o of s.outbox) {
      await tx.execute({
        sql: `INSERT INTO tg_outbox (chat_id, caption, card, buttons, created_at) VALUES (?, ?, ?, ?, ?)`,
        args: [o.chatId, o.caption, o.card ? JSON.stringify(o.card) : null, o.buttons ? JSON.stringify(o.buttons) : null, now()],
      });
    }
    await tx.commit();
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}

const ALL_ON: Record<NotifUrgency, boolean> = { action: true, money: true, nice: true, digest: true, system: true };

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ---- queueing ----

export function findLinkByChat(s: TgStore, chatId: number): [string, TgLink] | undefined {
  return Object.entries(s.links).find(([, l]) => l.chatId === chatId);
}

// The big figure on the card = the first dollar amount in the title; the card title drops the
// " — $50" tail so the number isn't printed twice.
function splitMoney(title: string): { value: string; cardTitle: string } {
  const m = title.match(/\$[\d,]+(?:\.\d+)?/);
  if (!m) return { value: "", cardTitle: title };
  return { value: m[0], cardTitle: title.replace(/\s*[—–-]\s*\$[\d,]+(?:\.\d+)?\s*$/, "") };
}

// Inline buttons where the notification is a decision. Demo callbacks until the backend lands.
function buttonsFor(kind: NotifKind): TgButton[][] | undefined {
  if (kind === "task_offered")
    return [[{ text: "Accept", data: "demo:accept" }, { text: "Turn down", data: "demo:decline" }]];
  if (kind === "fundraiser_goal_hit") return [[{ text: "Accept the amount", data: "demo:accept" }]];
  return undefined;
}

// Queue a notification for a streamer — respects their category toggles unless forced (test button).
export function queueNotify(
  s: TgStore,
  handle: string,
  kind: NotifKind,
  title: string,
  body: string,
  force = false
): boolean {
  const link = s.links[handle];
  if (!link) return false;
  const urgency = URGENCY_OF[kind];
  if (!force && !link.categories[urgency]) return false;

  const { value, cardTitle } = splitMoney(title);
  s.outbox.push({
    chatId: link.chatId,
    caption: `<b>${esc(title)}</b>${body ? `\n${esc(body)}` : ""}`,
    card: {
      t: "notify",
      label: URGENCY_LABEL[urgency],
      value,
      title: cardTitle,
      sub: body,
      handle,
    },
    buttons: buttonsFor(kind),
  });
  return true;
}

// ---- demo figures (replaced by the real backend later) ----

function queueMonthly(s: TgStore, chatId: number, name: string) {
  s.outbox.push({
    chatId,
    caption: `<b>${esc(name)}, your month on Crown</b>\nEarned $4,120 — up 18% on last month.`,
    card: {
      t: "stats",
      label: "Summary",
      title: `${name}, your month on Crown`,
      rows: "Earned:$4,120 (+18%)|Donations:312|VIPs:120 (+30)|Best day:$340",
    },
  });
}

function queueQuickStats(s: TgStore, chatId: number, name: string) {
  s.outbox.push({
    chatId,
    caption: `<b>${esc(name)} — right now</b>`,
    card: {
      t: "stats",
      label: "Summary",
      title: `${name} — right now`,
      rows: "Today:$180 · 6 donations|This week:$1,840 (+22%)|Reputation holders:402|Games run:3",
    },
  });
}

function queuePlatform(s: TgStore, chatId: number) {
  s.outbox.push({
    chatId,
    caption: "<b>Crown — platform</b>",
    card: {
      t: "stats",
      label: "Founders",
      title: "Crown — platform",
      rows: "Content makers:1,284 (+56)|Donations this month:$184,200|Mini-games run:312|New viewers:8,420",
    },
  });
}

// Queue a card to every founder chat — the admin channel. `rows` switches to the stats layout.
export function queueAdmin(
  s: TgStore,
  input: { label: string; title: string; body?: string; value?: string; rows?: string }
): number {
  const { value, cardTitle } = input.value !== undefined ? { value: input.value, cardTitle: input.title } : splitMoney(input.title);
  for (const chatId of s.founders) {
    s.outbox.push({
      chatId,
      caption: `<b>${esc(input.title)}</b>${input.body ? `\n${esc(input.body)}` : ""}`,
      card: input.rows
        ? { t: "stats", label: input.label, title: input.title, rows: input.rows }
        : { t: "notify", label: input.label, value, title: cardTitle, sub: input.body ?? "" },
    });
  }
  return s.founders.length;
}

const DEMO_SAMPLES: { kind: NotifKind; title: string; body: string }[] = [
  { kind: "big_donation", title: "toffi donated $50", body: "“Beat the boss with no armor on”" },
  { kind: "auction_lot_offered", title: "New auction lot — $60", body: "Private until you accept: “Finish the map on the hardest difficulty.”" },
  { kind: "roulette_closing", title: "Your roulette round closes in 12m", body: "$1,600 in the pot, 3 games suggested." },
  { kind: "payout", title: "$50 landed in your wallet", body: "Task completed — toffi earned +50 reputation with you." },
];

// ---- the bot's brain: one Telegram update in → replies/edits out ----

export interface BotEvent {
  type: "hello" | "message" | "callback";
  username?: string; // hello
  chatId?: number;
  text?: string; // message
  tgName?: string;
  data?: string; // callback
  messageId?: number; // callback — for editing the keyboard in place
  callbackId?: string;
}

export interface BotReply {
  chatId: number;
  text: string;
  keyboard?: TgButton[][];
}

export interface BotResult {
  replies: BotReply[];
  edits: { chatId: number; messageId: number; keyboard: TgButton[][] }[];
  answerCallback?: { id: string; text?: string };
}

// No fallback: if FOUNDER_SECRET isn't set in the environment, the /founder command is simply
// unavailable — a guessable default ("crown-founder") would let anyone claim founder mode.
const FOUNDER_SECRET = process.env.FOUNDER_SECRET;

// ● / ○ — state by shape, not emoji.
function settingsKeyboard(link: TgLink): TgButton[][] {
  const cats = (Object.keys(URGENCY_LABEL) as NotifUrgency[]).map((u) => [
    { text: `${link.categories[u] ? "●" : "○"} ${URGENCY_LABEL[u]}`, data: `cat:${u}` },
  ]);
  return [...cats, [{ text: `${link.monthly ? "●" : "○"} Monthly digest`, data: "monthly" }]];
}

const HELP = [
  "This chat gets what happens on your Crown page: things that need you, money moves, good news, summaries, problems.",
  "",
  "/settings — choose what arrives",
  "/stats — how it's going right now",
  "/monthly — your month in one card",
  "/demo — three samples",
  "/stop — disconnect",
].join("\n");

const NOT_CONNECTED = "Not connected yet — open your Crown cabinet, Settings → Telegram, and tap Connect there.";

export async function handleEvent(ev: BotEvent): Promise<BotResult> {
  const s = await readStore();
  const out: BotResult = { replies: [], edits: [] };
  const reply = (chatId: number, text: string, keyboard?: TgButton[][]) => out.replies.push({ chatId, text, keyboard });

  if (ev.type === "hello" && ev.username) {
    s.botUsername = ev.username;
    await writeStore(s);
    return out;
  }

  const chatId = ev.chatId!;

  if (ev.type === "callback") {
    out.answerCallback = { id: ev.callbackId! };
    const found = findLinkByChat(s, chatId);

    // demo action buttons on notifications: acknowledge, then take the buttons away
    if (ev.data?.startsWith("demo:")) {
      out.answerCallback.text =
        ev.data === "demo:accept"
          ? "In the live version this accepts right from Telegram. Coming with the backend."
          : "In the live version this declines and refunds the viewer. Coming with the backend.";
      if (ev.messageId) out.edits.push({ chatId, messageId: ev.messageId, keyboard: [] });
      return out;
    }

    if (found && ev.data) {
      const [, link] = found;
      if (ev.data.startsWith("cat:")) {
        const u = ev.data.slice(4) as NotifUrgency;
        link.categories[u] = !link.categories[u];
      } else if (ev.data === "monthly") {
        link.monthly = !link.monthly;
      }
      await writeStore(s);
      if (ev.messageId) out.edits.push({ chatId, messageId: ev.messageId, keyboard: settingsKeyboard(link) });
    }
    return out;
  }

  // plain message
  const text = (ev.text ?? "").trim();
  const [cmd, ...rest] = text.split(/\s+/);
  const arg = rest.join(" ");
  const found = findLinkByChat(s, chatId);

  switch (cmd) {
    case "/start": {
      if (arg && s.pending[arg]) {
        const { handle, name } = s.pending[arg];
        delete s.pending[arg];
        s.links[handle] = { chatId, tgName: ev.tgName ?? "", name, categories: { ...ALL_ON }, monthly: true, at: Date.now() };
        s.outbox.push({
          chatId,
          caption: `<b>Connected</b>\nThis chat now gets everything from ${esc(name)}'s page.`,
          card: { t: "notify", label: "Connected", title: `This chat is linked to ${name}'s page`, sub: "Everything from the bell, right here.", handle },
        });
        await writeStore(s);
        reply(chatId, HELP);
      } else if (found) {
        reply(chatId, `Already connected to ${found[1].name}'s page.\n\n${HELP}`);
      } else {
        reply(chatId, NOT_CONNECTED);
      }
      break;
    }
    case "/settings": {
      if (!found) reply(chatId, NOT_CONNECTED);
      else reply(chatId, "What should arrive here? Tap to toggle — filled means on:", settingsKeyboard(found[1]));
      break;
    }
    case "/stats": {
      if (!found) reply(chatId, NOT_CONNECTED);
      else {
        queueQuickStats(s, chatId, found[1].name);
        await writeStore(s);
      }
      break;
    }
    case "/monthly": {
      if (!found) reply(chatId, NOT_CONNECTED);
      else {
        queueMonthly(s, chatId, found[1].name);
        await writeStore(s);
      }
      break;
    }
    case "/demo": {
      if (!found) reply(chatId, NOT_CONNECTED);
      else {
        for (const d of DEMO_SAMPLES) queueNotify(s, found[0], d.kind, d.title, d.body, true);
        await writeStore(s);
      }
      break;
    }
    case "/stop": {
      if (found) {
        delete s.links[found[0]];
        await writeStore(s);
        reply(chatId, "Disconnected. Reconnect any time from your cabinet — Settings → Telegram.");
      } else reply(chatId, "This chat wasn't connected to anything.");
      break;
    }
    case "/founder": {
      if (FOUNDER_SECRET && arg === FOUNDER_SECRET) {
        if (!s.founders.includes(chatId)) s.founders.push(chatId);
        await writeStore(s);
        reply(chatId, "Founder mode on. /platform shows the numbers; the monthly platform digest lands here too.");
      } else reply(chatId, "Wrong secret.");
      break;
    }
    case "/platform": {
      if (s.founders.includes(chatId)) {
        queuePlatform(s, chatId);
        await writeStore(s);
      } else reply(chatId, "Founders only.");
      break;
    }
    default:
      reply(chatId, HELP);
  }

  return out;
}

#!/usr/bin/env node
// Crown Telegram bot — a dumb pipe. Telegram updates go to the site, whatever the site answers goes
// back to Telegram, and the site's outbox is drained into chats. Zero npm dependencies; all the
// actual behaviour lives in the Next server (lib/server/telegram-store.ts), so when the real
// backend arrives this file doesn't change.
//
// Notifications are photos: the site renders a PNG card (/api/telegram/card) in the product's
// design, this process downloads it and uploads to Telegram (Telegram can't reach localhost).
//
// Run:  npm run bot     (token in bot/.env, from @BotFather)

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SITE = process.env.CROWN_SITE || "http://localhost:3000";

if (!TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN is not set.\n1) Message @BotFather → /newbot → copy the token\n2) put it in bot/.env: TELEGRAM_BOT_TOKEN=<token>");
  process.exit(1);
}

const tg = async (method, body) => {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const json = await res.json();
  if (!json.ok) console.error(`[tg] ${method}: ${json.description}`);
  return json;
};

// sendPhoto goes multipart — the card bytes are uploaded, not linked.
const tgPhoto = async (chatId, png, caption, replyMarkup) => {
  const fd = new FormData();
  fd.append("chat_id", String(chatId));
  fd.append("photo", new Blob([png], { type: "image/png" }), "card.png");
  fd.append("caption", caption);
  fd.append("parse_mode", "HTML");
  if (replyMarkup) fd.append("reply_markup", JSON.stringify(replyMarkup));
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendPhoto`, { method: "POST", body: fd });
  const json = await res.json();
  if (!json.ok) console.error(`[tg] sendPhoto: ${json.description}`);
  return json;
};

const site = async (path, init) => {
  const res = await fetch(`${SITE}/api/telegram/${path}`, init);
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json();
};

const toInlineKeyboard = (rows) => ({
  inline_keyboard: rows.map((row) => row.map((b) => (b.url ? { text: b.text, url: b.url } : { text: b.text, callback_data: b.data }))),
});

// Send everything the brain decided: replies, keyboard edits, callback acks.
async function dispatch(result) {
  for (const r of result.replies ?? []) {
    await tg("sendMessage", {
      chat_id: r.chatId,
      text: r.text,
      link_preview_options: { is_disabled: true },
      ...(r.keyboard ? { reply_markup: toInlineKeyboard(r.keyboard) } : {}),
    });
  }
  for (const e of result.edits ?? []) {
    await tg("editMessageReplyMarkup", { chat_id: e.chatId, message_id: e.messageId, reply_markup: toInlineKeyboard(e.keyboard) });
  }
  if (result.answerCallback) {
    await tg("answerCallbackQuery", { callback_query_id: result.answerCallback.id, text: result.answerCallback.text });
  }
}

// One outbox item → a photo card (preferred) or a plain message.
async function deliver(m) {
  if (m.card) {
    try {
      await tg("sendChatAction", { chat_id: m.chatId, action: "upload_photo" });
      const res = await fetch(`${SITE}/api/telegram/card?${new URLSearchParams(m.card)}`);
      if (!res.ok) throw new Error(`card → ${res.status}`);
      const png = Buffer.from(await res.arrayBuffer());
      const sent = await tgPhoto(m.chatId, png, m.caption, m.buttons ? toInlineKeyboard(m.buttons) : undefined);
      if (sent.ok) {
        console.log(`[sent] card → ${m.chatId}`);
        return;
      }
    } catch (e) {
      console.error(`[card] ${e.message} — falling back to text`);
    }
  }
  await tg("sendMessage", {
    chat_id: m.chatId,
    text: m.caption,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    ...(m.buttons ? { reply_markup: toInlineKeyboard(m.buttons) } : {}),
  });
  console.log(`[sent] text → ${m.chatId}`);
}

async function main() {
  const me = await tg("getMe");
  if (!me.ok) process.exit(1);
  console.log(`[bot] @${me.result.username} → ${SITE}`);
  await site("event", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: "hello", username: me.result.username }) });

  await tg("setMyCommands", {
    commands: [
      { command: "settings", description: "Choose what arrives here" },
      { command: "stats", description: "How it's going right now" },
      { command: "monthly", description: "Your month in one card" },
      { command: "demo", description: "Three sample notifications" },
      { command: "stop", description: "Disconnect" },
    ],
  });
  await tg("setMyShortDescription", { short_description: "Your Crown page, in your pocket: donations, deadlines, payouts." });
  await tg("setMyDescription", {
    description:
      "Notifications from your Crown donation page: things that need you, money moves, good news, monthly digests. Connect from your cabinet — Settings → Telegram.",
  });

  // outbox drain — messages queued by the site
  setInterval(async () => {
    try {
      const { items } = await site("outbox");
      for (const m of items) await deliver(m);
    } catch (e) {
      console.error(`[outbox] ${e.message}`);
    }
  }, 2000);

  // long-poll Telegram; transient network failures just retry
  let offset = 0;
  for (;;) {
    try {
      const upd = await tg("getUpdates", { offset, timeout: 25, allowed_updates: ["message", "callback_query"] });
      for (const u of upd.result ?? []) {
        offset = u.update_id + 1;
        let ev = null;
        if (u.message?.text) {
          ev = { type: "message", chatId: u.message.chat.id, text: u.message.text, tgName: u.message.from?.first_name ?? "" };
        } else if (u.callback_query) {
          ev = {
            type: "callback",
            chatId: u.callback_query.message?.chat?.id,
            messageId: u.callback_query.message?.message_id,
            data: u.callback_query.data,
            callbackId: u.callback_query.id,
          };
        }
        if (!ev) continue;
        const result = await site("event", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(ev) });
        await dispatch(result);
      }
    } catch (e) {
      console.error(`[poll] ${e.message} — retrying in 3s`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

main();

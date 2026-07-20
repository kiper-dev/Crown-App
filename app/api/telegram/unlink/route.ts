import { NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/server/telegram-store";

// Disconnect from the cabinet side. Says goodbye in the chat so the silence isn't a mystery.
export async function POST(req: Request) {
  const { handle } = (await req.json()) as { handle?: string };
  if (!handle) return NextResponse.json({ error: "handle required" }, { status: 400 });

  const s = await readStore();
  const link = s.links[handle];
  if (link) {
    s.outbox.push({ chatId: link.chatId, caption: "Disconnected from your cabinet. Reconnect any time — Settings → Telegram." });
    delete s.links[handle];
    await writeStore(s);
  }
  return NextResponse.json({ ok: true });
}

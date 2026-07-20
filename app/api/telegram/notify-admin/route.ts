import { NextResponse } from "next/server";
import { readStore, writeStore, queueAdmin } from "@/lib/server/telegram-store";

// Platform-level notifications → every founder chat (see /founder in the bot). This is the endpoint
// the real backend will call for admin alerts; today the mock/demo calls it.
// rows ("Label:Value|Label:Value") switches the card to the stats layout.
export async function POST(req: Request) {
  const { label, title, body, value, rows } = (await req.json()) as {
    label?: string;
    title?: string;
    body?: string;
    value?: string;
    rows?: string;
  };
  if (!label || !title) return NextResponse.json({ error: "label, title required" }, { status: 400 });

  const s = await readStore();
  const sent = queueAdmin(s, { label, title, body, value, rows });
  if (sent > 0) await writeStore(s);
  return NextResponse.json({ founders: sent });
}

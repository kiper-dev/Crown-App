import { NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/server/telegram-store";

// The bot polls this every couple of seconds: hand over everything queued, then clear it.
export async function GET() {
  const s = await readStore();
  const items = s.outbox;
  if (items.length) {
    s.outbox = [];
    await writeStore(s);
  }
  return NextResponse.json({ items });
}

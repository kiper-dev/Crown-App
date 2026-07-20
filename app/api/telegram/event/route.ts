import { NextResponse } from "next/server";
import { handleEvent, type BotEvent } from "@/lib/server/telegram-store";

// The bot process forwards every Telegram update here and sends back whatever we return.
// All bot behaviour is decided on this side — see lib/server/telegram-store.ts.
export async function POST(req: Request) {
  const ev = (await req.json()) as BotEvent;
  return NextResponse.json(await handleEvent(ev));
}

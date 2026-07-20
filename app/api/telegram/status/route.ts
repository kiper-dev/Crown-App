import { NextResponse } from "next/server";
import { readStore } from "@/lib/server/telegram-store";

// The cabinet panel polls this: is the bot alive, is this handle linked, what's toggled on.
export async function GET(req: Request) {
  const handle = new URL(req.url).searchParams.get("handle");
  const s = await readStore();
  const link = handle ? s.links[handle] : undefined;
  return NextResponse.json({
    botUsername: s.botUsername,
    linked: !!link,
    tgName: link?.tgName ?? null,
    categories: link?.categories ?? null,
    monthly: link?.monthly ?? null,
  });
}

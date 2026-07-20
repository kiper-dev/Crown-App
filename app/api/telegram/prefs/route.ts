import { NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/server/telegram-store";
import type { NotifUrgency } from "@/lib/data/notifications";

// Toggles from the cabinet panel — same switches the bot's /settings keyboard flips.
export async function POST(req: Request) {
  const { handle, categories, monthly } = (await req.json()) as {
    handle?: string;
    categories?: Partial<Record<NotifUrgency, boolean>>;
    monthly?: boolean;
  };
  if (!handle) return NextResponse.json({ error: "handle required" }, { status: 400 });

  const s = await readStore();
  const link = s.links[handle];
  if (!link) return NextResponse.json({ error: "not linked" }, { status: 404 });

  if (categories) Object.assign(link.categories, categories);
  if (typeof monthly === "boolean") link.monthly = monthly;
  await writeStore(s);
  return NextResponse.json({ ok: true, categories: link.categories, monthly: link.monthly });
}

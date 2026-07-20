import { NextResponse } from "next/server";
import { readStore, writeStore, queueNotify } from "@/lib/server/telegram-store";
import type { NotifKind } from "@/lib/data/notifications";

// Anything that happens on the site lands here → into the linked chat, category toggles respected.
// Today the mock donate flow calls it; the real backend will call the same endpoint.
export async function POST(req: Request) {
  const { handle, kind, title, body, force } = (await req.json()) as {
    handle?: string;
    kind?: NotifKind;
    title?: string;
    body?: string;
    force?: boolean;
  };
  if (!handle || !kind || !title) return NextResponse.json({ error: "handle, kind, title required" }, { status: 400 });

  const s = await readStore();
  const queued = queueNotify(s, handle, kind, title, body ?? "", !!force);
  if (queued) await writeStore(s);
  return NextResponse.json({ queued });
}

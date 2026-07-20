import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { readStore, writeStore } from "@/lib/server/telegram-store";

// "Connect Telegram" in the cabinet: mint a one-time code and hand back the deep link.
// The bot resolves the code when the user taps /start there.
export async function POST(req: Request) {
  const { handle, name } = (await req.json()) as { handle?: string; name?: string };
  if (!handle) return NextResponse.json({ error: "handle required" }, { status: 400 });

  const s = await readStore();
  const code = randomBytes(6).toString("hex");
  // one pending code per handle — a re-click invalidates the previous link
  for (const [c, p] of Object.entries(s.pending)) if (p.handle === handle) delete s.pending[c];
  s.pending[code] = { handle, name: name || handle, at: Date.now() };
  await writeStore(s);

  return NextResponse.json({
    code,
    botUsername: s.botUsername,
    deepLink: s.botUsername ? `https://t.me/${s.botUsername}?start=${code}` : null,
  });
}

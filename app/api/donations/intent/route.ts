import { NextRequest, NextResponse } from "next/server";
import { saveIntent } from "@/lib/server/store";
import { allow } from "@/lib/server/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The donor's own words for a tx they just sent: {signature, handle, name?,
// message?, source?}. Client-supplied, so it can only DECORATE the Settled
// row the indexer mirrors — a fake signature decorates nothing, ever.
export async function POST(req: NextRequest) {
  if (!allow(req, "intent-write", 30, 15)) return NextResponse.json({ error: "slow down" }, { status: 429 });
  let body: { signature?: string; handle?: string; name?: string; message?: string; source?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const signature = (body.signature ?? "").trim();
  const handle = (body.handle ?? "").trim();
  if (!signature || signature.length > 120 || !handle) {
    return NextResponse.json({ error: "signature and handle required" }, { status: 400 });
  }
  await saveIntent({
    signature,
    handle,
    donorName: body.name?.trim().slice(0, 60) || undefined,
    message: body.message?.trim().slice(0, 300) || undefined,
    source: body.source?.trim().slice(0, 20) || undefined,
  });
  return NextResponse.json({ ok: true });
}

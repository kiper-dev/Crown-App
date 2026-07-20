import { NextRequest, NextResponse } from "next/server";
import { listDonations } from "@/lib/server/store";
import { getProfile } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The real donation feed — rows the indexer mirrored from finalized Settled
// events on devnet. ?handle= resolves the streamer's payout address via the
// profiles table; ?streamer= takes a base58 address directly.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? 40);
  let streamer = searchParams.get("streamer") ?? undefined;

  const handle = searchParams.get("handle");
  if (handle && !streamer) {
    const p = await getProfile(handle);
    if (!p?.address) return NextResponse.json({ donations: [] });
    streamer = p.address;
  }

  const donations = await listDonations({ streamer, limit });
  return NextResponse.json({ donations });
}

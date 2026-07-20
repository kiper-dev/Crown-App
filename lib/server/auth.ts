import nacl from "tweetnacl";
import { PublicKey } from "@solana/web3.js";
import type { NextRequest } from "next/server";
import { AUTH_WINDOW_SECONDS, buildAuthMessage } from "@/lib/chain/authMessage";

// ──────────────────────────────────────────────────────────────────
// Wallet-signature auth for mutating APIs. The wallet IS the account
// (Crown has no passwords), so a mutation is authorized the same way a
// donation is: an ed25519 signature by the owner's key. Headers:
//   x-crown-pubkey    — signer, base58
//   x-crown-ts        — unix seconds (freshness window ±AUTH_WINDOW)
//   x-crown-signature — base64 ed25519 over buildAuthMessage(...)
// ──────────────────────────────────────────────────────────────────

export interface Signer {
  pubkey: string; // base58, verified
}

export async function verifySignedRequest(req: NextRequest, action: string, subject: string, body: unknown): Promise<Signer | null> {
  const pubkey = req.headers.get("x-crown-pubkey");
  const tsRaw = req.headers.get("x-crown-ts");
  const sigB64 = req.headers.get("x-crown-signature");
  if (!pubkey || !tsRaw || !sigB64) return null;

  const ts = Number(tsRaw);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > AUTH_WINDOW_SECONDS) return null;

  let keyBytes: Uint8Array;
  try {
    keyBytes = new PublicKey(pubkey).toBytes();
  } catch {
    return null;
  }

  let sig: Uint8Array;
  try {
    sig = Uint8Array.from(Buffer.from(sigB64, "base64"));
  } catch {
    return null;
  }
  if (sig.length !== 64) return null;

  const msg = await buildAuthMessage(action, subject, ts, body);
  return nacl.sign.detached.verify(msg, sig, keyBytes) ? { pubkey: new PublicKey(keyBytes).toBase58() } : null;
}

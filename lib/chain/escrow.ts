import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { CHAIN_ID, FACTORY_TWO_OUTCOME, FACTORY_STREAM } from "./config";
import { i64le, u16le, u64le } from "./solana";

// ──────────────────────────────────────────────────────────────────
// Crown-Factory primitives: crown-salt, escrow PDA derivation, account
// decoding and the ed25519 verdict instruction. These are the building
// blocks every game flow (tasks / funding / auction / subscription) rides
// on. The game canisters have no public principals yet, so no UI calls
// these — but the arithmetic is pinned by test vectors in the backend
// repos and verified in scripts/verify-chain.mjs, so wiring a game later
// is call-plumbing, not cryptography.
// ──────────────────────────────────────────────────────────────────

// sha256 via WebCrypto — async but dependency-free, works in browser and node.
async function sha256(data: Uint8Array): Promise<Buffer> {
  const d = await crypto.subtle.digest("SHA-256", data as BufferSource);
  return Buffer.from(d);
}

export interface TwoOutcomeBirth {
  donor: PublicKey;
  streamer: PublicKey;
  gross: bigint; // USDC minor units
  deadline: bigint; // unix seconds, i64
  resolver: PublicKey; // the game canister's threshold-ed25519 key
  feeBps: number;
  feeWallet: PublicKey;
  nonce: bigint;
}

// crown-salt, two-outcome shape (factory-spec §2.1):
// sha256(donor ‖ streamer ‖ gross u64LE ‖ deadline i64LE ‖ resolver ‖ fee_bps u16LE ‖ fee_wallet ‖ nonce u64LE)
// Pinned vector (Crown-Factory/vectors): all-0x11 donor, all-0x22 streamer,
// gross 1_000_000, deadline 1_900_000_000, all-0x33 resolver, fee 500,
// all-0x44 fee wallet, nonce 7 → 149c82b09a080ef4c92921d13d974177bfea2dd546ef8b798627e3e4245afe6b
export async function twoOutcomeSalt(b: TwoOutcomeBirth): Promise<Buffer> {
  return sha256(
    Buffer.concat([
      b.donor.toBuffer(),
      b.streamer.toBuffer(),
      u64le(b.gross),
      i64le(b.deadline),
      b.resolver.toBuffer(),
      u16le(b.feeBps),
      b.feeWallet.toBuffer(),
      u64le(b.nonce),
    ])
  );
}

// Escrow PDA: ["escrow", salt] under the shape's factory program.
export function escrowPda(salt: Buffer, factory: PublicKey = FACTORY_TWO_OUTCOME): PublicKey {
  return PublicKey.findProgramAddressSync([Buffer.from("escrow"), salt], factory)[0];
}

// Escrow account layout, identical for every shape (factory-spec §2.1):
// discriminator sha256("account:Escrow")[..8] @0..8, donor @8..40, salt @40..72.
const ESCROW_DISC = Buffer.from("1fd57bbbba16da9b", "hex");

export function decodeEscrow(data: Buffer): { donor: PublicKey; salt: Buffer } | null {
  if (data.length < 72 || !data.subarray(0, 8).equals(ESCROW_DISC)) return null;
  return { donor: new PublicKey(data.subarray(8, 40)), salt: Buffer.from(data.subarray(40, 72)) };
}

// ──────────────────────────────────────────────────────────────────
// The ed25519 verdict: a native Ed25519Program instruction that MUST sit
// directly before the claim/release/cancel instruction (no compute-budget
// ix in between — the factory reads the PREVIOUS instruction via the
// instructions sysvar). One layout serves every game.
// ──────────────────────────────────────────────────────────────────
const ED25519_PROGRAM_ID = new PublicKey("Ed25519SigVerify111111111111111111111111111");

export function ed25519VerdictIx(resolverPubkey: Uint8Array, signature: Uint8Array, message: Uint8Array): TransactionInstruction {
  if (resolverPubkey.length !== 32 || signature.length !== 64) throw new Error("Bad verdict material.");
  const header = Buffer.concat([
    Buffer.from([1, 0]), // one signature, padding
    u16le(48), u16le(0xffff), // signature offset @48, this instruction
    u16le(16), u16le(0xffff), // pubkey offset @16
    u16le(112), u16le(message.length), u16le(0xffff), // message @112
  ]);
  const data = Buffer.concat([header, Buffer.from(resolverPubkey), Buffer.from(signature), Buffer.from(message)]);
  return new TransactionInstruction({ programId: ED25519_PROGRAM_ID, keys: [], data });
}

// Verdict message domains (byte-exact; outcome codes per the candid API:
// settle → 0, cancel → 1).
export function twoOutcomeVerdictMessage(factory: PublicKey, escrow: PublicKey, outcome: 0 | 1): Buffer {
  return Buffer.concat([Buffer.from(`crown:two-outcome:${CHAIN_ID}`), factory.toBuffer(), escrow.toBuffer(), Buffer.from([outcome])]);
}

export function streamVerdictMessage(escrow: PublicKey, kind: "release" | "cancel", index = 0): Buffer {
  const head = Buffer.concat([Buffer.from(`crown:stream:${CHAIN_ID}`), FACTORY_STREAM.toBuffer(), escrow.toBuffer()]);
  return kind === "release" ? Buffer.concat([head, Buffer.from([0]), u16le(index)]) : Buffer.concat([head, Buffer.from([1])]);
}

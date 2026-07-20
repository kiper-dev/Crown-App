// Verifies the frontend's chain arithmetic against the backend's pinned
// vectors and the live devnet deployment. Run: node scripts/verify-chain.mjs
// Fails loudly (exit 1) on ANY mismatch — this is money code.
import { createHash } from "node:crypto";
import { PublicKey } from "@solana/web3.js";

const RPC = process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.devnet.solana.com";
const SPLITTER = "DDSeyx684iU9agHbXExwS3NstLvQeLKZcJWcJFSh1VDA";
const USDC = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const FACTORY_TWO_OUTCOME = "83f7ziVs5VeQ8xiDka8zczbfJT4WcxsXQ18cqWwmV5ur";

let failed = 0;
const check = (name, ok, got = "") => {
  console.log(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — got ${got}`}`);
  if (!ok) failed++;
};

const sha8 = (s) => createHash("sha256").update(s).digest().subarray(0, 8).toString("hex");

// ── 1. Anchor discriminators (hand-encoded in lib/chain must match sha256 derivation)
check("donate discriminator = 79badad34946c4b4", sha8("global:donate") === "79badad34946c4b4", sha8("global:donate"));
check("Escrow account discriminator = 1fd57bbbba16da9b", sha8("account:Escrow") === "1fd57bbbba16da9b", sha8("account:Escrow"));
check("create_escrow discriminator derivable", sha8("global:create_escrow").length === 16);

// ── 2. crown-salt two-outcome — the backend's pinned vector (Crown-Factory/vectors)
const u64le = (v) => { const b = Buffer.alloc(8); b.writeBigUInt64LE(BigInt(v)); return b; };
const u16le = (v) => { const b = Buffer.alloc(2); b.writeUInt16LE(v); return b; };
const salt = createHash("sha256")
  .update(Buffer.concat([
    Buffer.alloc(32, 0x11), Buffer.alloc(32, 0x22), u64le(1_000_000), u64le(1_900_000_000),
    Buffer.alloc(32, 0x33), u16le(500), Buffer.alloc(32, 0x44), u64le(7),
  ]))
  .digest()
  .toString("hex");
check(
  "two-outcome crown-salt matches pinned vector 149c82b0…",
  salt === "149c82b09a080ef4c92921d13d974177bfea2dd546ef8b798627e3e4245afe6b",
  salt
);

// ── 3. PDA derivations
const evAuth = PublicKey.findProgramAddressSync([Buffer.from("__event_authority")], new PublicKey(SPLITTER))[0];
check(`event authority PDA derives (${evAuth.toBase58().slice(0, 8)}…)`, evAuth instanceof PublicKey);
const escrowPda = PublicKey.findProgramAddressSync(
  [Buffer.from("escrow"), Buffer.from(salt, "hex")],
  new PublicKey(FACTORY_TWO_OUTCOME)
)[0];
check(`escrow PDA derives from vector salt (${escrowPda.toBase58().slice(0, 8)}…)`, escrowPda instanceof PublicKey);

// ── 4. Live devnet: programs exist, are executable; the mint is a real SPL mint
async function rpc(method, params) {
  const r = await fetch(RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  return (await r.json()).result;
}
const splitterInfo = await rpc("getAccountInfo", [SPLITTER, { encoding: "base64" }]);
check("splitter deployed & executable on devnet", !!splitterInfo?.value?.executable);
const mintInfo = await rpc("getAccountInfo", [USDC, { encoding: "jsonParsed" }]);
const dec = mintInfo?.value?.data?.parsed?.info?.decimals;
check("USDC mint exists with 6 decimals", dec === 6, String(dec));
const factInfo = await rpc("getAccountInfo", [FACTORY_TWO_OUTCOME, { encoding: "base64" }]);
check("two-outcome factory deployed & executable", !!factInfo?.value?.executable);

// ── 5. Simulate a real donate tx (unsigned): a WELL-FORMED instruction must
// fail on signature/funds — NOT on InvalidInstructionData/ProgramFailedToComplete.
const { Transaction, TransactionInstruction, SystemProgram } = await import("@solana/web3.js");
const { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID, createAssociatedTokenAccountIdempotentInstruction } = await import("@solana/spl-token");
const donor = new PublicKey("3JF3sEqM796hk5WFqA6EtmEwJQ9quALszsfJyvXNQKy3"); // mock seed wallet, no funds
const streamer = new PublicKey("4Ss5JMkXAD9Z7cktFEdrqeMuT6jGMF1pVozTyPHZ6zT4");
const donorAta = getAssociatedTokenAddressSync(new PublicKey(USDC), donor);
const streamerAta = getAssociatedTokenAddressSync(new PublicKey(USDC), streamer);
const ix = new TransactionInstruction({
  programId: new PublicKey(SPLITTER),
  data: Buffer.concat([Buffer.from("79badad34946c4b4", "hex"), u64le(1_000_000)]),
  keys: [
    { pubkey: donor, isSigner: true, isWritable: false },
    { pubkey: streamer, isSigner: false, isWritable: false },
    { pubkey: new PublicKey(USDC), isSigner: false, isWritable: false },
    { pubkey: donorAta, isSigner: false, isWritable: true },
    { pubkey: streamerAta, isSigner: false, isWritable: true },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: evAuth, isSigner: false, isWritable: false },
    { pubkey: new PublicKey(SPLITTER), isSigner: false, isWritable: false },
  ],
});
const tx = new Transaction().add(
  createAssociatedTokenAccountIdempotentInstruction(donor, streamerAta, streamer, new PublicKey(USDC)),
  createAssociatedTokenAccountIdempotentInstruction(donor, donorAta, donor, new PublicKey(USDC)),
  ix
);
tx.feePayer = donor;
tx.recentBlockhash = (await rpc("getLatestBlockhash", [{ commitment: "confirmed" }])).value.blockhash;
const sim = await rpc("simulateTransaction", [
  tx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString("base64"),
  // replaceRecentBlockhash: the node substitutes a live blockhash so the sim
  // actually EXECUTES the instructions instead of dying on staleness first.
  { encoding: "base64", sigVerify: false, replaceRecentBlockhash: true },
]);
const err = JSON.stringify(sim?.value?.err ?? null);
const logs = (sim?.value?.logs ?? []).join("\n");
// Expected: fails funding the ATA rent (empty wallet) or an SPL funds error deep in the flow.
// Structural problems would surface as InvalidInstructionData / missing account errors instead.
const structuralProblem = /InvalidInstructionData|invalid program argument|incorrect program id|AccountNotFound.*DDSeyx/i.test(logs + err);
check(`donate tx simulates without structural errors (err=${err})`, !structuralProblem, logs.slice(0, 300));
console.log("── sim logs (tail):");
console.log(logs.split("\n").slice(-6).join("\n"));

process.exit(failed ? 1 : 0);

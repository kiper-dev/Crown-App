"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { PublicKey, type Transaction } from "@solana/web3.js";
import { connection } from "./solana";

// ──────────────────────────────────────────────────────────────────
// Solana wallet layer: talks to the injected Phantom / Solflare providers
// directly. No wallet-adapter UI stack — our picker (WalletButton) is
// custom, and two first-class wallets cover the Solana userbase the
// backend targets. The provider object shape both wallets share:
//   connect() → { publicKey }, disconnect(), signTransaction(tx),
//   signAndSendTransaction(tx) → { signature }, on("disconnect"|"accountChanged")
// ──────────────────────────────────────────────────────────────────

export type WalletName = "phantom" | "solflare";

interface InjectedProvider {
  isPhantom?: boolean;
  publicKey?: { toString(): string } | null;
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey?: { toString(): string } } | void>;
  disconnect: () => Promise<void>;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
  signAndSendTransaction?: (tx: Transaction) => Promise<{ signature: string }>;
  signMessage?: (msg: Uint8Array, display?: string) => Promise<{ signature: Uint8Array } | Uint8Array>;
  on?: (event: string, cb: (...args: unknown[]) => void) => void;
  off?: (event: string, cb: (...args: unknown[]) => void) => void;
}

function getInjected(name: WalletName): InjectedProvider | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { phantom?: { solana?: InjectedProvider }; solana?: InjectedProvider; solflare?: InjectedProvider };
  if (name === "phantom") {
    const p = w.phantom?.solana ?? (w.solana?.isPhantom ? w.solana : null);
    return p ?? null;
  }
  return w.solflare ?? null;
}

interface WalletCtx {
  address: string | null; // base58
  connected: boolean;
  connecting: boolean;
  walletName: WalletName | null;
  detected: WalletName[]; // which injected wallets exist in this browser
  connect: (name: WalletName) => Promise<void>;
  disconnect: () => Promise<void>;
  // Signs with the connected wallet and sends to devnet; returns the signature.
  sendTransaction: (tx: Transaction) => Promise<string>;
  // Signs an arbitrary message (auth for mutating APIs); null when no wallet
  // is connected or the wallet can't sign messages.
  signMessage: (msg: Uint8Array) => Promise<Uint8Array | null>;
}

const Ctx = createContext<WalletCtx | null>(null);

export function SolanaWalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [walletName, setWalletName] = useState<WalletName | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [detected, setDetected] = useState<WalletName[]>([]);

  // Injection is async (extensions land after hydration) — probe a few times.
  useEffect(() => {
    let tries = 0;
    const probe = () => {
      const found: WalletName[] = [];
      if (getInjected("phantom")) found.push("phantom");
      if (getInjected("solflare")) found.push("solflare");
      setDetected((prev) => (prev.length === found.length && prev.every((p) => found.includes(p)) ? prev : found));
      if (++tries < 5) setTimeout(probe, 400);
    };
    probe();
  }, []);

  // A wallet-side disconnect or account switch must reflect in the UI, not
  // leave a stale address that then signs for the wrong person.
  useEffect(() => {
    if (!walletName) return;
    const p = getInjected(walletName);
    if (!p?.on) return;
    const onDisconnect = () => {
      setAddress(null);
      setWalletName(null);
    };
    const onAccountChanged = (...args: unknown[]) => {
      const pk = args[0] as { toString(): string } | null | undefined;
      setAddress(pk ? new PublicKey(pk.toString()).toBase58() : null);
    };
    p.on("disconnect", onDisconnect);
    p.on("accountChanged", onAccountChanged);
    return () => {
      p.off?.("disconnect", onDisconnect);
      p.off?.("accountChanged", onAccountChanged);
    };
  }, [walletName]);

  const connect = useCallback(async (name: WalletName) => {
    const p = getInjected(name);
    if (!p) throw new Error(name === "phantom" ? "Phantom is not installed." : "Solflare is not installed.");
    setConnecting(true);
    try {
      const res = await p.connect();
      const pk = (res && "publicKey" in (res as object) ? (res as { publicKey?: { toString(): string } }).publicKey : undefined) ?? p.publicKey;
      if (!pk) throw new Error("Wallet returned no public key.");
      setAddress(new PublicKey(pk.toString()).toBase58());
      setWalletName(name);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (walletName) {
      try {
        await getInjected(walletName)?.disconnect();
      } catch {}
    }
    setAddress(null);
    setWalletName(null);
  }, [walletName]);

  const sendTransaction = useCallback(
    async (tx: Transaction) => {
      if (!walletName || !address) throw new Error("Connect your wallet first.");
      const p = getInjected(walletName);
      if (!p) throw new Error("Wallet not available.");
      const conn = connection();
      tx.feePayer = new PublicKey(address);
      tx.recentBlockhash = (await conn.getLatestBlockhash("confirmed")).blockhash;
      // Prefer the wallet's own send (it simulates + picks its RPC), fall back to sign+send.
      if (p.signAndSendTransaction) {
        const { signature } = await p.signAndSendTransaction(tx);
        await conn.confirmTransaction(signature, "confirmed");
        return signature;
      }
      const signed = await p.signTransaction(tx);
      const sig = await conn.sendRawTransaction(signed.serialize());
      await conn.confirmTransaction(sig, "confirmed");
      return sig;
    },
    [walletName, address]
  );

  const signMessage = useCallback(
    async (msg: Uint8Array): Promise<Uint8Array | null> => {
      if (!walletName || !address) return null;
      const p = getInjected(walletName);
      if (!p?.signMessage) return null;
      try {
        // Phantom returns {signature}, Solflare historically returned raw bytes.
        const res = await p.signMessage(msg, "utf8");
        return res instanceof Uint8Array ? res : res.signature;
      } catch {
        return null; // user closed the wallet prompt
      }
    },
    [walletName, address]
  );

  const value = useMemo<WalletCtx>(
    () => ({ address, connected: !!address, connecting, walletName, detected, connect, disconnect, sendTransaction, signMessage }),
    [address, connecting, walletName, detected, connect, disconnect, sendTransaction, signMessage]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSolanaWallet(): WalletCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSolanaWallet must be used inside SolanaWalletProvider");
  return ctx;
}

"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { readContract, writeContract, waitForTransactionReceipt } from "@wagmi/core";
import { parseUnits } from "viem";
import { wagmiConfig } from "@/lib/chain/wagmi";
import { ADDRESSES, ERC20_ABI, SPLITTER_ABI, isSplitterConfigured } from "@/lib/chain/config";
import type { DataMode, Donation, DonateInput, Streamer, Campaign } from "./types";
import { MOCK_STREAMERS, MOCK_FEED, MOCK_REPUTATION, MOCK_CAMPAIGNS } from "./mock";
import { publishDonation } from "./donationStream";
import { useProfile } from "./ProfileProvider";

const USDC_DECIMALS = 6;

export class NotConfiguredError extends Error {
  constructor() {
    super("Contracts aren't deployed to testnet yet. Ask the backend dev for the splitter address and put it in lib/chain/config.ts.");
    this.name = "NotConfiguredError";
  }
}

interface CrownCtx {
  mode: DataMode;
  setMode: (m: DataMode) => void;
  ready: boolean;
  getStreamer: (handle: string) => Streamer | undefined;
  getCampaign: (handle: string, slug: string) => Campaign | undefined;
  feed: Donation[];
  // Reputation is per-streamer, keyed by handle — never a single global number (front.md §4).
  getReputation: (handle: string) => number;
  lastGainFor: (handle: string) => number | null;
  // Send a donation. In mock — a simulation with "Sending…". In chain — a real transaction.
  donate: (input: DonateInput, walletAddress?: `0x${string}`) => Promise<{ txHash?: string }>;
}

const Ctx = createContext<CrownCtx | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useProfile();
  const [mode, setModeState] = useState<DataMode>("mock");
  const [ready, setReady] = useState(false);

  // Mock state (lives in session memory; crown-app/api will replace this at F2).
  const [feed, setFeed] = useState<Donation[]>(MOCK_FEED);
  // Per-streamer reputation: { handle → points }. The viewer earns reputation with each streamer
  // separately; there is no global number.
  const [reputation, setReputation] = useState<Record<string, number>>(MOCK_REPUTATION);
  const [campaigns, setCampaigns] = useState<Record<string, Campaign>>(MOCK_CAMPAIGNS);
  const [lastGain, setLastGain] = useState<{ handle: string; amount: number } | null>(null);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? (localStorage.getItem("crown-mode") as DataMode | null) : null;
    if (saved === "mock" || saved === "chain") setModeState(saved);
    setReady(true);
  }, []);

  const setMode = useCallback((m: DataMode) => {
    setModeState(m);
    try {
      localStorage.setItem("crown-mode", m);
    } catch {}
  }, []);

  // Your own page (saved via /create or the page builder) resolves here too, not just the
  // built-in demo streamers — otherwise a real streamer's own /@handle link 404s.
  const getStreamer = useCallback(
    (handle: string): Streamer | undefined => {
      const key = handle.replace(/^@/, "").toLowerCase();
      if (profile && profile.address && profile.handle.toLowerCase() === key) {
        const { handle: h, name, bio, address, socials, tiers, donatePresets } = profile;
        return { handle: h, name, bio, address, socials, tiers, donatePresets };
      }
      return MOCK_STREAMERS[key];
    },
    [profile]
  );

  const getCampaign = useCallback(
    (handle: string, slug: string) => campaigns[`${handle.replace(/^@/, "").toLowerCase()}/${slug}`],
    [campaigns]
  );

  const applyMockDonation = useCallback((input: DonateInput) => {
    const key = input.handle.replace(/^@/, "").toLowerCase();
    const from = (input.name || "You").trim() || "You";
    const message = input.message?.trim() || undefined;
    const today = new Date().toISOString().slice(0, 10);
    const id = `d${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; // unique even within one ms
    setFeed((prev) => [
      { id, from, amount: input.amount, message, source: "direct", date: today, time: "just now", fresh: true },
      ...prev,
    ]);
    // Push to OBS overlays (other tabs) in real time — mock source of donation events.
    publishDonation({ handle: key, from, amount: input.amount, message, ts: Date.now() });
    // Reputation accrues to THIS streamer only.
    setReputation((r) => ({ ...r, [key]: (r[key] ?? 0) + input.amount }));
    setLastGain({ handle: key, amount: input.amount });
    setTimeout(() => setLastGain(null), 2600);
    // Only bump a campaign's total when the donation was actually made on that campaign's page.
    if (input.slug) {
      const campKey = `${key}/${input.slug}`;
      setCampaigns((prev) => {
        const c = prev[campKey];
        if (!c) return prev;
        return { ...prev, [campKey]: { ...c, raised: c.raised + input.amount, count: c.count + 1 } };
      });
    }
  }, []);

  const donate = useCallback<CrownCtx["donate"]>(
    async (input, walletAddress) => {
      if (mode === "mock") {
        await new Promise((r) => setTimeout(r, 1200));
        applyMockDonation(input);
        return {};
      }

      // chain
      if (!isSplitterConfigured()) throw new NotConfiguredError();
      if (!walletAddress) throw new Error("Connect your wallet first.");
      const streamer = getStreamer(input.handle);
      if (!streamer) throw new Error("Streamer not found.");

      const gross = parseUnits(String(input.amount), USDC_DECIMALS);

      const allowance = (await readContract(wagmiConfig, {
        address: ADDRESSES.usdc,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [walletAddress, ADDRESSES.splitter],
      })) as bigint;

      if (allowance < gross) {
        const approveHash = await writeContract(wagmiConfig, {
          address: ADDRESSES.usdc,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [ADDRESSES.splitter, gross],
        });
        await waitForTransactionReceipt(wagmiConfig, { hash: approveHash });
      }

      const txHash = await writeContract(wagmiConfig, {
        address: ADDRESSES.splitter,
        abi: SPLITTER_ABI,
        functionName: "donate",
        args: [streamer.address, gross],
      });
      await waitForTransactionReceipt(wagmiConfig, { hash: txHash });
      return { txHash };
    },
    [mode, applyMockDonation, getStreamer]
  );

  const getReputation = useCallback((handle: string) => reputation[handle.replace(/^@/, "").toLowerCase()] ?? 0, [reputation]);
  const lastGainFor = useCallback(
    (handle: string) => (lastGain && lastGain.handle === handle.replace(/^@/, "").toLowerCase() ? lastGain.amount : null),
    [lastGain]
  );

  const value = useMemo<CrownCtx>(
    () => ({ mode, setMode, ready, getStreamer, getCampaign, feed, getReputation, lastGainFor, donate }),
    [mode, setMode, ready, getStreamer, getCampaign, feed, getReputation, lastGainFor, donate]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCrown() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCrown must be used inside DataProvider");
  return ctx;
}

"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { readContract, writeContract, waitForTransactionReceipt } from "@wagmi/core";
import { parseUnits } from "viem";
import { wagmiConfig } from "@/lib/chain/wagmi";
import { ADDRESSES, ERC20_ABI, SPLITTER_ABI, isSplitterConfigured } from "@/lib/chain/config";
import type { DataMode, Donation, DonateInput, Streamer, Campaign } from "./types";
import { MOCK_STREAMERS, MOCK_FEED, MOCK_REPUTATION, MOCK_CAMPAIGNS } from "./mock";

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
  reputation: number;
  lastGain: number | null;
  // Send a donation. In mock — a simulation with "Sending…". In chain — a real transaction.
  donate: (input: DonateInput, walletAddress?: `0x${string}`) => Promise<{ txHash?: string }>;
}

const Ctx = createContext<CrownCtx | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<DataMode>("mock");
  const [ready, setReady] = useState(false);

  // Mock state (lives in session memory; crown-app/api will replace this at F2).
  const [feed, setFeed] = useState<Donation[]>(MOCK_FEED);
  const [reputation, setReputation] = useState<number>(MOCK_REPUTATION.kira ?? 0);
  const [campaigns, setCampaigns] = useState<Record<string, Campaign>>(MOCK_CAMPAIGNS);
  const [lastGain, setLastGain] = useState<number | null>(null);

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

  const getStreamer = useCallback((handle: string) => {
    return MOCK_STREAMERS[handle.replace(/^@/, "").toLowerCase()];
  }, []);

  const getCampaign = useCallback(
    (handle: string, slug: string) => campaigns[`${handle.replace(/^@/, "").toLowerCase()}/${slug}`],
    [campaigns]
  );

  const applyMockDonation = useCallback((input: DonateInput) => {
    const key = input.handle.replace(/^@/, "").toLowerCase();
    setFeed((prev) => [
      {
        id: `d${Date.now()}`,
        from: (input.name || "You").trim() || "You",
        amount: input.amount,
        message: input.message?.trim() || undefined,
        time: "just now",
        fresh: true,
      },
      ...prev,
    ]);
    setReputation((r) => r + input.amount);
    setLastGain(input.amount);
    setTimeout(() => setLastGain(null), 2600);
    setCampaigns((prev) => {
      const slugKey = Object.keys(prev).find((k) => k.startsWith(`${key}/`));
      if (!slugKey) return prev;
      const c = prev[slugKey];
      return { ...prev, [slugKey]: { ...c, raised: c.raised + input.amount, count: c.count + 1 } };
    });
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

  const value = useMemo<CrownCtx>(
    () => ({ mode, setMode, ready, getStreamer, getCampaign, feed, reputation, lastGain, donate }),
    [mode, setMode, ready, getStreamer, getCampaign, feed, reputation, lastGain, donate]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCrown() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCrown must be used inside DataProvider");
  return ctx;
}

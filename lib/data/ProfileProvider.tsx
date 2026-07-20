"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSolanaWallet } from "@/lib/chain/wallet";
import { buildAuthMessage } from "@/lib/chain/authMessage";
import type { Profile } from "./types";

const KEY = "crown-profile";

interface ProfileCtx {
  ready: boolean;
  profile: Profile | null;
  registered: boolean;
  save: (p: Profile) => void;
  reset: () => void;
}

const Ctx = createContext<ProfileCtx | null>(null);

// A streamer profile = "registration": localStorage is the cabinet's own copy,
// the Crown DB (/api/profiles) is the server copy public pages resolve against.
export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const wallet = useSolanaWallet();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setProfile(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  // Re-read when another document on this origin writes the profile. The `storage` event fires
  // in every same-origin document EXCEPT the one that made the change — so when the cabinet's
  // page builder saves, its live iframe preview (a separate document) picks the edit up here and
  // re-renders. Also keeps two open tabs of the app in sync.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== null && e.key !== KEY) return;
      try {
        const raw = localStorage.getItem(KEY);
        setProfile(raw ? JSON.parse(raw) : null);
      } catch {}
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const save = useCallback((p: Profile) => {
    setProfile(p);
    try {
      localStorage.setItem(KEY, JSON.stringify(p));
    } catch {}
    // Server copy (the Crown DB): what public pages, the feed indexer and other
    // browsers resolve against. Signed by the connected wallet when possible —
    // the server requires the OWNER's signature for real (non-demo) pages.
    // Fire-and-forget either way: a dead server or a declined signature must
    // never block editing; localStorage stays the cabinet's source of truth.
    void (async () => {
      const headers: Record<string, string> = { "content-type": "application/json" };
      if (wallet.connected && wallet.address) {
        const ts = Math.floor(Date.now() / 1000);
        const sig = await wallet.signMessage(await buildAuthMessage("profile", p.handle, ts, p));
        if (sig) {
          headers["x-crown-pubkey"] = wallet.address;
          headers["x-crown-ts"] = String(ts);
          headers["x-crown-signature"] = Buffer.from(sig).toString("base64");
        }
      }
      await fetch("/api/profiles", { method: "POST", headers, body: JSON.stringify(p) });
    })().catch(() => {});
  }, [wallet]);

  const reset = useCallback(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const handle = raw ? (JSON.parse(raw) as Profile).handle : null;
      if (handle) {
        void (async () => {
          const headers: Record<string, string> = {};
          if (wallet.connected && wallet.address) {
            const ts = Math.floor(Date.now() / 1000);
            const sig = await wallet.signMessage(await buildAuthMessage("delete", handle, ts, null));
            if (sig) {
              headers["x-crown-pubkey"] = wallet.address;
              headers["x-crown-ts"] = String(ts);
              headers["x-crown-signature"] = Buffer.from(sig).toString("base64");
            }
          }
          await fetch(`/api/profiles/${encodeURIComponent(handle)}`, { method: "DELETE", headers });
        })().catch(() => {});
      }
    } catch {}
    setProfile(null);
    try {
      localStorage.removeItem(KEY);
    } catch {}
  }, [wallet]);

  const value = useMemo<ProfileCtx>(
    () => ({ ready, profile, registered: !!profile, save, reset }),
    [ready, profile, save, reset]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProfile() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProfile must be used inside ProfileProvider");
  return ctx;
}

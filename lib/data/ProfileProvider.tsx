"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
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

// A streamer profile = "registration". Until crown-app/api exists, it lives in localStorage.
export function ProfileProvider({ children }: { children: React.ReactNode }) {
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
  }, []);

  const reset = useCallback(() => {
    setProfile(null);
    try {
      localStorage.removeItem(KEY);
    } catch {}
  }, []);

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

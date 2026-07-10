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

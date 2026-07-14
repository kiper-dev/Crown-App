"use client";

import { useEffect, useRef } from "react";
import { subscribeDonations, startDemo, type DonationEvent } from "./donationStream";

// Subscribe an overlay to its streamer's live donations (BroadcastChannel). `demo` fabricates
// donations on a timer so the overlay is lively in OBS without a real donor. The callback is kept in
// a ref so re-renders don't re-subscribe.
export function useDonationStream(handle: string, cb: (e: DonationEvent) => void, demo = false): void {
  const cbRef = useRef(cb);
  cbRef.current = cb;

  useEffect(() => {
    const unsub = subscribeDonations(handle, (e) => cbRef.current(e));
    const stopDemo = demo ? startDemo(handle) : undefined;
    return () => {
      unsub();
      stopDemo?.();
    };
  }, [handle, demo]);
}

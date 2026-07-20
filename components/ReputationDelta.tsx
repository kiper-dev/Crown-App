"use client";

import { tierInfo } from "@/lib/level";
import type { Tier } from "@/lib/data/types";
import styles from "./ReputationDelta.module.css";

// The "what this contribution does to your standing" row, shared by every mini-game's donate form
// (Task / Fundraiser / Roulette / Auction) so it reads identically everywhere and can't drift the
// way per-page copies would. $1 contributed = 1 reputation (front.md I §4), so `gain` is simply the
// amount about to be sent. The tier chip appears only when this contribution lifts the viewer into
// a new tier.
export function ReputationDelta({ rep, gain, tiers }: { rep: number; gain: number; tiers: Tier[] }) {
  const after = rep + Math.max(0, gain);
  const tierNow = tierInfo(rep, tiers).current;
  const tierAfter = tierInfo(after, tiers).current;
  return (
    <div className={styles.rep}>
      <span className={styles.repLabel}>Your reputation</span>
      <span className={styles.repVals}>
        <span className={`${styles.repNow} num`}>{rep}</span>
        <span className={styles.repArrow}>→</span>
        <span className={`${styles.repNext} num`}>{after}</span>
      </span>
      {tierAfter && tierAfter.name !== tierNow?.name && (
        <span className={styles.repTier} style={{ color: tierAfter.color }}>
          {tierAfter.name}
        </span>
      )}
    </div>
  );
}

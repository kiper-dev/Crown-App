"use client";

import { useEffect, useState } from "react";
import { Mono } from "@/components/Mono";
import { useDonationStream } from "@/lib/data/useDonationStream";
import { DEMO_GOAL, DEMO_GOAL_START } from "@/lib/data/overlays";
import type { DonationEvent } from "@/lib/data/donationStream";
import styles from "./Overlays.module.css";

interface Common {
  handle: string;
  demo?: boolean;
}

// ---- Alerts: one popup per donation, shown ~5s, queued so bursts don't overlap.
export function AlertsOverlay({ handle, demo }: Common) {
  const [queue, setQueue] = useState<DonationEvent[]>([]);
  const [current, setCurrent] = useState<DonationEvent | null>(null);

  useDonationStream(handle, (e) => setQueue((q) => [...q, e]), demo);

  // Dequeue the next alert when nothing is showing. No timer here — this effect re-runs whenever it
  // sets `current`, and a timer set here would be cleared on that same re-run (the freeze bug).
  useEffect(() => {
    if (current || queue.length === 0) return;
    setCurrent(queue[0]);
    setQueue((q) => q.slice(1));
  }, [queue, current]);

  // Dismiss the current alert after 5s. Keyed on `current` alone, so the timer lives its full life.
  useEffect(() => {
    if (!current) return;
    const t = setTimeout(() => setCurrent(null), 5000);
    return () => clearTimeout(t);
  }, [current]);

  return (
    <div className={`${styles.stage} ${styles.stageTop}`}>
      {current && (
        <div className={styles.alert} key={current.ts}>
          <Mono name={current.from} size={46} />
          <div className={styles.alertBody}>
            <div className={styles.alertLine}>
              <b>{current.from}</b> donated <span className={styles.alertAmt}>${current.amount}</span>
            </div>
            {current.message && <div className={styles.alertMsg}>{current.message}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Goal: a progress bar that grows with every donation.
export function GoalOverlay({ handle, demo, title = "Stream goal", goal = DEMO_GOAL, raised: raised0 = DEMO_GOAL_START }: Common & { title?: string; goal?: number; raised?: number }) {
  const [raised, setRaised] = useState(raised0);
  useDonationStream(handle, (e) => setRaised((r) => r + e.amount), demo);

  const pct = Math.min(100, goal > 0 ? (raised / goal) * 100 : 0);
  return (
    <div className={`${styles.stage} ${styles.stageBottom}`}>
      <div className={styles.goal}>
        <div className={styles.goalTop}>
          <span className={styles.goalTitle}>{title}</span>
          <span className={`${styles.goalNums} num`}>
            <b>${Math.round(raised)}</b> / ${goal}
          </span>
        </div>
        <div className={styles.goalTrack}>
          <div className={styles.goalFill} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

// ---- Top donors: a live leaderboard, aggregated by name.
const DEMO_SEED: Record<string, number> = { Timur: 120, anna_k: 75, Whale: 50 };

export function TopOverlay({ handle, demo }: Common) {
  const [totals, setTotals] = useState<Record<string, number>>(demo ? { ...DEMO_SEED } : {});
  useDonationStream(handle, (e) => setTotals((t) => ({ ...t, [e.from]: (t[e.from] ?? 0) + e.amount })), demo);

  const rows = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className={`${styles.stage} ${styles.stageLeft}`}>
      <div className={styles.top}>
        <div className={styles.topHead}>Top donors</div>
        {rows.length === 0 ? (
          <div className={styles.topEmpty}>Waiting for donations…</div>
        ) : (
          rows.map(([name, total], i) => (
            <div className={styles.topRow} key={name}>
              <span className={styles.topRank}>{i + 1}</span>
              <span className={styles.topName}>{name}</span>
              <span className={`${styles.topAmt} num`}>${total}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

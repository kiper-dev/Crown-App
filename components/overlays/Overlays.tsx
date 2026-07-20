"use client";

import { useEffect, useRef, useState } from "react";
import { Mono } from "@/components/Mono";
import { CrownFill } from "@/components/CrownFill";
import { CrownMark, GameIcon } from "@/components/icons";
import { useDonationStream } from "@/lib/data/useDonationStream";
import { DEMO_GOAL, DEMO_GOAL_START, DEMO_FUNDRAISER_GOAL, OVERLAY_TIERS } from "@/lib/data/overlays";
import { readRound, readRoundMeta } from "@/lib/data/roulette";
import { readTasks, type GameTask } from "@/lib/data/tasks";
import { raisedTotal } from "@/lib/data/fundraiser";
import { readLots, readAuctionMeta, leaderboard, lotSum, type AuctionLot } from "@/lib/data/auction";
import { firstActiveScope } from "@/lib/data/gameSessions";
import type { RouletteSuggestion } from "@/lib/data/roulette-mock";
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

// ---- Rank-up: a popup when a viewer's running total crosses a tier threshold.
interface RankEvent {
  name: string;
  tier: string;
  ts: number;
}
const RANK_DEMO: { name: string; tier: string }[] = [
  { name: "Timur", tier: "VIP" },
  { name: "anna_k", tier: "Regular" },
  { name: "Whale", tier: "Legend" },
];

export function RankOverlay({ handle, demo }: Common) {
  const [current, setCurrent] = useState<RankEvent | null>(null);
  const totals = useRef<Record<string, number>>({});
  const nonce = useRef(0);

  // Real rank-ups: a donation that pushes a viewer's running total past a tier threshold.
  useDonationStream(
    handle,
    (e) => {
      const prev = totals.current[e.from] ?? 0;
      const next = prev + e.amount;
      totals.current[e.from] = next;
      const crossed = OVERLAY_TIERS.filter((t) => prev < t.at && next >= t.at).pop();
      if (crossed) setCurrent({ name: e.from, tier: crossed.name, ts: ++nonce.current });
    },
    demo,
  );

  // Demo: cycle a few sample rank-ups so the overlay is lively on its own.
  useEffect(() => {
    if (!demo) return;
    let i = -1;
    const tick = () => {
      i = (i + 1) % RANK_DEMO.length;
      setCurrent({ ...RANK_DEMO[i], ts: ++nonce.current });
    };
    tick();
    const t = setInterval(tick, 4200);
    return () => clearInterval(t);
  }, [demo]);

  // Auto-dismiss the real path (the demo path swaps on its own interval).
  useEffect(() => {
    if (!current || demo) return;
    const t = setTimeout(() => setCurrent(null), 5000);
    return () => clearTimeout(t);
  }, [current, demo]);

  return (
    <div className={`${styles.stage} ${styles.stageTop}`}>
      {current && (
        <div className={styles.rank} key={current.ts}>
          <span className={styles.rankBadge}>
            <CrownMark />
          </span>
          <div className={styles.alertBody}>
            <div className={styles.alertLine}>
              <b>{current.name}</b> reached <span className={styles.rankTier}>{current.tier}</span>
            </div>
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

// ---- Roulette: the live wheel — the pot and what's winning right now. Reads the shared round
// store (seeded, so it's populated even without a real round) and polls for changes.
export function RouletteOverlay({ handle }: Common) {
  const [round, setRound] = useState<RouletteSuggestion[]>([]);
  const [winner, setWinner] = useState<string | null>(null);

  useEffect(() => {
    const load = () => {
      const scope = firstActiveScope(handle, "roulette");
      setRound(readRound(scope));
      setWinner(readRoundMeta(scope)?.winner?.title ?? null);
    };
    load();
    const t = setInterval(load, 1500);
    return () => clearInterval(t);
  }, [handle]);

  const total = round.reduce((s, r) => s + r.pool, 0);
  const rows = [...round].sort((a, b) => b.pool - a.pool).slice(0, 3);

  return (
    <div className={`${styles.stage} ${styles.stageLeft}`}>
      <div className={styles.game}>
        <div className={styles.gameHead}>
          <GameIcon id="roulette" width={16} height={16} />
          Roulette
          <span className={`${styles.gamePot} num`}>${total} pot</span>
        </div>
        {winner ? (
          <div className={styles.gameWinner}>🏆 {winner}</div>
        ) : (
          rows.map((r) => {
            const pct = total > 0 ? Math.round((r.pool / total) * 100) : 0;
            return (
              <div className={styles.gameRow} key={r.id}>
                <span className={styles.gameName}>{r.title}</span>
                <span className={styles.gameBar}>
                  <span style={{ width: `${pct}%` }} />
                </span>
                <span className={`${styles.gamePct} num`}>{pct}%</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ---- Task: the active paid task and its state. Reads the shared task store (seeded), polls.
export function TaskOverlay({ handle }: Common) {
  const [task, setTask] = useState<GameTask | null>(null);

  useEffect(() => {
    const load = () => {
      const open = readTasks(firstActiveScope(handle, "task")).filter((t) => t.state === "pending" || t.state === "active");
      setTask(open[0] ?? null);
    };
    load();
    const t = setInterval(load, 1500);
    return () => clearInterval(t);
  }, [handle]);

  if (!task) return <div className={`${styles.stage} ${styles.stageBottom}`} />;

  return (
    <div className={`${styles.stage} ${styles.stageBottom}`}>
      <div className={styles.game}>
        <div className={styles.gameHead}>
          <GameIcon id="task" width={16} height={16} />
          Task
          <span className={`${styles.gamePot} num`}>${task.amount}</span>
        </div>
        <div className={styles.gameText}>{task.text}</div>
        <div className={styles.gameSub}>
          {task.from} · {task.state === "active" ? "in progress" : "awaiting you"}
        </div>
      </div>
    </div>
  );
}

// ---- Auction: the live lot board — top accepted lots by sum, or the winner once sold. Polls.
export function AuctionOverlay({ handle }: Common) {
  const [board, setBoard] = useState<AuctionLot[]>([]);
  const [winner, setWinner] = useState<AuctionLot | null>(null);

  useEffect(() => {
    const load = () => {
      const scope = firstActiveScope(handle, "auction");
      const lots = readLots(scope);
      const meta = readAuctionMeta(scope);
      setBoard(leaderboard(lots).slice(0, 3));
      setWinner(meta?.winnerId ? lots.find((l) => l.id === meta.winnerId) ?? null : null);
    };
    load();
    const t = setInterval(load, 1500);
    return () => clearInterval(t);
  }, [handle]);

  const top = board[0] ? lotSum(board[0]) : 0;

  return (
    <div className={`${styles.stage} ${styles.stageLeft}`}>
      <div className={styles.game}>
        <div className={styles.gameHead}>
          <GameIcon id="auction" width={16} height={16} />
          Auction
          <span className={`${styles.gamePot} num`}>${winner ? lotSum(winner) : top} {winner ? "sold" : "leads"}</span>
        </div>
        {winner ? (
          <div className={styles.gameText}>“{winner.text}”</div>
        ) : board.length === 0 ? (
          <div className={styles.gameSub}>no lots on the board yet</div>
        ) : (
          board.map((l) => {
            const pct = top > 0 ? Math.round((lotSum(l) / top) * 100) : 0;
            return (
              <div className={styles.gameRow} key={l.id}>
                <span className={styles.gameName}>{l.text}</span>
                <span className={styles.gameBar}>
                  <span style={{ width: `${pct}%` }} />
                </span>
                <span className={`${styles.gamePct} num`}>${lotSum(l)}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ---- Fundraiser: a crown that fills toward the goal as viewers chip in. Reads raised total, polls.
export function FundraiserOverlay({ handle }: Common) {
  const [raised, setRaised] = useState(0);

  useEffect(() => {
    const load = () => setRaised(raisedTotal(firstActiveScope(handle, "fundraiser")));
    load();
    const t = setInterval(load, 1500);
    return () => clearInterval(t);
  }, [handle]);

  const goal = DEMO_FUNDRAISER_GOAL;
  const pct = Math.min(1, goal > 0 ? raised / goal : 0);

  return (
    <div className={`${styles.stage} ${styles.stageBottom}`}>
      <div className={styles.fund}>
        <CrownFill pct={pct} size={60} />
        <div className={styles.fundBody}>
          <div className={styles.fundPct}>{Math.round(pct * 100)}%</div>
          <div className={`${styles.fundNums} num`}>
            <b>${Math.round(raised)}</b> / ${goal}
          </div>
        </div>
      </div>
    </div>
  );
}

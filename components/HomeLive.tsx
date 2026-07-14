"use client";

import { useEffect, useState } from "react";
import { GameIcon } from "@/components/icons";
import { readRound, readRoundMeta } from "@/lib/data/roulette";
import { readStatus, raisedTotal, withFundraiserDefaults } from "@/lib/data/fundraiser";
import { readTasks } from "@/lib/data/tasks";
import type { GameId } from "@/lib/data/games";
import type { Profile } from "@/lib/data/types";
import styles from "./HomeLive.module.css";

interface Live {
  roulette: { pot: number; count: number } | null;
  fundraiser: { pledge: string; goal: number; raised: number; state: string } | null;
  tasks: { active: number; pending: number; texts: string[] } | null;
}

// The games that are running right now, surfaced on Home so the streamer sees them without
// digging into each game's Overview. Reads the same mock stores the Overview tabs write to,
// so it stays in step. Renders nothing until mounted (localStorage is client-only) and nothing
// when no game is live.
export function HomeLive({ profile, onOpen }: { profile: Profile; onOpen: (g: GameId) => void }) {
  const handle = profile.handle;
  const [live, setLive] = useState<Live | null>(null);

  useEffect(() => {
    const round = readRound(handle);
    const meta = readRoundMeta(handle);
    const roulette = round.length > 0 && !meta?.winner ? { pot: round.reduce((s, r) => s + r.pool, 0), count: round.length } : null;

    const st = readStatus(handle);
    const fr = withFundraiserDefaults(profile);
    const fundraiser =
      st.state === "collecting" || st.state === "delivering"
        ? { pledge: fr.pledge, goal: fr.goal, raised: raisedTotal(handle), state: st.state }
        : null;

    const open = readTasks(handle).filter((t) => t.state === "pending" || t.state === "active");
    const tasks = open.length
      ? {
          active: open.filter((t) => t.state === "active").length,
          pending: open.filter((t) => t.state === "pending").length,
          texts: open.slice(0, 2).map((t) => t.text),
        }
      : null;

    setLive({ roulette, fundraiser, tasks });
  }, [handle, profile]);

  if (!live) return null;
  if (!live.roulette && !live.fundraiser && !live.tasks) return null;

  return (
    <section>
      <div className={styles.head}>Live now</div>
      <div className={styles.grid}>
        {live.roulette && (
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <GameIcon id="roulette" width={18} height={18} />
              <span className={styles.cardTitle}>Roulette</span>
              <span className="pill ok" style={{ marginLeft: "auto" }}>
                <span className="dot" />
                Round open
              </span>
            </div>
            <div className={styles.stat}>
              <b className="num">{live.roulette.pot} $</b> in the pot · {live.roulette.count} suggestions
            </div>
            <div className={styles.spacer} />
            <button type="button" className="btn-outline" style={{ alignSelf: "flex-start" }} onClick={() => onOpen("roulette")}>
              Manage round
            </button>
          </div>
        )}

        {live.fundraiser && (
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <GameIcon id="fundraiser" width={18} height={18} />
              <span className={styles.cardTitle}>Fundraiser</span>
              <span className={`pill ${live.fundraiser.state === "delivering" ? "attn" : "ok"}`} style={{ marginLeft: "auto" }}>
                <span className="dot" />
                {live.fundraiser.state === "delivering" ? "Delivering" : "Collecting"}
              </span>
            </div>
            {live.fundraiser.pledge && <div className={styles.pledge}>{live.fundraiser.pledge}</div>}
            <div className={styles.bar}>
              <div className={styles.barFill} style={{ width: `${Math.min(100, Math.round((live.fundraiser.raised / live.fundraiser.goal) * 100))}%` }} />
            </div>
            <div className={styles.stat}>
              <b className="num">{live.fundraiser.raised} $</b> of {live.fundraiser.goal} $ ·{" "}
              {Math.min(100, Math.round((live.fundraiser.raised / live.fundraiser.goal) * 100))}%
            </div>
            <div className={styles.spacer} />
            <button type="button" className="btn-outline" style={{ alignSelf: "flex-start" }} onClick={() => onOpen("fundraiser")}>
              Manage fundraiser
            </button>
          </div>
        )}

        {live.tasks && (
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <GameIcon id="task" width={18} height={18} />
              <span className={styles.cardTitle}>Tasks</span>
              <span className={`pill ${live.tasks.pending ? "attn" : "ok"}`} style={{ marginLeft: "auto" }}>
                <span className="dot" />
                {live.tasks.pending ? `${live.tasks.pending} awaiting` : `${live.tasks.active} running`}
              </span>
            </div>
            <div className={styles.stat}>
              <b className="num">{live.tasks.active}</b> running · <b className="num">{live.tasks.pending}</b> awaiting you
            </div>
            <div className={styles.tlist}>
              {live.tasks.texts.map((t, i) => (
                <div key={i} className={styles.titem}>
                  {t}
                </div>
              ))}
            </div>
            <div className={styles.spacer} />
            <button type="button" className="btn-outline" style={{ alignSelf: "flex-start" }} onClick={() => onOpen("task")}>
              Manage tasks
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

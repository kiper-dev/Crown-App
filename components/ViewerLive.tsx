"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GameIcon } from "@/components/icons";
import { readRound, readRoundMeta } from "@/lib/data/roulette";
import { readStatus, raisedTotal, withFundraiserDefaults } from "@/lib/data/fundraiser";
import { readTasks } from "@/lib/data/tasks";
import { readLots, readAuctionMeta, leaderboard as auctionBoard, lotSum } from "@/lib/data/auction";
import { firstActiveScope } from "@/lib/data/gameSessions";
import type { Profile } from "@/lib/data/types";
import styles from "./ViewerLive.module.css";

interface Live {
  roulette: { pot: number; count: number } | null;
  fundraiser: { pledge: string; goal: number; raised: number } | null;
  tasks: { active: number; pending: number; texts: string[] } | null;
  auction: { top: number; topText: string; lots: number } | null;
}

// The viewer's side of "Live now": the games running on this stream right now, each with a way to
// take part (suggest a game, chip in). Reads the same mock stores the streamer's cabinet writes to.
// Renders nothing until mounted (localStorage is client-only) and nothing when no game is live.
export function ViewerLive({ handle, name }: { handle: string; name: string }) {
  const [live, setLive] = useState<Live | null>(null);

  useEffect(() => {
    const rlScope = firstActiveScope(handle, "roulette");
    const frScope = firstActiveScope(handle, "fundraiser");
    const tkScope = firstActiveScope(handle, "task");
    const auScope = firstActiveScope(handle, "auction");
    const round = readRound(rlScope);
    const meta = readRoundMeta(rlScope);
    const roulette = round.length > 0 && !meta?.winner ? { pot: round.reduce((s, r) => s + r.pool, 0), count: round.length } : null;

    const st = readStatus(frScope);
    const fr = withFundraiserDefaults({ handle } as Profile);
    const fundraiser =
      st.state === "collecting" || st.state === "delivering" ? { pledge: fr.pledge, goal: fr.goal, raised: raisedTotal(frScope) } : null;

    const open = readTasks(tkScope).filter((t) => t.state === "pending" || t.state === "active");
    const tasks = open.length
      ? { active: open.filter((t) => t.state === "active").length, pending: open.filter((t) => t.state === "pending").length, texts: open.slice(0, 3).map((t) => t.text) }
      : null;

    const am = readAuctionMeta(auScope);
    const ab = auctionBoard(readLots(auScope));
    const auction =
      am?.state === "bidding" && ab.length > 0 ? { top: lotSum(ab[0]), topText: ab[0].text, lots: ab.length } : null;

    setLive({ roulette, fundraiser, tasks, auction });
  }, [handle]);

  if (!live || (!live.roulette && !live.fundraiser && !live.tasks && !live.auction)) return null;

  const pct = live.fundraiser ? Math.min(100, Math.round((live.fundraiser.raised / Math.max(1, live.fundraiser.goal)) * 100)) : 0;

  return (
    <section className={styles.wrap}>
      <div className={styles.head}>
        <span className={styles.liveDot} aria-hidden />
        Live on stream now
      </div>
      <div className={styles.grid}>
        {live.roulette && (
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <GameIcon id="roulette" width={18} height={18} />
              <span className={styles.cardTitle}>Game roulette</span>
              <span className="pill ok" style={{ marginLeft: "auto" }}>
                <span className="dot" />
                Round open
              </span>
            </div>
            <div className={styles.stat}>
              <b className="num">{live.roulette.pot} $</b> in the pot · {live.roulette.count} games suggested
            </div>
            <p className={styles.blurb}>Pitch a game by donating to it — the wheel spins weighted by the pot.</p>
            <div className={styles.spacer} />
            <Link className={styles.cta} href={`/@${handle}/roulette`}>
              Suggest a game →
            </Link>
          </div>
        )}

        {live.fundraiser && (
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <GameIcon id="fundraiser" width={18} height={18} />
              <span className={styles.cardTitle}>Fundraiser</span>
              <span className="pill ok" style={{ marginLeft: "auto" }}>
                <span className="dot" />
                Collecting
              </span>
            </div>
            {live.fundraiser.pledge && <p className={styles.blurb}>{live.fundraiser.pledge}</p>}
            <div className={styles.bar}>
              <div className={styles.barFill} style={{ width: `${pct}%` }} />
            </div>
            <div className={styles.stat}>
              <b className="num">{live.fundraiser.raised} $</b> of {live.fundraiser.goal} $ · {pct}%
            </div>
            <div className={styles.spacer} />
            <Link className={styles.cta} href={`/@${handle}/fundraiser`}>
              Chip in →
            </Link>
          </div>
        )}

        {live.tasks && (
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <GameIcon id="task" width={18} height={18} />
              <span className={styles.cardTitle}>Tasks for a donation</span>
              <span className="pill ok" style={{ marginLeft: "auto" }}>
                <span className="dot" />
                {live.tasks.active} running
              </span>
            </div>
            <p className={styles.blurb}>What viewers are paying {name} to do right now:</p>
            <div className={styles.tlist}>
              {live.tasks.texts.map((t, i) => (
                <div key={i} className={styles.titem}>
                  {t}
                </div>
              ))}
            </div>
          </div>
        )}
        {live.auction && (
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <GameIcon id="auction" width={18} height={18} />
              <span className={styles.cardTitle}>Auction</span>
              <span className="pill ok" style={{ marginLeft: "auto" }}>
                <span className="dot" />
                Bidding open
              </span>
            </div>
            <div className={styles.stat}>
              <b className="num">{live.auction.top} $</b> leads · {live.auction.lots} lot{live.auction.lots > 1 ? "s" : ""} on the board
            </div>
            <p className={styles.blurb}>“{live.auction.topText}” — outbid it, top it up, or place your own condition.</p>
            <div className={styles.spacer} />
            <Link className={styles.cta} href={`/@${handle}/auction`}>
              Outbid it →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

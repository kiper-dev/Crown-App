"use client";

import { useEffect, useState } from "react";
import { Mono } from "@/components/Mono";
import { StatTile } from "@/components/ops";
import { DEFAULT_FUNDRAISER_CONFIG } from "@/components/FundraiserGameSettings";
import {
  withFundraiserDefaults,
  readBackers,
  raisedTotal,
  readStatus,
  writeStatus,
  type Backer,
  type FundraiserStatus,
} from "@/lib/data/fundraiser";
import type { Profile } from "@/lib/data/types";
import styles from "./GameOverview.module.css";

// The streamer's live view of the running fundraiser — the accept/deliver decisions the settings
// only describe. Chip-ins land in escrow (raised = seeded backers + real test chip-ins); accept
// the amount to start the delivery clock, then deliver — or refund everyone. State sticks in the
// shared mock store (lib/data/fundraiser.ts).
export function FundraiserOverview({ profile, scope }: { profile: Profile; scope?: string }) {
  const handle = scope ?? profile.handle;
  const fr = withFundraiserDefaults(profile);
  const cfg = profile.fundraiserConfig ?? DEFAULT_FUNDRAISER_CONFIG;

  const [raised, setRaised] = useState(0);
  const [backers, setBackers] = useState<Backer[]>([]);
  const [status, setStatus] = useState<FundraiserStatus>({ state: "collecting" });

  useEffect(() => {
    setRaised(raisedTotal(handle));
    setBackers(readBackers(handle));
    setStatus(readStatus(handle));
  }, [handle]);

  const goal = fr.goal;
  const pct = Math.min(100, Math.round((raised / goal) * 100));
  // Where "Accept" unlocks: the min % of goal (or the full goal when partials are off).
  const acceptThreshold = cfg.allowBelowGoal ? Math.ceil((goal * cfg.minAcceptPct) / 100) : goal;
  const markPct = cfg.allowBelowGoal ? Math.min(100, cfg.minAcceptPct) : 100;
  const canAccept = raised >= acceptThreshold;

  function set(next: FundraiserStatus) {
    setStatus(writeStatus(handle, next));
  }

  return (
    <div className={styles.col}>
      <div className="footnote">
        Chip-ins land in escrow. Accept the amount when you&apos;re ready, then deliver within your window — or
        everyone&apos;s refunded.
      </div>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className={styles.promise}>{fr.pledge || "Set your promise on the Page tab."}</div>
        <div className={styles.progress}>
          <div className={styles.bar}>
            <div className={styles.barFill} style={{ width: `${pct}%` }} />
            {markPct < 100 && (
              <div className={styles.barMark} style={{ left: `${markPct}%` }} title={`Accept unlocks at ${cfg.minAcceptPct}% of goal`} />
            )}
          </div>
          <div className={styles.progressMeta}>
            <span>
              <b className="num">{raised} $</b> of {goal} $
            </span>
            <span>
              {pct}% · {backers.length} backers
            </span>
          </div>
        </div>
      </div>

      <div className="stat-grid">
        <StatTile k="Raised" v={`${raised} $`} />
        <StatTile k="Goal" v={`${goal} $`} />
        <StatTile k="Backers" v={String(backers.length)} />
      </div>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {status.state === "collecting" && (
          <>
            <div className={styles.statusRow}>
              <button type="button" className="btn" disabled={!canAccept} onClick={() => set({ state: "delivering", accepted: raised })}>
                Accept {raised} $
              </button>
            </div>
            <div className="footnote">
              {canAccept
                ? `Collection runs ${cfg.fundingDays} days. Accepting starts your ${cfg.deliveryDays}-day delivery window.`
                : `Accept unlocks at ${acceptThreshold} $ — ${cfg.allowBelowGoal ? `${cfg.minAcceptPct}% of the goal` : "the full goal"}.`}
            </div>
          </>
        )}

        {status.state === "delivering" && (
          <>
            <span className="pill attn" style={{ alignSelf: "flex-start" }}>
              <span className="dot" />
              Delivering — accepted {status.accepted} $
            </span>
            <div className={styles.statusRow}>
              <button type="button" className="btn" onClick={() => set({ state: "delivered" })}>
                Mark delivered
              </button>
              <button type="button" className="btn-outline" onClick={() => set({ state: "refunded" })}>
                Refund everyone
              </button>
            </div>
            <div className="footnote">Deliver within {cfg.deliveryDays} days of accepting — your reputation holders confirm it.</div>
          </>
        )}

        {status.state === "delivered" && (
          <>
            <span className="pill ok" style={{ alignSelf: "flex-start" }}>
              <span className="dot" />
              Delivered — the payout is yours
            </span>
            <div className="footnote">Every backer earned reputation for exactly what they put in.</div>
            <button type="button" className="btn-outline" style={{ alignSelf: "flex-start" }} onClick={() => set({ state: "collecting" })}>
              Reset demo
            </button>
          </>
        )}

        {status.state === "refunded" && (
          <>
            <span className="pill wait" style={{ alignSelf: "flex-start" }}>
              <span className="dot" />
              Refunded to backers
            </span>
            <div className="footnote">Nobody earned reputation — the promise wasn&apos;t delivered.</div>
            <button type="button" className="btn-outline" style={{ alignSelf: "flex-start" }} onClick={() => set({ state: "collecting" })}>
              Reset demo
            </button>
          </>
        )}
      </div>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div className={styles.head}>Backers</div>
        <div className={styles.backers}>
          {backers.map((b, i) => (
            <div key={i} className={styles.backer}>
              <Mono name={b.name} size={36} />
              <span className={styles.backerName}>{b.name}</span>
              <span className={styles.when}>{b.when}</span>
              <span className={styles.backerAmt}>
                <span className="num">{b.amount}</span> $
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="notice">
        <b>Fixed by the contract, not a setting here:</b> deliver and the pot is yours; miss it — even with the goal met
        — and every backer is refunded exactly what they put in.
      </div>
    </div>
  );
}

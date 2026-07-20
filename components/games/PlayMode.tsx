"use client";

import { useState } from "react";
import type { GameId } from "@/lib/data/games";
import { LiveOverlays, type OverlayEvent } from "./LiveOverlays";
import styles from "./PlayMode.module.css";

// A playable simulation of the game — you set your knobs, you add the viewers' donations, you run
// it, and the OBS overlays underneath react to every step exactly as they would on stream.
// Everything is local state: no data layer, no network, nothing persisted.

type Phase = "idle" | "setup" | "donations" | "result";

interface Donation {
  id: number;
  name: string;
  label: string; // the game suggested / the task text / "" for a plain contribution
  amount: number;
}

const VIEWER_NAMES = ["toffi", "demon_x", "mira.eth", "kk_live", "sasha", "n0va"];

// Per-game wording for the one form the sim uses — the shape is identical, only the words change.
const COPY: Record<GameId, { labelField: string; labelPh: string; addBtn: string; runBtn: string; running: string }> = {
  roulette: { labelField: "Game", labelPh: "Warcraft III", addBtn: "Add donation", runBtn: "Spin the wheel", running: "Spinning…" },
  task: { labelField: "The task", labelPh: "Beat the boss with no armor on", addBtn: "Offer task", runBtn: "Run the deadline", running: "Counting down…" },
  fundraiser: { labelField: "From", labelPh: "toffi", addBtn: "Chip in", runBtn: "Close the collection", running: "Collecting…" },
  auction: { labelField: "The condition", labelPh: "Hardest difficulty, no saves", addBtn: "Place a lot", runBtn: "Ring the bell", running: "Closing the bidding…" },
};

export function PlayMode({ id, title }: { id: GameId; title: string }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [min, setMin] = useState(id === "roulette" ? 3 : 5);
  const [goal, setGoal] = useState(2000);
  const [window_, setWindow] = useState(id === "roulette" ? "30 min" : "24h");
  const [donations, setDonations] = useState<Donation[]>([]);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [err, setErr] = useState("");
  const [running, setRunning] = useState(false);
  const [winner, setWinner] = useState<Donation | null>(null);
  const [events, setEvents] = useState<OverlayEvent[]>([]);
  // Auction's twist: a lot competes only once YOU accept it — this is the set of accepted labels.
  const [accepted, setAccepted] = useState<Set<string>>(new Set());

  const copy = COPY[id];
  const pot = donations.reduce((s, d) => s + d.amount, 0);

  function reset() {
    setPhase("idle");
    setDonations([]);
    setWinner(null);
    setEvents([]);
    setLabel("");
    setAmount("");
    setErr("");
    setRunning(false);
    setAccepted(new Set());
  }

  function toggleAccept(lbl: string) {
    setAccepted((prev) => {
      const next = new Set(prev);
      if (next.has(lbl)) next.delete(lbl);
      else next.add(lbl);
      return next;
    });
  }

  function addDonation() {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt < min) {
      setErr(`Minimum is $${min} — that's your rule`);
      return;
    }
    if (id !== "fundraiser" && !label.trim()) {
      setErr(`${copy.labelField} can't be empty`);
      return;
    }
    const name = id === "fundraiser" && label.trim() ? label.trim() : VIEWER_NAMES[donations.length % VIEWER_NAMES.length];
    const d: Donation = { id: donations.length + 1, name, label: label.trim(), amount: amt };
    setDonations((v) => [...v, d]);
    // the overlays react the instant a donation lands, same as on stream
    setEvents((v) => [...v, { kind: "donation", name: d.name, amount: d.amount, text: d.label }]);
    setLabel("");
    setAmount("");
    setErr("");
  }

  // The real weighting rule: odds are each suggestion's share of the pot.
  function pickWeighted(): Donation {
    const pools = new Map<string, number>();
    for (const d of donations) pools.set(d.label, (pools.get(d.label) ?? 0) + d.amount);
    let roll = Math.random() * pot;
    for (const [lbl, sum] of pools) {
      roll -= sum;
      if (roll <= 0) return donations.find((d) => d.label === lbl)!;
    }
    return donations[0];
  }

  // Auction's law: the richest ACCEPTED lot wins — no odds, no jury, just the biggest number.
  function pickRichestAccepted(): Donation | null {
    const sums = new Map<string, number>();
    for (const d of donations) if (accepted.has(d.label)) sums.set(d.label, (sums.get(d.label) ?? 0) + d.amount);
    let best: string | null = null;
    for (const [lbl, sum] of sums) if (best === null || sum > sums.get(best)!) best = lbl;
    return best ? donations.find((d) => d.label === best)! : null;
  }

  function run() {
    if (donations.length === 0) {
      setErr("Add at least one donation first");
      return;
    }
    if (id === "auction" && accepted.size === 0) {
      setErr("Accept at least one lot — unaccepted lots can't win");
      return;
    }
    setErr("");
    setRunning(true);
    setEvents((v) => [...v, { kind: id === "roulette" ? "spin" : "run" }]);

    window.setTimeout(
      () => {
        const w = id === "roulette" ? pickWeighted() : id === "auction" ? pickRichestAccepted() ?? donations[0] : donations[0];
        setWinner(w);
        setRunning(false);
        setPhase("result");
        const paidOut = id === "roulette" ? pot : id === "auction" ? donations.filter((d) => d.label === w.label).reduce((s, d) => s + d.amount, 0) : w.amount;
        setEvents((v) => [...v, { kind: "result", name: w.name, amount: paidOut, text: w.label }]);
      },
      id === "roulette" ? 2600 : 1400
    );
  }

  // pools per label, for the wheel + the result bars
  const pools = Array.from(
    donations.reduce((m, d) => {
      const key = id === "fundraiser" ? d.name : d.label;
      m.set(key, (m.get(key) ?? 0) + d.amount);
      return m;
    }, new Map<string, number>())
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <span className={styles.headTitle}>
          <span className={`${styles.dot}${phase === "idle" ? "" : " " + styles.dotLive}`} aria-hidden />
          Play mode
        </span>
        {phase !== "idle" && (
          <button className={styles.reset} onClick={reset}>
            Reset
          </button>
        )}
      </div>

      {phase === "idle" ? (
        <div className={styles.idle}>
          <p className={styles.idleLead}>
            Run {title} yourself — set your rules, play the viewers, see what lands on your stream.
          </p>
          <button className={styles.start} onClick={() => setPhase("setup")}>
            ▶ Start
          </button>
          <span className={styles.idleNote}>Nothing real happens. No wallet, no money.</span>
        </div>
      ) : (
        <div className={styles.sim}>
          {/* 1 — your rules */}
          <section className={styles.step}>
            <div className={styles.stepHead}>
              <span className={styles.stepNum}>1</span>
              Your rules
              <span className={styles.stepTag}>you set these</span>
            </div>
            <div className={styles.fields}>
              <label className={styles.field}>
                <span>Minimum</span>
                <div className={styles.inputWrap}>
                  <span className={styles.prefix}>$</span>
                  <input
                    className={styles.input}
                    type="number"
                    min={1}
                    value={min}
                    onChange={(e) => setMin(Math.max(1, Number(e.target.value) || 1))}
                  />
                </div>
              </label>
              {id === "fundraiser" ? (
                <label className={styles.field}>
                  <span>Goal</span>
                  <div className={styles.inputWrap}>
                    <span className={styles.prefix}>$</span>
                    <input
                      className={styles.input}
                      type="number"
                      min={1}
                      value={goal}
                      onChange={(e) => setGoal(Math.max(1, Number(e.target.value) || 1))}
                    />
                  </div>
                </label>
              ) : (
                <label className={styles.field}>
                  <span>{id === "roulette" ? "Round" : "Deadline"}</span>
                  <input className={styles.input} value={window_} onChange={(e) => setWindow(e.target.value)} />
                </label>
              )}
            </div>
          </section>

          {/* 2 — the viewers' donations */}
          <section className={styles.step}>
            <div className={styles.stepHead}>
              <span className={styles.stepNum}>2</span>
              The donations
              <span className={styles.stepTag}>you play the viewers</span>
            </div>
            <div className={styles.fields}>
              <label className={styles.field}>
                <span>{copy.labelField}</span>
                <input
                  className={styles.input}
                  value={label}
                  placeholder={copy.labelPh}
                  onChange={(e) => setLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addDonation()}
                />
              </label>
              <label className={`${styles.field} ${styles.fieldSm}`}>
                <span>Amount</span>
                <div className={styles.inputWrap}>
                  <span className={styles.prefix}>$</span>
                  <input
                    className={styles.input}
                    type="number"
                    value={amount}
                    placeholder={String(min * 10)}
                    onChange={(e) => setAmount(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addDonation()}
                  />
                </div>
              </label>
            </div>
            <button className={styles.add} onClick={addDonation}>
              + {copy.addBtn}
            </button>
            {err && <p className={styles.err}>{err}</p>}

            {donations.length > 0 && (
              <div className={styles.pools}>
                {pools.map(([lbl, sum]) => (
                  <div className={styles.pool} key={lbl}>
                    <span className={styles.poolName}>{lbl || "—"}</span>
                    {/* the auction's whole point: a lot competes only once you take it */}
                    {id === "auction" && (
                      <button
                        type="button"
                        className={`${styles.acceptChip}${accepted.has(lbl) ? " " + styles.acceptChipOn : ""}`}
                        onClick={() => toggleAccept(lbl)}
                      >
                        {accepted.has(lbl) ? "Accepted" : "Accept?"}
                      </button>
                    )}
                    <span className={styles.poolBar}>
                      <span style={{ width: `${(sum / pot) * 100}%`, opacity: id === "auction" && !accepted.has(lbl) ? 0.35 : 1 }} />
                    </span>
                    <span className={styles.poolNum}>${sum}</span>
                    <span className={styles.poolPct}>{Math.round((sum / pot) * 100)}%</span>
                  </div>
                ))}
                <div className={styles.potLine}>
                  <b className={styles.potNum}>${pot}</b>
                  {id === "fundraiser" ? ` of $${goal} · ${Math.min(100, Math.round((pot / goal) * 100))}%` : " in the pot"}
                </div>
              </div>
            )}
          </section>

          {/* 3 — run it */}
          <section className={styles.step}>
            <div className={styles.stepHead}>
              <span className={styles.stepNum}>3</span>
              Run it
            </div>

            {id === "roulette" && donations.length > 0 && (
              <div className={styles.wheelWrap}>
                <span className={styles.wheelPin} aria-hidden />
                <span
                  className={`${styles.wheel}${running ? " " + styles.wheelSpin : ""}`}
                  style={{ background: wheelGradient(pools, pot) }}
                  aria-hidden
                />
              </div>
            )}

            <button className={styles.run} onClick={run} disabled={running || donations.length === 0}>
              {running ? copy.running : copy.runBtn}
            </button>

            {winner && !running && (
              <div className={styles.result}>
                {id === "roulette" ? (
                  <>
                    <span className={styles.resultTag}>Winner</span>
                    <div className={styles.resultName}>{winner.label}</div>
                    <p className={styles.resultLine}>
                      You play it for {window_}. All <b>${pot}</b> is yours — losers&apos; money included.
                    </p>
                  </>
                ) : id === "auction" ? (
                  <>
                    <span className={styles.resultTag}>Richest lot wins</span>
                    <div className={styles.resultName}>“{winner.label}”</div>
                    <p className={styles.resultLine}>
                      <b>${donations.filter((d) => d.label === winner.label).reduce((s, d) => s + d.amount, 0)}</b> rides on it — every
                      other lot was refunded on the spot. Deliver it, your viewers confirm, and it&apos;s yours.
                    </p>
                  </>
                ) : id === "task" ? (
                  <>
                    <span className={styles.resultTag}>Completed</span>
                    <div className={styles.resultName}>“{winner.label}”</div>
                    <p className={styles.resultLine}>
                      <b>${winner.amount}</b> released to you · {winner.name} earned +{winner.amount} rep. Miss it instead and it all
                      goes back.
                    </p>
                  </>
                ) : (
                  <>
                    <span className={styles.resultTag}>{pot >= goal ? "Goal reached" : "Collection closed"}</span>
                    <div className={styles.resultName}>${pot} collected</div>
                    <p className={styles.resultLine}>
                      Deliver and it&apos;s yours, every backer earns rep. Don&apos;t, and all <b>${pot}</b> goes back — even at 100%.
                    </p>
                  </>
                )}
              </div>
            )}
          </section>
        </div>
      )}

      <LiveOverlays id={id} events={events} pot={pot} goal={goal} pools={pools} running={running} winner={winner?.label ?? null} />
    </div>
  );
}

// Conic gradient whose slices match each pool's share — the wheel is the odds, drawn.
function wheelGradient(pools: [string, number][], pot: number) {
  if (!pot) return "var(--bg-2)";
  const shades = ["var(--accent)", "var(--accent-down)", "var(--bg-3)", "var(--accent-hover)", "var(--bg-2)"];
  let at = 0;
  const stops = pools.map(([, sum], i) => {
    const from = at;
    at += (sum / pot) * 100;
    return `${shades[i % shades.length]} ${from}% ${at}%`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

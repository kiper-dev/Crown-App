"use client";

import { useEffect, useRef, useState } from "react";
import { CrownMark } from "./icons";
import styles from "./MoneyFlow.module.css";

const AMOUNTS = [5, 25, 100];

// Count a number toward `target` with an ease-out, so the figures visibly settle when the
// viewer picks a new amount — the same "live value" feel as a pro DeFi flow, but explaining
// the one thing that matters here: a direct donation lands in the streamer's wallet WHOLE.
// The splitter takes nothing (Crown-Core: "Комиссии нет"); the flat 3% exists only inside
// mini-game escrows and only on a successful payout — refunds are free.
function useCountUp(target: number, duration = 480) {
  const [val, setVal] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    if (typeof performance === "undefined" || typeof requestAnimationFrame === "undefined") {
      setVal(target);
      return;
    }
    const start = performance.now();
    const origin = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(origin + (target - origin) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function ViewerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={20} height={20} aria-hidden>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={20} height={20} aria-hidden>
      <rect x="3" y="6" width="18" height="13" rx="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="16.5" cy="14" r="1.3" fill="currentColor" />
    </svg>
  );
}

function Connector() {
  return (
    <div className={styles.connector} aria-hidden>
      <span className={styles.line} />
      <span className={styles.spark} />
      <span className={styles.head}>→</span>
    </div>
  );
}

export function MoneyFlow() {
  const [amount, setAmount] = useState(25);
  const gross = useCountUp(amount);
  const net = useCountUp(amount);
  const rep = Math.round(useCountUp(amount));

  return (
    <div className={styles.root}>
      <div className={styles.eyebrow}>How it works</div>
      <h2 className={styles.title}>
        A viewer sends. You get paid. <span className={styles.dim}>That&apos;s the whole thing.</span>
      </h2>

      <div className={styles.picker} role="group" aria-label="Donation amount">
        {AMOUNTS.map((a) => (
          <button key={a} type="button" className={`${styles.pick}${amount === a ? " " + styles.pickOn : ""}`} onClick={() => setAmount(a)}>
            ${a}
          </button>
        ))}
      </div>

      <div className={styles.flow}>
        <div className={styles.node}>
          <div className={styles.nodeTop}>
            <span className={styles.badge}>
              <ViewerIcon />
            </span>
            A viewer sends
          </div>
          <div className={styles.value}>{money(gross)}</div>
          <div className={styles.nodeSub}>in dollars (USDC)</div>
        </div>

        <Connector />

        <div className={`${styles.node} ${styles.nodeMuted}`}>
          <div className={styles.nodeTop}>
            <span className={styles.badge}>
              <CrownMark />
            </span>
            Smart contract
          </div>
          <div className={styles.value}>−{money(0)}</div>
          <div className={styles.nodeSub}>0% on direct donations — mini-games carry a flat 3% at payout</div>
        </div>

        <Connector />

        <div className={`${styles.node} ${styles.nodeHot}`}>
          <div className={styles.nodeTop}>
            <span className={styles.badge}>
              <WalletIcon />
            </span>
            You receive
          </div>
          <div className={styles.value}>{money(net)}</div>
          <div className={styles.nodeSub}>
            <span className={styles.rep}>+{rep} reputation</span>
          </div>
        </div>
      </div>

      <div className={styles.foot}>One on-chain transaction · no custody · lands instantly</div>
    </div>
  );
}

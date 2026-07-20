"use client";

import { useEffect, useState } from "react";
import { CrownMark, GameIcon } from "@/components/icons";
import { CrownFill } from "@/components/CrownFill";
import { OVERLAYS, type OverlayKind } from "@/lib/data/overlays";
import styles from "./ObsWidgets.module.css";

const TOP_DONORS: [string, string][] = [
  ["toffi", "$120"],
  ["demon_x", "$85"],
  ["mira.eth", "$60"],
];

// The actual widget mockups, drawn a bit larger — no captions, the widget is the whole point.
function Widget({ kind }: { kind: OverlayKind }) {
  if (kind === "alerts") {
    return (
      <div className={styles.alert}>
        <span className={styles.alertAvatar} aria-hidden>
          T
        </span>
        <div className={styles.alertBody}>
          <div className={styles.alertRow}>
            <span className={styles.alertName}>toffi</span>
            <span className={styles.amtPill}>$50</span>
          </div>
          <span className={styles.alertMsg}>Beat the boss with no armor on 😈</span>
        </div>
      </div>
    );
  }
  if (kind === "rank") {
    return (
      <div className={styles.alert}>
        <span className={styles.rankBadge} aria-hidden>
          <CrownMark />
        </span>
        <div className={styles.alertBody}>
          <div className={styles.rankLine}>
            <b>toffi</b> reached <span className={styles.rankTier}>VIP</span>
          </div>
        </div>
      </div>
    );
  }
  if (kind === "goal") {
    return (
      <div className={styles.goal}>
        <div className={styles.goalTop}>
          <span className={styles.goalLabel}>New stream setup</span>
          <span className={styles.goalPct}>66%</span>
        </div>
        <div className={styles.goalTrack}>
          <span className={styles.goalFill} />
        </div>
        <span className={styles.goalSub}>$1,320 of $2,000</span>
      </div>
    );
  }
  if (kind === "roulette") {
    return (
      <div className={styles.game}>
        <div className={styles.gameHead}>
          <GameIcon id="roulette" width={16} height={16} />
          Roulette
          <span className={styles.gamePot}>$1,600 pot</span>
        </div>
        <div className={styles.gameRow}>
          <span className={styles.gameName}>Warcraft III</span>
          <span className={styles.gameBar}>
            <span style={{ width: "62%" }} />
          </span>
          <span className={styles.gamePct}>62%</span>
        </div>
        <div className={styles.gameRow}>
          <span className={styles.gameName}>Fortnite</span>
          <span className={styles.gameBar}>
            <span style={{ width: "31%" }} />
          </span>
          <span className={styles.gamePct}>31%</span>
        </div>
      </div>
    );
  }
  if (kind === "task") {
    return (
      <div className={styles.game}>
        <div className={styles.gameHead}>
          <GameIcon id="task" width={16} height={16} />
          Task
          <span className={styles.gamePot}>$50</span>
        </div>
        <div className={styles.gameText}>“Beat the boss with no armor on.”</div>
        <div className={styles.gameSub}>toffi · 24h to do it</div>
      </div>
    );
  }
  if (kind === "auction") {
    return (
      <div className={styles.game}>
        <div className={styles.gameHead}>
          <GameIcon id="auction" width={16} height={16} />
          Auction
          <span className={styles.gamePot}>$120 leads</span>
        </div>
        <div className={styles.gameRow}>
          <span className={styles.gameName}>Hardest difficulty</span>
          <span className={styles.gameBar}>
            <span style={{ width: "100%" }} />
          </span>
          <span className={styles.gamePct}>$120</span>
        </div>
        <div className={styles.gameRow}>
          <span className={styles.gameName}>Cam upside down</span>
          <span className={styles.gameBar}>
            <span style={{ width: "71%" }} />
          </span>
          <span className={styles.gamePct}>$85</span>
        </div>
      </div>
    );
  }
  if (kind === "fundraiser") {
    return (
      <div className={styles.fund}>
        <CrownFill pct={0.72} size={58} />
        <div className={styles.fundBody}>
          <div className={styles.fundPct}>72%</div>
          <div className={styles.fundNums}>$1,440 of $2,000</div>
        </div>
      </div>
    );
  }
  return (
    <div className={styles.top}>
      <div className={styles.topTitle}>Top supporters</div>
      {TOP_DONORS.map(([name, amt], idx) => (
        <div className={styles.topRow} key={name}>
          <span className={styles.rank}>{idx + 1}</span>
          <span className={styles.name}>{name}</span>
          <span className={styles.amt}>{amt}</span>
        </div>
      ))}
    </div>
  );
}

const CYCLE_MS = 3200;

// One widget at a time, animating to the next every few seconds and looping. The widget is keyed
// by index so React remounts it each cycle and its enter animation replays.
export function ObsWidgets() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % OVERLAYS.length), CYCLE_MS);
    return () => clearInterval(t);
  }, []);

  return (
    <div className={styles.wrap}>
      <h2 className={styles.heading}>Drop them straight into OBS</h2>

      <div className={styles.stage}>
        <div key={i} className={styles.widget}>
          <Widget kind={OVERLAYS[i].kind} />
        </div>
      </div>
      {/* No pager dots: a row of them counts the set out loud and caps how many widgets the
          reel appears to hold. It just keeps cycling instead. */}
    </div>
  );
}

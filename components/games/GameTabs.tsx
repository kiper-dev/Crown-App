"use client";

import styles from "./GameTabs.module.css";

export interface GameTabDef {
  key: string;
  label: string;
  count?: number; // an optional pill (e.g. how many lots / tasks are standing)
}

// The pill toggle at the top of a public game page: one focused view at a time instead of two
// half-empty columns. Same shape on Task, Roulette and Auction so the games read as one product.
export function GameTabs({
  tabs,
  value,
  onChange,
}: {
  tabs: GameTabDef[];
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className={styles.tabs} role="tablist" aria-label="View">
      {tabs.map((t) => {
        const on = t.key === value;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={on}
            className={`${styles.tab}${on ? " " + styles.tabOn : ""}`}
            onClick={() => onChange(t.key)}
          >
            {t.label}
            {typeof t.count === "number" && <span className={styles.count}>{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

"use client";

import type { FundraiserConfig, Profile } from "@/lib/data/types";

export const DEFAULT_FUNDRAISER_CONFIG: FundraiserConfig = {
  minContribution: 1,
  fundingDays: 14,
  deliveryDays: 30,
  allowBelowGoal: true,
  minAcceptPct: 50,
};

// Spec bounds: funding 1h–30d, delivery 1h–90d — the UI offers sane day-sized picks.
const FUNDING_OPTIONS = [
  { days: 1, label: "1 day" },
  { days: 3, label: "3 days" },
  { days: 7, label: "1 week" },
  { days: 14, label: "2 weeks" },
  { days: 30, label: "30 days" },
];
const DELIVERY_OPTIONS = [
  { days: 7, label: "1 week" },
  { days: 14, label: "2 weeks" },
  { days: 30, label: "30 days" },
  { days: 60, label: "60 days" },
  { days: 90, label: "90 days" },
];

// Rules the streamer sets for the Fundraiser game — minimum chip-in, how long the collection
// and delivery run, and whether a partial goal can be accepted. Same live-save pattern as
// TaskGameSettings/SettingsPanel: no separate "Save" step.
export function FundraiserGameSettings({ profile, onSave }: { profile: Profile; onSave: (p: Profile) => void }) {
  const cfg = profile.fundraiserConfig ?? DEFAULT_FUNDRAISER_CONFIG;

  function patch(next: Partial<FundraiserConfig>) {
    onSave({ ...profile, fundraiserConfig: { ...cfg, ...next } });
  }

  return (
    <div className="game-settings">
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2>Rules</h2>

        <div className="field">
          <label htmlFor="fr-min">Minimum chip-in</label>
          <div className="affix has-pre">
            <span className="affix-pre">$</span>
            <input
              id="fr-min"
              type="number"
              min={1}
              value={cfg.minContribution}
              onChange={(e) => patch({ minContribution: Math.max(1, Math.round(+e.target.value) || 1) })}
            />
          </div>
          <div className="footnote">
            Viewers can't chip in less than this. Each contribution is its own escrow on-chain — tiny ones cost more gas
            to refund than they hold.
          </div>
        </div>

        <div className="field">
          <label htmlFor="fr-funding">Collection runs for</label>
          <select id="fr-funding" value={cfg.fundingDays} onChange={(e) => patch({ fundingDays: +e.target.value })}>
            {FUNDING_OPTIONS.map((o) => (
              <option key={o.days} value={o.days}>
                {o.label}
              </option>
            ))}
          </select>
          <div className="footnote">If you haven't accepted the amount by then, everyone is refunded automatically.</div>
        </div>

        <div className="field">
          <label htmlFor="fr-delivery">Time to deliver</label>
          <select id="fr-delivery" value={cfg.deliveryDays} onChange={(e) => patch({ deliveryDays: +e.target.value })}>
            {DELIVERY_OPTIONS.map((o) => (
              <option key={o.days} value={o.days}>
                {o.label}
              </option>
            ))}
          </select>
          <div className="footnote">Counted from the moment you accept the amount. Miss it — refunds all around.</div>
        </div>
      </div>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2>Partial goal</h2>

        <label className={`toggle${cfg.allowBelowGoal ? " on" : ""}`}>
          <span className="track">
            <span className="knob" />
          </span>
          <input type="checkbox" hidden checked={cfg.allowBelowGoal} onChange={(e) => patch({ allowBelowGoal: e.target.checked })} />
          Allow closing below the goal
        </label>
        <div className="footnote">
          Collected 18k of 20k? On: you can accept the smaller amount and deliver anyway. Off: it's the full goal or
          everyone gets refunded.
        </div>

        {cfg.allowBelowGoal && (
          <div className="field">
            <label htmlFor="fr-accept">But no less than</label>
            <div className="affix has-suf">
              <input
                id="fr-accept"
                type="number"
                min={1}
                max={100}
                value={cfg.minAcceptPct}
                onChange={(e) => patch({ minAcceptPct: Math.min(100, Math.max(1, Math.round(+e.target.value) || 1)) })}
              />
              <span className="affix-suf">%</span>
            </div>
            <div className="footnote">% of the goal. Below this the accept button stays off.</div>
          </div>
        )}
      </div>

      <div className="notice">
        <b>Fixed by the contract, not a setting here:</b> don't deliver — even with the goal fully met — and every
        backer is refunded exactly what they put in. Reputation is only earned when you deliver.
      </div>
    </div>
  );
}

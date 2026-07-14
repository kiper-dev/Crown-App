"use client";

import type { Profile, RouletteConfig } from "@/lib/data/types";
import { GAME_GENRES } from "@/lib/data/roulette-mock";

export const DEFAULT_ROULETTE_CONFIG: RouletteConfig = {
  minTier: "",
  excludeTopTier: false,
  genres: [],
  minDonation: 5,
  roundMinutes: 30,
  playMinutes: 60,
};

// Rules the streamer sets for the Roulette game — who's allowed to suggest a game, which
// genres count, and how long a round runs. Same live-save pattern as TaskGameSettings/
// SettingsPanel: no separate "Save" step.
export function RouletteGameSettings({ profile, onSave }: { profile: Profile; onSave: (p: Profile) => void }) {
  const cfg = profile.rouletteConfig ?? DEFAULT_ROULETTE_CONFIG;

  function patch(next: Partial<RouletteConfig>) {
    onSave({ ...profile, rouletteConfig: { ...cfg, ...next } });
  }

  function toggleGenre(g: string) {
    const has = cfg.genres.includes(g);
    patch({ genres: has ? cfg.genres.filter((x) => x !== g) : [...cfg.genres, g] });
  }

  return (
    <div className="game-settings">
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2>Who can suggest</h2>

        <div className="field">
          <label htmlFor="roul-tier">Minimum tier</label>
          <select id="roul-tier" value={cfg.minTier} onChange={(e) => patch({ minTier: e.target.value })}>
            <option value="">Everyone</option>
            {profile.tiers.map((t) => (
              <option key={t.name} value={t.name}>
                {t.name}+
              </option>
            ))}
          </select>
          <div className="footnote">Viewers below this tier can't suggest a game.</div>
        </div>

        <label className={`toggle${cfg.excludeTopTier ? " on" : ""}`}>
          <span className="track">
            <span className="knob" />
          </span>
          <input type="checkbox" hidden checked={cfg.excludeTopTier} onChange={(e) => patch({ excludeTopTier: e.target.checked })} />
          Exclude my top tier
        </label>
        <div className="footnote">
          For streamers whose biggest supporters already get asked directly — keeps the wheel for everyone else.
        </div>

        <div className="field">
          <label htmlFor="roul-min">Minimum donation to suggest</label>
          <div className="affix has-pre">
            <span className="affix-pre">$</span>
            <input
              id="roul-min"
              type="number"
              min={1}
              value={cfg.minDonation}
              onChange={(e) => patch({ minDonation: Math.max(1, Math.round(+e.target.value) || 1) })}
            />
          </div>
          <div className="footnote">A suggestion under this amount doesn't register.</div>
        </div>
      </div>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2>What can be suggested</h2>
        <div>
          <label style={{ fontSize: 14, color: "var(--text-2)", display: "block", marginBottom: 10 }}>Allowed genres</label>
          <div className="chips">
            {GAME_GENRES.map((g) => (
              <button key={g} type="button" className={`chip${cfg.genres.includes(g) ? " active" : ""}`} onClick={() => toggleGenre(g)}>
                {g}
              </button>
            ))}
          </div>
          <div className="footnote" style={{ marginTop: 10 }}>None selected = every genre is allowed.</div>
        </div>
      </div>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2>Round timing</h2>
        <div className="field">
          <label htmlFor="roul-round">Round length</label>
          <div className="affix has-suf">
            <input
              id="roul-round"
              type="number"
              min={1}
              value={cfg.roundMinutes}
              onChange={(e) => patch({ roundMinutes: Math.max(1, Math.round(+e.target.value) || 1) })}
            />
            <span className="affix-suf">min</span>
          </div>
          <div className="footnote">How long suggestions stay open before the wheel spins.</div>
        </div>
        <div className="field">
          <label htmlFor="roul-play">Play time for the winner</label>
          <div className="affix has-suf">
            <input
              id="roul-play"
              type="number"
              min={1}
              value={cfg.playMinutes}
              onChange={(e) => patch({ playMinutes: Math.max(1, Math.round(+e.target.value) || 1) })}
            />
            <span className="affix-suf">min</span>
          </div>
          <div className="footnote">How long you commit to playing whatever wins.</div>
        </div>
      </div>

      <div className="notice">
        <b>Fixed by the contract, not a setting here:</b> a suggestion is a plain donation — money on the picks that
        don't win stays donated, it isn't refunded. The wheel only decides what you play.
      </div>
    </div>
  );
}

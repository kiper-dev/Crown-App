"use client";

import type { AuctionConfig, Profile } from "@/lib/data/types";

export const DEFAULT_AUCTION_CONFIG: AuctionConfig = {
  minBid: 5,
  biddingHours: 24,
  performHours: 48,
};

// Rules the streamer sets for the Auction game — the three knobs the spec gives the content
// maker (min_bid, duration, perform_window). Same live-save pattern as the sibling games:
// no separate "Save" step.
export function AuctionGameSettings({ profile, onSave }: { profile: Profile; onSave: (p: Profile) => void }) {
  const cfg = profile.auctionConfig ?? DEFAULT_AUCTION_CONFIG;

  function patch(next: Partial<AuctionConfig>) {
    onSave({ ...profile, auctionConfig: { ...cfg, ...next } });
  }

  return (
    <div className="game-settings">
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2>Bids</h2>
        <div className="field">
          <label htmlFor="au-min">Minimum bid</label>
          <div className="affix has-pre">
            <span className="affix-pre">$</span>
            <input
              id="au-min"
              type="number"
              min={1}
              value={cfg.minBid}
              onChange={(e) => patch({ minBid: Math.max(1, Math.round(+e.target.value) || 1) })}
            />
          </div>
          <div className="footnote">A single bid under this amount doesn&apos;t register — keeps the board clean.</div>
        </div>
      </div>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2>Timing</h2>
        <div className="field">
          <label htmlFor="au-dur">Bidding window</label>
          <div className="affix has-suf">
            <input
              id="au-dur"
              type="number"
              min={1}
              value={cfg.biddingHours}
              onChange={(e) => patch({ biddingHours: Math.max(1, Math.round(+e.target.value) || 1) })}
            />
            <span className="affix-suf">h</span>
          </div>
          <div className="footnote">How long viewers can place and top up lots before the bell.</div>
        </div>
        <div className="field">
          <label htmlFor="au-perf">Time to deliver</label>
          <div className="affix has-suf">
            <input
              id="au-perf"
              type="number"
              min={1}
              value={cfg.performHours}
              onChange={(e) => patch({ performHours: Math.max(1, Math.round(+e.target.value) || 1) })}
            />
            <span className="affix-suf">h</span>
          </div>
          <div className="footnote">Your window to do the winning condition after the final.</div>
        </div>
      </div>

      <div className="notice">
        <b>Fixed by the contract, not a setting here:</b> every bid sits in its own escrow; losers are refunded the
        moment the bidding closes; the winner pays out only after your reputation holders confirm you delivered.
        Silence refunds — nobody&apos;s money moves on a shrug.
      </div>
    </div>
  );
}

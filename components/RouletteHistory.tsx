"use client";

import { useEffect, useState } from "react";
import { readHistory } from "@/lib/data/roulette";
import type { RouletteRound } from "@/lib/data/roulette-mock";

// Rounds this streamer has actually spun (newest first), with the seeded sample trailing as
// older history. Reads localStorage on mount, so a round finished on the Overview tab shows up
// here on the next visit — the two tabs share the same mock store.
export function RouletteHistory({ handle }: { handle: string }) {
  const [rows, setRows] = useState<RouletteRound[]>([]);
  useEffect(() => setRows(readHistory(handle)), [handle]);

  if (!rows.length) {
    return <div className="empty-log">No rounds yet.</div>;
  }
  return (
    <div className="panel" style={{ padding: 0 }}>
      <div className="otable-wrap">
        <table className="otable">
          <thead>
            <tr>
              <th>Date</th>
              <th>Winner</th>
              <th>Genre</th>
              <th className="r">Pot</th>
              <th className="r">Entries</th>
              <th className="r">Played</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={{ color: "var(--text-3)", whiteSpace: "nowrap" }}>{r.date}</td>
                <td>{r.winner}</td>
                <td style={{ color: "var(--text-2)" }}>{r.genre}</td>
                <td className="r money num">{r.pot} $</td>
                <td className="r num">{r.entries}</td>
                <td className="r num">{r.playedMinutes} min</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useCrown } from "@/lib/data/DataProvider";
import { formatFeedDate, SOURCE_LABEL } from "@/lib/format";
import type { GameId } from "@/lib/data/games";
import { Feed } from "./Feed";

type GameFilter = "all" | GameId | "direct";
const GAME_OPTIONS: (GameId | "direct")[] = ["direct", "task", "roulette", "fundraiser", "auction"];

// The cabinet's "Donations" tab: the full feed with a name search, a mini-game filter and a
// date filter. Filtering is plain client-side over the mock feed — the same list the rest of
// the cabinet reads, so a donation made in this session shows up here too.
export function DonationsPanel() {
  const { feed } = useCrown();
  const [query, setQuery] = useState("");
  const [game, setGame] = useState<GameFilter>("all");
  const [date, setDate] = useState<string>("all");

  // Distinct dates present in the feed, newest first — the options for the date picker.
  const dates = useMemo(() => {
    const set = new Set<string>();
    for (const d of feed) if (d.date) set.add(d.date);
    return [...set].sort((a, b) => (a < b ? 1 : -1));
  }, [feed]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return feed.filter((d) => {
      if (needle && !d.from.toLowerCase().includes(needle)) return false;
      if (game !== "all" && (d.source ?? "direct") !== game) return false;
      if (date !== "all" && d.date !== date) return false;
      return true;
    });
  }, [feed, query, game, date]);

  return (
    <div className="don">
      <div className="don-controls">
        <input
          className="don-search"
          type="search"
          placeholder="Search by name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search donations by name"
        />
        <select className="don-select" value={game} onChange={(e) => setGame(e.target.value as GameFilter)} aria-label="Filter by mini-game">
          <option value="all">All games</option>
          {GAME_OPTIONS.map((g) => (
            <option key={g} value={g}>
              {SOURCE_LABEL[g]}
            </option>
          ))}
        </select>
        <select className="don-select" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Filter by date">
          <option value="all">All dates</option>
          {dates.map((d) => (
            <option key={d} value={d}>
              {formatFeedDate(d)}
            </option>
          ))}
        </select>
      </div>

      {rows.length === 0 ? (
        <div className="empty-log">No donations match these filters.</div>
      ) : (
        <Feed rows={rows} showSource showHead={false} />
      )}
    </div>
  );
}

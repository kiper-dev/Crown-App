"use client";

import Link from "next/link";
import { useCrown } from "@/lib/data/DataProvider";
import type { Donation } from "@/lib/data/types";
import { formatFeedDate, SOURCE_LABEL } from "@/lib/format";
import { Mono } from "./Mono";

export function Feed({
  title = "Donations",
  limit,
  moreHref,
  onMore,
  rows: override,
  showSource = false,
  showHead = true,
}: {
  title?: string;
  limit?: number;
  moreHref?: string;
  onMore?: () => void; // in the cabinet, "Donations" is a tab (state), not a route — use a callback
  rows?: Donation[]; // override the context feed (e.g. a filtered list); falls back to the full feed
  showSource?: boolean; // show which mini-game each donation came through
  showHead?: boolean;
}) {
  const { feed } = useCrown();
  const base = override ?? feed;
  const rows = limit ? base.slice(0, limit) : base;

  return (
    <div>
      {showHead ? (
        <div className="feed-head">
          <h2>{title}</h2>
          {onMore ? (
            <button type="button" className="more" onClick={onMore}>
              All donations →
            </button>
          ) : moreHref ? (
            <Link className="more" href={moreHref}>
              All donations →
            </Link>
          ) : null}
        </div>
      ) : null}
      <div className="feed">
        {rows.map((d) => (
          <div className={`feed-row${d.fresh ? " fresh" : ""}`} key={d.id}>
            <Mono name={d.from} size={40} />
            <span className="feed-name">{d.from}</span>
            <span className="feed-sum num">{d.amount} $</span>
            {d.message ? <span className="feed-msg">{d.message}</span> : null}
            {showSource ? <span className="feed-src">{SOURCE_LABEL[d.source ?? "direct"]}</span> : null}
            <span className="feed-time">
              {d.date ? formatFeedDate(d.date) : d.time}
              {d.date && d.time ? <span className="feed-ago">{d.time}</span> : null}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

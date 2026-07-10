"use client";

import Link from "next/link";
import { useCrown } from "@/lib/data/DataProvider";
import { Mono } from "./Mono";

export function Feed({ title = "Donations", limit, moreHref }: { title?: string; limit?: number; moreHref?: string }) {
  const { feed } = useCrown();
  const rows = limit ? feed.slice(0, limit) : feed;

  return (
    <div>
      <div className="feed-head">
        <h2>{title}</h2>
        {moreHref ? (
          <Link className="more" href={moreHref}>
            All donations →
          </Link>
        ) : null}
      </div>
      <div className="feed">
        {rows.map((d) => (
          <div className={`feed-row${d.fresh ? " fresh" : ""}`} key={d.id}>
            <Mono name={d.from} size={40} />
            <span className="feed-name">{d.from}</span>
            <span className="feed-sum num">{d.amount} $</span>
            {d.message ? <span className="feed-msg">{d.message}</span> : null}
            <span className="feed-time">{d.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

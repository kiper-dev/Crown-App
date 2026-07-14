"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { Mono } from "@/components/Mono";
import { Spark } from "@/components/Spark";
import { SearchIcon, SocialIcon, SOCIAL_KINDS, SOCIAL_LABEL } from "@/components/icons";
import { MOCK_STREAMERS, MOCK_REALMS } from "@/lib/data/mock";
import type { Social } from "@/lib/data/types";
import styles from "./page.module.css";

type Sort = "all" | "7d";

function money(n: number) {
  return `${n.toLocaleString("en-US")} $`;
}

export default function DiscoverPage() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("all");
  const [platforms, setPlatforms] = useState<Social["kind"][]>([]);

  function togglePlatform(kind: Social["kind"]) {
    setPlatforms((prev) => (prev.includes(kind) ? prev.filter((k) => k !== kind) : [...prev, kind]));
  }

  const rows = useMemo(() => {
    const withStreamer = MOCK_REALMS.map((r) => ({ ...r, streamer: MOCK_STREAMERS[r.handle] })).filter((r) => r.streamer);
    const q = query.trim().toLowerCase();
    const filtered = withStreamer.filter((r) => {
      const matchesQuery = !q || r.handle.includes(q) || r.streamer.name.toLowerCase().includes(q);
      const matchesPlatform = !platforms.length || r.streamer.socials.some((s) => platforms.includes(s.kind));
      return matchesQuery && matchesPlatform;
    });
    return filtered.sort((a, b) => (sort === "all" ? b.receivedAll - a.receivedAll : b.received7d - a.received7d));
  }, [query, sort, platforms]);

  const platformCounts = useMemo(() => {
    const counts = Object.fromEntries(SOCIAL_KINDS.map((k) => [k, 0])) as Record<Social["kind"], number>;
    for (const r of MOCK_REALMS) {
      const streamer = MOCK_STREAMERS[r.handle];
      if (!streamer) continue;
      for (const s of streamer.socials) counts[s.kind] += 1;
    }
    return counts;
  }, []);

  return (
    <main className={styles.wrap}>
      <TopNav active="discover" />

      <div className={styles.main}>
        <div className={styles.searchRow}>
          <div className="search">
            <SearchIcon width={22} height={22} />
            <input type="text" placeholder="Search streamers…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>

        <div className={styles.body}>
          <aside className={styles.sidebar}>
            <div className={styles.filterGroup}>
              <div className={styles.filterLabel}>Sort</div>
              <div className="seg">
                <button type="button" className={sort === "all" ? "active" : ""} onClick={() => setSort("all")}>
                  All-time
                </button>
                <button type="button" className={sort === "7d" ? "active" : ""} onClick={() => setSort("7d")}>
                  7 days
                </button>
              </div>
            </div>

            <div className={styles.filterGroup}>
              <div className={styles.filterLabel}>Platforms</div>
              <div className={styles.platformList}>
                {SOCIAL_KINDS.map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    className={`${styles.platformRow} ${platforms.includes(kind) ? styles.platformOn : ""}`}
                    onClick={() => togglePlatform(kind)}
                    aria-pressed={platforms.includes(kind)}
                  >
                    <SocialIcon kind={kind} width={16} height={16} />
                    <span>{SOCIAL_LABEL[kind]}</span>
                    <span className={styles.platformCount}>{platformCounts[kind]}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className={styles.grid}>
            {rows.map((r) => (
              <Link key={r.handle} className={styles.card} href={`/@${r.handle}`}>
                <div className={styles.cardHead}>
                  <Mono name={r.streamer.name} size={40} />
                  <div className={styles.cardWho}>
                    <span className={styles.cardHandle}>@{r.handle}</span>
                    <span className={styles.cardName}>{r.streamer.name}</span>
                  </div>
                </div>

                <div className={styles.cardSocials}>
                  {r.streamer.socials.map((s) => (
                    <SocialIcon key={s.kind} kind={s.kind} width={16} height={16} />
                  ))}
                </div>

                <Spark data={sort === "all" ? r.spark : r.spark.slice(-7)} className={styles.spark} />

                <div className={styles.cardStats}>
                  <div className={styles.statLabel}>Received</div>
                  <div className={styles.statValue}>{money(sort === "all" ? r.receivedAll : r.received7d)}</div>
                </div>
              </Link>
            ))}

            {!rows.length && (
              <div className={styles.empty}>No streamers match your filters.</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

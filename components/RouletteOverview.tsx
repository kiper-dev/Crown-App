"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BarList, StatTile } from "@/components/ops";
import { RouletteWheel } from "@/components/RouletteWheel";
import { DEFAULT_ROULETTE_CONFIG } from "@/components/RouletteGameSettings";
import { readRound, ensureRound, setRoundWinner, newRound, readRoundMeta, appendHistory, type RoundMeta } from "@/lib/data/roulette";
import { pickWeighted, type RouletteSuggestion } from "@/lib/data/roulette-mock";
import type { Profile } from "@/lib/data/types";

function fmtLeft(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

// The streamer's view of the open round: the same wheel viewers see, plus the two controls
// the spec gives the content maker — spin early ("решение КМ") or open a fresh round. The
// round itself (suggestions, clock, verdict) lives in the shared mock storage, so this and
// the public page stay in step.
export function RouletteOverview({ profile }: { profile: Profile }) {
  const handle = profile.handle;
  const cfg = profile.rouletteConfig ?? DEFAULT_ROULETTE_CONFIG;

  const [round, setRound] = useState<RouletteSuggestion[]>([]);
  const [meta, setMeta] = useState<RoundMeta | null>(null);
  const [now, setNow] = useState(0);
  const [spin, setSpin] = useState<{ id: string; nonce: number }>({ id: "", nonce: 0 });
  const spunFor = useRef<number | null>(null);
  const recordedFor = useRef<number | null>(null);

  useEffect(() => {
    setRound(readRound(handle));
    setMeta(ensureRound(handle));
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [handle]);

  // Keep up with suggestions and verdicts landing from the public page.
  useEffect(() => {
    if (!now || !meta) return;
    setRound(readRound(handle));
    const m = readRoundMeta(handle);
    if (!m) return;
    if (m.startedAt !== meta.startedAt) {
      setMeta(m);
      return;
    }
    if (m.winner && !meta.winner && spunFor.current !== m.startedAt) {
      spunFor.current = m.startedAt;
      setSpin((s) => ({ id: m.winner!.id, nonce: s.nonce + 1 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now]);

  const total = round.reduce((sum, s) => sum + s.pool, 0);
  const deadline = meta ? meta.startedAt + cfg.roundMinutes * 60_000 : 0;
  const msLeft = meta && now ? deadline - now : 1;
  const expired = msLeft <= 0;
  const spinning = spin.nonce > 0 && !meta?.winner;
  // Nothing pitched yet and no verdict — an empty wheel says nothing, so we show a share prompt instead.
  const empty = !meta?.winner && total === 0;

  // Время вышло — the wheel spins itself, same as on the public page.
  useEffect(() => {
    if (!now || !meta || meta.winner || !expired) return;
    if (spunFor.current === meta.startedAt) return;
    if (!total) {
      setMeta(newRound(handle));
      return;
    }
    spinNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, meta, expired]);

  function spinNow() {
    if (!meta || meta.winner || !total || spunFor.current === meta.startedAt) return;
    const w = pickWeighted(readRound(handle), Math.random());
    if (!w) return;
    spunFor.current = meta.startedAt;
    setSpin((s) => ({ id: w.id, nonce: s.nonce + 1 }));
  }

  function landed(id: string) {
    const list = readRound(handle);
    const w = list.find((s) => s.id === id);
    if (!w) return;
    setMeta(setRoundWinner(handle, { id: w.id, title: w.title }));
    // Record the finished round exactly once, so the History tab shows real rounds — not just the seed.
    if (meta && recordedFor.current !== meta.startedAt) {
      recordedFor.current = meta.startedAt;
      appendHistory(handle, {
        id: `r-${meta.startedAt}`,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        winner: w.title,
        genre: w.genre,
        pot: list.reduce((sum, s) => sum + s.pool, 0),
        entries: list.length,
        playedMinutes: cfg.playMinutes,
      });
    }
  }

  function startNewRound() {
    setMeta(newRound(handle));
    setRound(readRound(handle));
  }

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="footnote">
        Viewers suggest a game by donating toward it — slice size is the pool's share, and the share is the odds.
      </div>

      {empty ? (
        <div className="empty-log">
          No suggestions yet — viewers pitch a game on your{" "}
          <Link href={`/@${handle}/roulette`} target="_blank" style={{ color: "var(--accent)" }}>
            roulette page
          </Link>
          . Each one is a donation toward what they want you to play.
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap" }}>
            <RouletteWheel
              round={round}
              spinToId={spin.id || null}
              spinNonce={spin.nonce}
              onLanded={landed}
              winnerId={meta?.winner?.id ?? null}
              size={260}
            />

            <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 15, color: "var(--text-2)" }}>
                {meta?.winner ? (
                  <>
                    <span className="pill ok" style={{ marginRight: 8 }}>
                      <span className="dot" />
                      {meta.winner.title}
                    </span>
                    The wheel has spoken — you play it for {cfg.playMinutes} min.
                  </>
                ) : spinning ? (
                  "Spinning…"
                ) : expired ? (
                  "Time's up — spinning."
                ) : (
                  "Round is open — viewers are pitching games below."
                )}
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {!meta?.winner ? (
                  <button className="btn" type="button" disabled={!total || spinning} onClick={spinNow}>
                    {spinning ? "Spinning…" : "Spin now"}
                  </button>
                ) : (
                  <button className="btn" type="button" onClick={startNewRound}>
                    New round
                  </button>
                )}
              </div>

              <div className="footnote">
                {meta?.winner
                  ? "A new round clears the wheel and restarts the clock."
                  : "The wheel also spins on its own when the clock runs out. Losing pools stay donated."}
              </div>
            </div>
          </div>

          <div className="stat-grid">
            <StatTile k="Pot" v={`${total} $`} />
            <StatTile k="Closes in" v={meta?.winner ? "Closed" : fmtLeft(msLeft)} />
            <StatTile k="Suggestions" v={String(round.length)} />
          </div>

          {round.length > 0 && (
            <BarList unit="money" bars={round.map((r) => ({ label: `${r.title} · ${r.genre}`, value: r.pool, display: `${r.pool} $` }))} />
          )}
        </>
      )}
    </div>
  );
}

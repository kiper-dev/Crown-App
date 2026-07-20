"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useProfile } from "@/lib/data/ProfileProvider";
import { useCrown } from "@/lib/data/DataProvider";
import { Logo } from "@/components/Logo";
import { ReputationDelta } from "@/components/ReputationDelta";
import { DonateTopBar } from "@/components/DonateTopBar";
import { Mono } from "@/components/Mono";
import { SocialIcon, SOCIAL_LABEL } from "@/components/icons";
import { normalizeSocialLink } from "@/lib/data/social-links";
import { DEFAULT_ROULETTE_CONFIG } from "@/components/RouletteGameSettings";
import { RouletteWheel } from "@/components/RouletteWheel";
import { withRouletteDefaults, addSuggestion, readRound, ensureRound, readRoundMeta, setRoundWinner, newRound, type RoundMeta } from "@/lib/data/roulette";
import { GAME_GENRES, pickWeighted, type GameGenre, type RouletteSuggestion } from "@/lib/data/roulette-mock";
import { backgroundStyle } from "@/lib/data/pagebuilder";
import { tierInfo } from "@/lib/level";
import { resolvePublicSession } from "@/lib/data/gameSessions";
import { GameTabs } from "@/components/games/GameTabs";
import styles from "./page.module.css";

type SendState = "idle" | "sending" | "done";

function fmtLeft(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

// The public roulette page — what a viewer opens from the streamer's link or QR: the open
// round with live odds, and the form to suggest (or back) a game by donating toward it.
// Until crown-app/api exists this resolves only the local profile, and suggestions accumulate
// in localStorage on top of the seeded round — same mock backend as the rest of the app.
export default function RoulettePage({ params }: { params: { handle: string } }) {
  const { ready, profile } = useProfile();
  const { getReputation } = useCrown();
  const handle = decodeURIComponent(params.handle).replace(/^@/, "");

  // Session resolution: ?s=<id> picks a specific session; one live session resolves itself;
  // several → the picker below; none → the "nothing running" gate. Streamers who never used
  // sessions fall through on the bare handle (legacy data keeps working).
  const [pub, setPub] = useState<ReturnType<typeof resolvePublicSession> | null>(null);
  useEffect(() => {
    const sParam = new URLSearchParams(window.location.search).get("s");
    setPub(resolvePublicSession(handle, "roulette", sParam));
  }, [handle]);
  const scope = pub?.scope ?? null;

  const [round, setRound] = useState<RouletteSuggestion[]>([]);
  const [meta, setMeta] = useState<RoundMeta | null>(null);
  const [now, setNow] = useState(0);
  const [spin, setSpin] = useState<{ id: string; nonce: number }>({ id: "", nonce: 0 });
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState<GameGenre>("Action");
  const [amount, setAmount] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [send, setSend] = useState<SendState>("idle");
  const [view, setView] = useState<"suggest" | "wheel">("suggest"); // the top toggle: suggest/back a game vs. the wheel itself

  useEffect(() => {
    if (!scope) return;
    setRound(readRound(scope));
    setMeta(ensureRound(scope));
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [scope]);

  // Which round (startedAt) this tab has already triggered a spin for — so expiry,
  // cross-tab verdicts and re-renders can't double-spin the wheel.
  const spunFor = useRef<number | null>(null);

  // Once a second: catch up with the storage — the streamer may have spun early from the
  // cabinet ("решение КМ") or started a new round; other tabs may have added suggestions.
  useEffect(() => {
    if (!now || !meta) return;
    const m = readRoundMeta(scope!);
    if (!m) return;
    if (m.startedAt !== meta.startedAt) {
      // New round (the streamer started a fresh one): reset the spin, otherwise `spinning`
      // stays stuck true on the new round and viewers can't suggest or back a game.
      setMeta(m);
      setRound(readRound(scope!));
      setSpin({ id: "", nonce: 0 });
      spunFor.current = null;
      return;
    }
    if (m.winner && !meta.winner && spunFor.current !== m.startedAt) {
      // Verdict decided elsewhere — replay the landing here instead of snapping to it.
      spunFor.current = m.startedAt;
      setSpin((s) => ({ id: m.winner!.id, nonce: s.nonce + 1 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now]);

  // Время вышло: the clock hits zero with no verdict — the wheel spins itself.
  useEffect(() => {
    if (!now || !meta || meta.winner) return;
    const minutes = (profile && profile.handle === handle && profile.rouletteConfig?.roundMinutes) || DEFAULT_ROULETTE_CONFIG.roundMinutes;
    if (now < meta.startedAt + minutes * 60_000) return;
    if (spunFor.current === meta.startedAt) return;
    const r = readRound(scope!);
    if (r.length === 0) {
      // Nothing suggested at all — quietly restart the clock instead of spinning an empty wheel.
      setMeta(newRound(scope!));
      return;
    }
    const w = pickWeighted(r, Math.random());
    if (!w) return;
    spunFor.current = meta.startedAt;
    setSpin((s) => ({ id: w.id, nonce: s.nonce + 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, meta]);

  function landed(id: string) {
    const w = readRound(scope!).find((s) => s.id === id);
    if (w) setMeta(setRoundWinner(scope!, { id: w.id, title: w.title }));
  }

  if (!ready) return <main className="page" />;

  const mine = profile && profile.handle === handle ? profile : null;
  const rl = mine ? withRouletteDefaults(mine) : null;

  if (!mine || !rl) {
    return (
      <main className="page">
        <div className="center-note">
          <h1>No roulette here</h1>
          <p>This content maker isn't running a game roulette right now.</p>
          <Link className="btn" href={`/@${handle}`}>
            To the content maker's page
          </Link>
        </div>
      </main>
    );
  }

  const cfg = mine.rouletteConfig ?? DEFAULT_ROULETTE_CONFIG;
  if (!pub) return <main className="page" />;
  if (!pub.scope) {
    return (
      <main className="page">
        <div className="center-note">
          <h1>{pub.choices.length ? "Pick a session" : "Nothing running right now"}</h1>
          {pub.choices.length ? (
            <>
              <p>Several are live at once — choose the one you were invited to.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
                {pub.choices.map((c) => (
                  <a key={c.id} className="btn" href={`?s=${c.id}`}>
                    {c.name}
                  </a>
                ))}
              </div>
            </>
          ) : (
            <>
              <p>Nothing is live. Start a session in the cabinet — Roulette → Sessions — and this page switches on.</p>
              <Link className="btn" href={`/@${handle}`}>
                To the content maker&apos;s page
              </Link>
            </>
          )}
        </div>
      </main>
    );
  }

  const genres = cfg.genres.length ? (cfg.genres as GameGenre[]) : [...GAME_GENRES];
  // Keep the selected genre inside the allowed list — backing a suggestion whose genre the
  // streamer later restricted would otherwise leave <select> with a value that has no <option>.
  const genreValue = genres.includes(genre) ? genre : genres[0];
  const total = round.reduce((sum, s) => sum + s.pool, 0);

  // Round clock: started when the round was first seen, spins on expiry — or earlier,
  // if the streamer hits "Spin now" in the cabinet (the verdict lands in the same storage).
  const deadline = meta ? meta.startedAt + cfg.roundMinutes * 60_000 : 0;
  const msLeft = meta && now ? deadline - now : 1;
  const spinning = spin.nonce > 0 && !meta?.winner;
  const closed = Boolean(meta?.winner) || msLeft <= 0;

  const chosen = amount ?? rl.presets[0];
  const customN = Math.round(Number(custom)) || 0;
  const finalAmount = custom ? customN : chosen;
  const rep = getReputation(handle);

  // Rank mode: putting a game on the wheel is free, but gated by the viewer's rank with this
  // streamer (the КМ picked the tier at session creation). Backing stays a donation for everyone.
  const rankMode = meta?.mode === "rank";
  const gateTier = rankMode ? mine.tiers.find((t) => t.name === meta?.minTier) ?? mine.tiers[0] : null;
  const canSuggestByRank = !rankMode || (gateTier ? rep >= gateTier.threshold : true);
  const canSend = send === "idle" && !closed && title.trim().length > 0 && (rankMode ? canSuggestByRank : finalAmount >= cfg.minDonation);

  // Clicking an existing suggestion pre-fills the form — backing it grows its pool and odds.
  function back(s: RouletteSuggestion) {
    if (closed || spinning) return;
    setTitle(s.title);
    setGenre(s.genre);
  }

  function suggest() {
    if (!canSend) return;
    setSend("sending");
    setTimeout(() => {
      setRound(addSuggestion(scope!, title.trim(), genreValue, rankMode ? 0 : finalAmount));
      // Clear the form right as the suggestion lands — a delayed reset would clobber
      // whatever the viewer already started typing for their next one.
      setTitle("");
      setCustom("");
      setSend("done");
      setTimeout(() => setSend("idle"), 2200);
    }, 1100);
  }

  return (
    <main className={styles.page} style={backgroundStyle(rl.design)}>
      <DonateTopBar />
      <div className={styles.col}>
        <Link className={styles.who} href={`/@${handle}`} style={{ textDecoration: "none", color: "inherit" }} title={`@${mine.handle} — open profile`}>
          {mine.avatarEnabled !== false && <Mono name={mine.name} size={56} src={mine.avatarUrl} />}
          <div>
            <div className={styles.name}>{mine.name}</div>
            <div className={styles.handle}>@{mine.handle} · <span className={styles.live}>round open</span></div>
          </div>
        </Link>

        <h1 className={styles.headline}>{rl.headline.trim() || "You pick what I play next"}</h1>
        {rl.descriptionEnabled && rl.description && <p className={styles.desc}>{rl.description}</p>}

        {/* Tab 1: suggest or back a game (the donation). Tab 2: the wheel itself, live. */}
        <GameTabs
          value={view}
          onChange={(v) => setView(v as "suggest" | "wheel")}
          tabs={[
            { key: "suggest", label: "Suggest a game", count: round.length },
            { key: "wheel", label: "The wheel" },
          ]}
        />

        <div className={styles.panel}>
          {view === "wheel" && (
          <div className={styles.wheelCol} style={{ position: "static" }}>
            <RouletteWheel
              round={rankMode ? round.map((x) => ({ ...x, pool: x.pool || 1 })) : round}
              spinToId={spin.id || null}
              spinNonce={spin.nonce}
              onLanded={landed}
              winnerId={meta?.winner?.id ?? null}
              size={400}
              onSliceClick={closed || spinning ? undefined : back}
            />
            {total === 0 && <p className="footnote">The wheel fills as suggestions come in.</p>}

            {meta?.winner && (
              <div className={styles.verdict}>
                <span className="pill ok">
                  <span className="dot" />
                  {meta.winner.title}
                </span>
                <span className={styles.verdictNote}>The wheel has spoken — {cfg.playMinutes} min on stream.</span>
              </div>
            )}
          </div>
          )}

          {view === "suggest" && (
          <div className={styles.stack}>
            <div className={styles.roundCard}>
              <div className={styles.roundHead}>
                <span>This round{closed ? " · closed" : spinning ? " · spinning…" : ` · ${fmtLeft(msLeft)} left`}</span>
                <span className="num">{total} $ in the pot</span>
              </div>
              {round.length ? (
                round.map((s) => {
                  const pct = total > 0 ? s.pool / total : 0;
                  return (
                    <button key={s.id} type="button" className={styles.suggestion} onClick={() => back(s)} title={`Back ${s.title}`}>
                      <span className={styles.sTitle}>
                        {s.title} <span className={styles.sGenre}>{s.genre}</span>
                      </span>
                      <span className={styles.sBar} aria-hidden>
                        <span className={styles.sFill} style={{ width: `${Math.max(3, Math.round(pct * 100))}%` }} />
                      </span>
                      <span className={`${styles.sPool} num`}>{s.pool} $</span>
                      <span className={styles.sOdds}>{Math.round(pct * 100)}%</span>
                    </button>
                  );
                })
              ) : (
                <div className="footnote">Nothing suggested yet — yours starts the round.</div>
              )}
              <div className={styles.roundFoot}>
                Round: {cfg.roundMinutes} min · winner gets played for {cfg.playMinutes} min. Tap a game to back it.
              </div>
            </div>

            {closed && (
              <p className="footnote">Round closed — suggestions reopen when {mine.name} starts a new one.</p>
            )}

            {!closed && rankMode && !canSuggestByRank && (
              <p className="footnote" style={{ textAlign: "center" }}>
                Putting a game on the wheel is for <b>{gateTier?.name}+</b> viewers (yours: {rep} rep). You can still back any
                game above — that&apos;s open to everyone.
              </p>
            )}

            {!closed && canSuggestByRank && rl.widgets.find((w) => w.kind === "donate")?.enabled && (
              <div className={`card ${styles.suggestCard}`}>
                <div className={styles.suggestFields}>
                  <div className="field" style={{ flex: 1 }}>
                    <input type="text" placeholder="Game title" value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>
                  <select className={styles.genreSelect} value={genreValue} onChange={(e) => setGenre(e.target.value as GameGenre)}>
                    {genres.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                {!rankMode && (
                  <>
                    <div className="chips" style={{ justifyContent: "center" }}>
                      {rl.presets.map((p) => (
                        <button
                          key={p}
                          type="button"
                          className={`chip${!custom && chosen === p ? " active" : ""}`}
                          onClick={() => {
                            setAmount(p);
                            setCustom("");
                          }}
                        >
                          ${p}
                        </button>
                      ))}
                      <input
                        className={styles.customAmount}
                        type="number"
                        min={cfg.minDonation}
                        placeholder="Custom"
                        value={custom}
                        onChange={(e) => setCustom(e.target.value)}
                      />
                    </div>
                    <ReputationDelta rep={rep} gain={finalAmount} tiers={mine.tiers} />
                  </>
                )}
                <button type="button" className="btn" disabled={!canSend} onClick={suggest}>
                  {send === "sending"
                    ? "Sending…"
                    : send === "done"
                      ? rankMode ? "On the wheel ✓" : "In the pot ✓"
                      : rankMode ? "Put it on the wheel" : `Suggest for ${finalAmount} $`}
                </button>
                <div className="footnote">
                  {send === "done"
                    ? rankMode ? "On the wheel — anyone can back it with a donation." : "Counted — the odds just moved."
                    : rankMode
                      ? `Free for ${gateTier?.name ?? "ranked"}+ viewers. Backing a game is a donation, open to everyone.`
                      : `From ${cfg.minDonation} $. It's a donation either way — win or lose, it stays with the content maker.`}
                </div>
              </div>
            )}

            {rl.widgets.find((w) => w.kind === "socials")?.enabled && (
              <div className={styles.socials}>
                {mine.socials.map((s) => {
                  const safe = normalizeSocialLink(s.kind, s.url);
                  if (!safe) return null;
                  return (
                    <a key={s.kind} href={safe} target="_blank" rel="noreferrer nofollow" aria-label={SOCIAL_LABEL[s.kind]}>
                      <SocialIcon kind={s.kind} />
                    </a>
                  );
                })}
              </div>
            )}

          </div>
          )}
        </div>

        <div className={styles.footer}>
          <Logo />
        </div>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { useProfile } from "@/lib/data/ProfileProvider";
import { Logo } from "@/components/Logo";
import { Mono } from "@/components/Mono";
import { SocialIcon, SOCIAL_LABEL, QrIcon } from "@/components/icons";
import { normalizeSocialLink } from "@/lib/data/social-links";
import { DEFAULT_ROULETTE_CONFIG } from "@/components/RouletteGameSettings";
import { RouletteWheel } from "@/components/RouletteWheel";
import { withRouletteDefaults, addSuggestion, readRound, ensureRound, readRoundMeta, setRoundWinner, newRound, type RoundMeta } from "@/lib/data/roulette";
import { GAME_GENRES, pickWeighted, type GameGenre, type RouletteSuggestion } from "@/lib/data/roulette-mock";
import { backgroundStyle } from "@/lib/data/pagebuilder";
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
  const handle = decodeURIComponent(params.handle).replace(/^@/, "");

  const [round, setRound] = useState<RouletteSuggestion[]>([]);
  const [meta, setMeta] = useState<RoundMeta | null>(null);
  const [now, setNow] = useState(0);
  const [spin, setSpin] = useState<{ id: string; nonce: number }>({ id: "", nonce: 0 });
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState<GameGenre>("Action");
  const [amount, setAmount] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [send, setSend] = useState<SendState>("idle");
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    setRound(readRound(handle));
    setMeta(ensureRound(handle));
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [handle]);

  // Which round (startedAt) this tab has already triggered a spin for — so expiry,
  // cross-tab verdicts and re-renders can't double-spin the wheel.
  const spunFor = useRef<number | null>(null);

  // Once a second: catch up with the storage — the streamer may have spun early from the
  // cabinet ("решение КМ") or started a new round; other tabs may have added suggestions.
  useEffect(() => {
    if (!now || !meta) return;
    const m = readRoundMeta(handle);
    if (!m) return;
    if (m.startedAt !== meta.startedAt) {
      setMeta(m);
      setRound(readRound(handle));
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
    const r = readRound(handle);
    if (!r.reduce((sum, x) => sum + x.pool, 0)) {
      // Nothing suggested at all — quietly restart the clock instead of spinning an empty wheel.
      setMeta(newRound(handle));
      return;
    }
    const w = pickWeighted(r, Math.random());
    if (!w) return;
    spunFor.current = meta.startedAt;
    setSpin((s) => ({ id: w.id, nonce: s.nonce + 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, meta]);

  function landed(id: string) {
    const w = readRound(handle).find((s) => s.id === id);
    if (w) setMeta(setRoundWinner(handle, { id: w.id, title: w.title }));
  }

  useEffect(() => {
    if (!qrOpen) return;
    QRCode.toDataURL(window.location.href, { margin: 1, width: 240, color: { dark: "#F1EFF7", light: "#00000000" } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [qrOpen]);

  if (!ready) return <main className="page" />;

  const mine = profile && profile.handle === handle ? profile : null;
  const rl = mine ? withRouletteDefaults(mine) : null;

  if (!mine || !rl) {
    return (
      <main className="page">
        <div className="center-note">
          <h1>No roulette here</h1>
          <p>This streamer isn't running a game roulette right now.</p>
          <Link className="btn" href={`/@${handle}`}>
            To the streamer's page
          </Link>
        </div>
      </main>
    );
  }

  const cfg = mine.rouletteConfig ?? DEFAULT_ROULETTE_CONFIG;
  const genres = cfg.genres.length ? (cfg.genres as GameGenre[]) : [...GAME_GENRES];
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
  const canSend = send === "idle" && !closed && !spinning && title.trim().length > 0 && finalAmount >= cfg.minDonation;

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
      setRound(addSuggestion(handle, title.trim(), genre, finalAmount));
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
      <div className={styles.col}>
        <div className={styles.who}>
          {mine.avatarEnabled !== false && <Mono name={mine.name} size={56} />}
          <div>
            <div className={styles.name}>{mine.name}</div>
            <div className={styles.handle}>@{mine.handle} · <span className={styles.live}>round open</span></div>
          </div>
        </div>

        <h1 className={styles.headline}>{rl.headline.trim() || "You pick what I play next"}</h1>
        {rl.descriptionEnabled && rl.description && <p className={styles.desc}>{rl.description}</p>}
        <p className={styles.ruleNote}>
          The wheel spins when the round closes — odds match each pool's share. A suggestion that doesn't win stays
          donated either way.
        </p>

        <div className={styles.layout}>
          <div className={styles.wheelCol}>
            <RouletteWheel
              round={round}
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

            {!closed && rl.widgets.find((w) => w.kind === "donate")?.enabled && (
              <div className={`card ${styles.suggestCard}`}>
                <div className={styles.suggestFields}>
                  <div className="field" style={{ flex: 1 }}>
                    <input type="text" placeholder="Game title" value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>
                  <select className={styles.genreSelect} value={genre} onChange={(e) => setGenre(e.target.value as GameGenre)}>
                    {genres.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
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
                    placeholder="Your sum"
                    value={custom}
                    onChange={(e) => setCustom(e.target.value)}
                  />
                </div>
                <button type="button" className="btn" disabled={!canSend} onClick={suggest}>
                  {send === "sending" ? "Sending…" : send === "done" ? "In the pot ✓" : `Suggest for ${finalAmount} $`}
                </button>
                <div className="footnote">
                  {send === "done"
                    ? "Counted — the odds just moved."
                    : `From ${cfg.minDonation} $. It's a donation either way — win or lose, it stays with the streamer.`}
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

            <div className={styles.shareRow}>
              <button type="button" className="btn-outline" onClick={() => setQrOpen((v) => !v)}>
                <QrIcon /> QR
              </button>
            </div>
            {qrOpen && (
              <div className={styles.qrBox}>
                {qrDataUrl ? <img src={qrDataUrl} alt="QR code for this page" width={180} height={180} /> : <div className="footnote">Generating…</div>}
              </div>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <Logo />
        </div>
      </div>
    </main>
  );
}

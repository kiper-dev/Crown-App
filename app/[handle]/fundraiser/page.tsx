"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useProfile } from "@/lib/data/ProfileProvider";
import { useCrown } from "@/lib/data/DataProvider";
import { Logo } from "@/components/Logo";
import { ReputationDelta } from "@/components/ReputationDelta";
import { DonateTopBar } from "@/components/DonateTopBar";
import { Mono } from "@/components/Mono";
import { FundraiserFill } from "@/components/FundraiserFill";
import { SocialIcon, SOCIAL_LABEL, CopyIcon } from "@/components/icons";
import { normalizeSocialLink } from "@/lib/data/social-links";
import { DEFAULT_FUNDRAISER_CONFIG } from "@/components/FundraiserGameSettings";
import { withFundraiserDefaults, readCollected, addCollected } from "@/lib/data/fundraiser";
import { resolvePublicSession } from "@/lib/data/gameSessions";
import { backgroundStyle } from "@/lib/data/pagebuilder";
import styles from "./page.module.css";

type SendState = "idle" | "sending" | "done";

// The public fundraiser page — what a viewer opens from the streamer's link or QR.
// Until crown-app/api exists this resolves only the local profile (the same mock backend
// the rest of the app runs on), and chip-ins accumulate in localStorage so the crown
// genuinely fills up when you try it.
export default function FundraiserPage({ params }: { params: { handle: string } }) {
  const { ready, profile } = useProfile();
  const { getReputation } = useCrown();
  const handle = decodeURIComponent(params.handle).replace(/^@/, "");

  // Session resolution: ?s=<id> picks a specific session; one live session resolves itself;
  // several → the picker below; none → the "nothing running" gate. Streamers who never used
  // sessions fall through on the bare handle (legacy data keeps working).
  const [pub, setPub] = useState<ReturnType<typeof resolvePublicSession> | null>(null);
  useEffect(() => {
    const sParam = new URLSearchParams(window.location.search).get("s");
    setPub(resolvePublicSession(handle, "fundraiser", sParam));
  }, [handle]);
  const scope = pub?.scope ?? null;

  const [collected, setCollected] = useState(0);
  const [amount, setAmount] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [send, setSend] = useState<SendState>("idle");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!scope) return;
    setCollected(readCollected(scope));
  }, [scope]);

  if (!ready) return <main className="page" />;

  const mine = profile && profile.handle === handle ? profile : null;
  const fr = mine ? withFundraiserDefaults(mine) : null;

  if (!mine || !fr) {
    return (
      <main className="page">
        <div className="center-note">
          <h1>No active fundraiser</h1>
          <p>This content maker isn't collecting toward a goal right now.</p>
          <Link className="btn" href={`/@${handle}`}>
            To the content maker's page
          </Link>
        </div>
      </main>
    );
  }

  const cfg = mine.fundraiserConfig ?? DEFAULT_FUNDRAISER_CONFIG;
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
              <p>Nothing is live. Start a session in the cabinet — Fundraiser → Sessions — and this page switches on.</p>
              <Link className="btn" href={`/@${handle}`}>
                To the content maker&apos;s page
              </Link>
            </>
          )}
        </div>
      </main>
    );
  }

  const pct = fr.goal > 0 ? Math.min(1, collected / fr.goal) : 0;
  const reached = fr.goal > 0 && collected >= fr.goal;
  const chosen = amount ?? fr.presets[0];
  const customN = Math.round(Number(custom)) || 0;
  const finalAmount = custom ? customN : chosen;
  // Once the goal is met the collection is done — no more chip-ins (strict where money is): the
  // streamer moves to delivering, so we stop taking money instead of silently overfunding.
  const canSend = send === "idle" && !reached && finalAmount >= cfg.minContribution;
  const rep = getReputation(handle);

  function chipIn() {
    if (!canSend) return;
    setSend("sending");
    setTimeout(() => {
      setCollected(addCollected(scope!, finalAmount));
      setSend("done");
      setTimeout(() => setSend("idle"), 2200);
    }, 1100);
  }

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(mine!.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  }

  return (
    <main className={styles.page} style={backgroundStyle(fr.design)}>
      <DonateTopBar />
      <div className={styles.col}>
        <Link className={styles.who} href={`/@${handle}`} style={{ textDecoration: "none", color: "inherit" }} title={`@${mine.handle} — open profile`}>
          {mine.avatarEnabled !== false && <Mono name={mine.name} size={56} src={mine.avatarUrl} />}
          <div>
            <div className={styles.name}>{mine.name}</div>
            <div className={styles.handle}>@{mine.handle} · <span className={styles.live}>{reached ? "goal reached" : "active"}</span></div>
          </div>
        </Link>

        <h1 className={styles.pledge}>{fr.pledge.trim() || "Help me hit the goal"}</h1>
        {fr.descriptionEnabled && fr.description && <p className={styles.desc}>{fr.description}</p>}
        <p className={styles.refundNote}>Delivered — the money is theirs. Not delivered — everyone gets it back.</p>

        <FundraiserFill pct={pct} size={128} image={fr.fillImage} />
        <div className={`${styles.pct} num`}>{Math.round(pct * 100)}%</div>
        <div className={`${styles.sums} num`}>
          {collected} $ <span>of {fr.goal} $</span>
        </div>
        <div className={styles.left}>
          {reached
            ? `Goal reached · ${collected} $ raised`
            : `${Math.max(0, fr.goal - collected)} $ to go · ${cfg.fundingDays} ${cfg.fundingDays === 1 ? "day" : "days"} left`}
        </div>

        {reached ? (
          <div className={`card ${styles.chipInCard}`}>
            <div className={styles.reachedTitle}>Goal reached 🎉</div>
            <div className="footnote">
              Collection is closed — {mine.name} has what they need and is on it. Backers are refunded automatically if
              it isn&apos;t delivered.
            </div>
          </div>
        ) : fr.widgets.find((w) => w.kind === "donate")?.enabled ? (
          <div className={`card ${styles.chipInCard}`}>
            <div className="chips" style={{ justifyContent: "center" }}>
              {fr.presets.map((p) => (
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
                min={cfg.minContribution}
                placeholder="Custom"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
              />
            </div>
            <ReputationDelta rep={rep} gain={finalAmount} tiers={mine.tiers} />
            <button type="button" className="btn" disabled={!canSend} onClick={chipIn}>
              {send === "sending" ? "Sending…" : send === "done" ? "In escrow ✓" : `Chip in ${finalAmount} $`}
            </button>
            <div className="footnote">
              {send === "done"
                ? "Held in escrow until delivery — refunded automatically if it doesn't happen."
                : `From ${cfg.minContribution} $. Your money sits in escrow, not in anyone's pocket.`}
            </div>
          </div>
        ) : null}

        {fr.widgets.find((w) => w.kind === "socials")?.enabled && (
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
          {mine.address && (
            <button type="button" className={styles.addr} onClick={copyAddress} title="Copy payout address">
              <span className="num">{mine.address.slice(0, 6)}…{mine.address.slice(-4)}</span>
              <CopyIcon /> {copied ? "Copied!" : ""}
            </button>
          )}
        </div>

        <div className={styles.footer}>
          <Logo />
        </div>
      </div>
    </main>
  );
}

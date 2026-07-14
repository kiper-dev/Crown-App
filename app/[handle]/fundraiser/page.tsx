"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { useProfile } from "@/lib/data/ProfileProvider";
import { Logo } from "@/components/Logo";
import { Mono } from "@/components/Mono";
import { CrownFill } from "@/components/CrownFill";
import { SocialIcon, SOCIAL_LABEL, QrIcon, CopyIcon } from "@/components/icons";
import { normalizeSocialLink } from "@/lib/data/social-links";
import { DEFAULT_FUNDRAISER_CONFIG } from "@/components/FundraiserGameSettings";
import { withFundraiserDefaults, readCollected, addCollected } from "@/lib/data/fundraiser";
import { backgroundStyle } from "@/lib/data/pagebuilder";
import styles from "./page.module.css";

type SendState = "idle" | "sending" | "done";

// The public fundraiser page — what a viewer opens from the streamer's link or QR.
// Until crown-app/api exists this resolves only the local profile (the same mock backend
// the rest of the app runs on), and chip-ins accumulate in localStorage so the crown
// genuinely fills up when you try it.
export default function FundraiserPage({ params }: { params: { handle: string } }) {
  const { ready, profile } = useProfile();
  const handle = decodeURIComponent(params.handle).replace(/^@/, "");

  const [collected, setCollected] = useState(0);
  const [amount, setAmount] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [send, setSend] = useState<SendState>("idle");
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    setCollected(readCollected(handle));
  }, [handle]);

  useEffect(() => {
    if (!qrOpen) return;
    QRCode.toDataURL(window.location.href, { margin: 1, width: 240, color: { dark: "#F1EFF7", light: "#00000000" } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [qrOpen]);

  if (!ready) return <main className="page" />;

  const mine = profile && profile.handle === handle ? profile : null;
  const fr = mine ? withFundraiserDefaults(mine) : null;

  if (!mine || !fr || !fr.pledge.trim()) {
    return (
      <main className="page">
        <div className="center-note">
          <h1>No active fundraiser</h1>
          <p>This streamer isn't collecting toward a goal right now.</p>
          <Link className="btn" href={`/@${handle}`}>
            To the streamer's page
          </Link>
        </div>
      </main>
    );
  }

  const cfg = mine.fundraiserConfig ?? DEFAULT_FUNDRAISER_CONFIG;
  const pct = fr.goal > 0 ? Math.min(1, collected / fr.goal) : 0;
  const chosen = amount ?? fr.presets[0];
  const customN = Math.round(Number(custom)) || 0;
  const finalAmount = custom ? customN : chosen;
  const canSend = send === "idle" && finalAmount >= cfg.minContribution;

  function chipIn() {
    if (!canSend) return;
    setSend("sending");
    setTimeout(() => {
      setCollected(addCollected(handle, finalAmount));
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
      <div className={styles.col}>
        <div className={styles.who}>
          {mine.avatarEnabled !== false && <Mono name={mine.name} size={56} />}
          <div>
            <div className={styles.name}>{mine.name}</div>
            <div className={styles.handle}>@{mine.handle} · <span className={styles.live}>active</span></div>
          </div>
        </div>

        <h1 className={styles.pledge}>{fr.pledge}</h1>
        {fr.descriptionEnabled && fr.description && <p className={styles.desc}>{fr.description}</p>}
        <p className={styles.refundNote}>Delivered — the money is theirs. Not delivered — everyone gets it back.</p>

        <CrownFill pct={pct} size={128} />
        <div className={`${styles.pct} num`}>{Math.round(pct * 100)}%</div>
        <div className={`${styles.sums} num`}>
          {collected} $ <span>of {fr.goal} $</span>
        </div>
        <div className={styles.left}>
          {Math.max(0, fr.goal - collected)} $ to go · {cfg.fundingDays} {cfg.fundingDays === 1 ? "day" : "days"} left
        </div>

        {fr.widgets.find((w) => w.kind === "donate")?.enabled && (
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
                placeholder="Your sum"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
              />
            </div>
            <button type="button" className="btn" disabled={!canSend} onClick={chipIn}>
              {send === "sending" ? "Sending…" : send === "done" ? "In escrow ✓" : `Chip in ${finalAmount} $`}
            </button>
            <div className="footnote">
              {send === "done"
                ? "Held in escrow until delivery — refunded automatically if it doesn't happen."
                : `From ${cfg.minContribution} $. Your money sits in escrow, not in anyone's pocket.`}
            </div>
          </div>
        )}

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
          <button type="button" className="btn-outline" onClick={() => setQrOpen((v) => !v)}>
            <QrIcon /> QR
          </button>
        </div>
        {qrOpen && (
          <div className={styles.qrBox}>
            {qrDataUrl ? <img src={qrDataUrl} alt="QR code for this page" width={180} height={180} /> : <div className="footnote">Generating…</div>}
          </div>
        )}

        <div className={styles.footer}>
          <Logo />
        </div>
      </div>
    </main>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { URGENCY_LABEL, type NotifUrgency } from "@/lib/data/notifications";
import styles from "./TelegramPanel.module.css";

// Settings → Telegram: connect the notification bot, choose what arrives, test it, disconnect.
// Talks only to our own /api/telegram/* on localhost — the bot process does the Telegram side.

type Status = {
  botUsername: string | null;
  linked: boolean;
  tgName: string | null;
  categories: Record<NotifUrgency, boolean> | null;
  monthly: boolean | null;
};

const CATEGORY_HINT: Record<NotifUrgency, string> = {
  action: "New tasks, deadlines, rounds closing — things that cost money if missed.",
  money: "Payouts landed, refunds went out.",
  nice: "Donations, rank-ups, records.",
  digest: "Stream and week summaries.",
  system: "A payout failed, something needs fixing.",
};

export function TelegramPanel({ handle, name }: { handle: string; name: string }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const s: Status = await (await fetch(`/api/telegram/status?handle=${encodeURIComponent(handle)}`)).json();
      setStatus(s);
      return s;
    } catch {
      return null;
    }
  }, [handle]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // while the deep link is out there, poll until the bot reports the chat linked
  useEffect(() => {
    if (!waiting) return;
    pollRef.current = setInterval(async () => {
      const s = await fetchStatus();
      if (s?.linked) {
        setWaiting(false);
        setDeepLink(null);
      }
    }, 2000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [waiting, fetchStatus]);

  async function connect() {
    const res = await (
      await fetch("/api/telegram/link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ handle, name }),
      })
    ).json();
    if (res.deepLink) {
      setDeepLink(res.deepLink);
      setWaiting(true);
      window.open(res.deepLink, "_blank", "noreferrer");
    } else {
      setDeepLink(null);
      setStatus((s) => (s ? { ...s, botUsername: null } : s));
    }
  }

  async function toggle(cat: NotifUrgency) {
    if (!status?.categories) return;
    const next = { ...status.categories, [cat]: !status.categories[cat] };
    setStatus({ ...status, categories: next });
    await fetch("/api/telegram/prefs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ handle, categories: { [cat]: next[cat] } }),
    });
  }

  async function toggleMonthly() {
    if (!status) return;
    const next = !status.monthly;
    setStatus({ ...status, monthly: next });
    await fetch("/api/telegram/prefs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ handle, monthly: next }),
    });
  }

  async function sendTest() {
    await fetch("/api/telegram/notify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ handle, kind: "donation", title: "Test from your cabinet", body: "This is how notifications will look.", force: true }),
    });
    setTestSent(true);
    setTimeout(() => setTestSent(false), 2500);
  }

  async function disconnect() {
    await fetch("/api/telegram/unlink", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ handle }),
    });
    fetchStatus();
  }

  if (!status) return null;

  return (
    <div className="card">
      <div className={styles.head}>
        <div>
          <h3 className={styles.title}>Telegram</h3>
          <p className={styles.sub}>Everything from the bell, in your pocket. Optional — off until you connect it.</p>
        </div>
        {status.linked && (
          <span className={styles.connected}>
            <span className={styles.connectedDot} aria-hidden />
            Connected{status.tgName ? ` · ${status.tgName}` : ""}
          </span>
        )}
      </div>

      {!status.linked ? (
        status.botUsername ? (
          <div className={styles.connectRow}>
            <button className="btn" type="button" onClick={connect}>
              {waiting ? "Waiting for Telegram…" : "Connect Telegram"}
            </button>
            {waiting && deepLink && (
              <span className={styles.waitNote}>
                Didn&apos;t open?{" "}
                <a href={deepLink} target="_blank" rel="noreferrer">
                  t.me/{status.botUsername}
                </a>{" "}
                — tap Start there.
              </span>
            )}
          </div>
        ) : (
          <p className={styles.offline}>The bot isn&apos;t running. Start it with a token from @BotFather — see bot/README.md.</p>
        )
      ) : (
        <>
          <div className={styles.toggles}>
            {(Object.keys(URGENCY_LABEL) as NotifUrgency[]).map((u) => (
              <label className={styles.toggle} key={u}>
                <input type="checkbox" checked={status.categories?.[u] ?? true} onChange={() => toggle(u)} />
                <span className={styles.toggleBody}>
                  <span className={styles.toggleLabel}>{URGENCY_LABEL[u]}</span>
                  <span className={styles.toggleHint}>{CATEGORY_HINT[u]}</span>
                </span>
              </label>
            ))}
            <label className={styles.toggle}>
              <input type="checkbox" checked={status.monthly ?? true} onChange={toggleMonthly} />
              <span className={styles.toggleBody}>
                <span className={styles.toggleLabel}>Monthly digest</span>
                <span className={styles.toggleHint}>Earned, VIPs gained, best day — one message a month.</span>
              </span>
            </label>
          </div>

          <div className={styles.actions}>
            <button className="btn-outline" type="button" onClick={sendTest}>
              {testSent ? "Sent ✓" : "Send a test"}
            </button>
            <button className={styles.disconnect} type="button" onClick={disconnect}>
              Disconnect
            </button>
          </div>
        </>
      )}
    </div>
  );
}

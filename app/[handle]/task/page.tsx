"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useProfile } from "@/lib/data/ProfileProvider";
import { useCrown } from "@/lib/data/DataProvider";
import { Logo } from "@/components/Logo";
import { ReputationDelta } from "@/components/ReputationDelta";
import { DonateTopBar } from "@/components/DonateTopBar";
import { Mono } from "@/components/Mono";
import { SocialIcon, SOCIAL_LABEL } from "@/components/icons";
import { normalizeSocialLink } from "@/lib/data/social-links";
import { DEFAULT_TASK_CONFIG } from "@/components/TaskGameSettings";
import { withTaskPageDefaults, readTasks, addTask, activeCount, type GameTask } from "@/lib/data/tasks";
import { backgroundStyle } from "@/lib/data/pagebuilder";
import { resolvePublicSession } from "@/lib/data/gameSessions";
import { GameTabs } from "@/components/games/GameTabs";
import styles from "./page.module.css";

type SendState = "idle" | "sending" | "done";

// The public task page — what a viewer opens from the link or QR to set a paid task.
// Until crown-app/api exists this resolves only the local profile and the queue accumulates in
// localStorage, so a task set here really does show up in the streamer's Task → Overview tab.
export default function TaskPage({ params }: { params: { handle: string } }) {
  const { ready, profile } = useProfile();
  const { getReputation } = useCrown();
  const handle = decodeURIComponent(params.handle).replace(/^@/, "");

  // Session resolution: ?s=<id> picks a specific session; one live session resolves itself;
  // several → the picker below; none → the "nothing running" gate. Streamers who never used
  // sessions fall through on the bare handle (legacy data keeps working).
  const [pub, setPub] = useState<ReturnType<typeof resolvePublicSession> | null>(null);
  useEffect(() => {
    const sParam = new URLSearchParams(window.location.search).get("s");
    setPub(resolvePublicSession(handle, "task", sParam));
  }, [handle]);
  const scope = pub?.scope ?? null;

  const [queue, setQueue] = useState<GameTask[]>([]);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [send, setSend] = useState<SendState>("idle");
  const [durationH, setDurationH] = useState<number | null>(null); // the donor's deadline pick
  const [view, setView] = useState<"set" | "queue">("set"); // the top toggle: set a task vs. what's already on the list

  useEffect(() => {
    if (!scope) return;
    setQueue(readTasks(scope));
  }, [scope]);

  if (!ready) return <main className="page" />;

  const mine = profile && profile.handle === handle ? profile : null;
  const tp = mine ? withTaskPageDefaults(mine) : null;

  if (!mine || !tp) {
    return (
      <main className="page">
        <div className="center-note">
          <h1>No tasks here</h1>
          <p>This content maker isn&apos;t taking paid tasks right now.</p>
          <Link className="btn" href={`/@${handle}`}>
            To the content maker&apos;s page
          </Link>
        </div>
      </main>
    );
  }

  const cfg = mine.taskConfig ?? DEFAULT_TASK_CONFIG;
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
              <p>Nothing is live. Start a session in the cabinet — Task for donation → Sessions — and this page switches on.</p>
              <Link className="btn" href={`/@${handle}`}>
                To the content maker&apos;s page
              </Link>
            </>
          )}
        </div>
      </main>
    );
  }

  const running = activeCount(queue);
  const full = running >= cfg.maxActiveTasks;

  const chosen = amount ?? tp.presets[0];
  const customN = Math.round(Number(custom)) || 0;
  const finalAmount = custom ? customN : chosen;
  const canSend = send === "idle" && !full && text.trim().length > 0 && finalAmount >= cfg.minAmount;

  // $1 donated = 1 reputation (front.md I §4) — so this task's amount is exactly the gain.
  const rep = getReputation(handle);

  function submit() {
    if (!canSend) return;
    setSend("sending");
    setTimeout(() => {
      setQueue(addTask(scope!, { from: name, amount: finalAmount, text, requireApproval: cfg.requireApproval, durationHours: durationH ?? Math.min(24, cfg.deadlineHours) }));
      setText("");
      setCustom("");
      setSend("done");
      setTimeout(() => setSend("idle"), 2400);
    }, 1100);
  }


  return (
    <main className={styles.page} style={backgroundStyle(tp.design)}>
      <DonateTopBar />
      <div className={styles.col}>
        <Link className={styles.who} href={`/@${handle}`} style={{ textDecoration: "none", color: "inherit" }} title={`@${mine.handle} — open profile`}>
          {mine.avatarEnabled !== false && <Mono name={mine.name} size={56} src={mine.avatarUrl} />}
          <div>
            <div className={styles.name}>{mine.name}</div>
            <div className={styles.handle}>
              @{mine.handle} · <span className={styles.live}>{full ? "queue full" : "taking tasks"}</span>
            </div>
          </div>
        </Link>

        <h1 className={styles.headline}>{tp.headline.trim() || "Set me a task"}</h1>
        {tp.descriptionEnabled && tp.description && <p className={styles.desc}>{tp.description}</p>}

        {/* Tab 1: set a task. Tab 2: what other viewers have already set, and where each stands. */}
        <GameTabs
          value={view}
          onChange={(v) => setView(v as "set" | "queue")}
          tabs={[
            { key: "set", label: "Set a task" },
            { key: "queue", label: "On the list", count: running },
          ]}
        />

        {view === "queue" && (
          <div className={styles.queue}>
            {queue.length === 0 ? (
              <div className="footnote" style={{ textAlign: "center", padding: "12px 0" }}>
                No tasks yet — yours would be the first.
              </div>
            ) : (
              queue.map((t) => (
                <div key={t.id} className={styles.task}>
                  <span className={styles.taskText}>{t.text}</span>
                  <span className={`${styles.taskAmt} num`}>{t.amount} $</span>
                  <span className={`pill ${t.state === "done" ? "ok" : t.state === "refunded" ? "bad" : "wait"}`}>
                    <span className="dot" />
                    {t.state === "pending" ? "awaiting" : t.state === "active" ? "in progress" : t.state === "done" ? "done" : "refunded"}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {view === "set" && tp.widgets.find((w) => w.kind === "donate")?.enabled && (
          <div className={`card ${styles.form}`}>
            <div className="field">
              <input type="text" placeholder="Your name (optional)" value={name} onChange={(e) => setName(e.target.value)} disabled={full} />
            </div>
            <div className="field">
              <textarea
                rows={3}
                placeholder="What should they do?"
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={full}
              />
            </div>

            {/* The deadline is the DONOR's knob (game-spec §7): pick within the
                streamer's ceiling. Chips filtered so nothing above it shows. */}
            <div className="chips" style={{ justifyContent: "center" }}>
              {[6, 24, 72].filter((h) => h <= cfg.deadlineHours).map((h) => (
                <button
                  key={`d${h}`}
                  type="button"
                  className={`chip${(durationH ?? Math.min(24, cfg.deadlineHours)) === h ? " active" : ""}`}
                  disabled={full}
                  onClick={() => setDurationH(h)}
                >
                  {h < 24 ? `${h}h` : `${h / 24}d`}
                </button>
              ))}
            </div>

            <div className="chips" style={{ justifyContent: "center" }}>
              {tp.presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`chip${!custom && chosen === p ? " active" : ""}`}
                  disabled={full}
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
                min={cfg.minAmount}
                placeholder="Custom"
                value={custom}
                disabled={full}
                onChange={(e) => setCustom(e.target.value)}
              />
            </div>

            {/* What this task does to your standing with them: $1 = 1 point, so the amount above
                is the gain. Shared with the other mini-games via ReputationDelta. */}
            <ReputationDelta rep={rep} gain={finalAmount} tiers={mine.tiers} />

            <button type="button" className={`btn ${styles.send}`} disabled={!canSend} onClick={submit}>
              {send === "sending" ? "Sending…" : send === "done" ? "In escrow ✓" : `Set the task · ${finalAmount} $`}
            </button>

            <div className="footnote">
              {full
                ? `The queue is full — ${mine.name} takes ${cfg.maxActiveTasks} at a time. Try again once one wraps up.`
                : send === "done"
                  ? cfg.requireApproval
                    ? "Sent — it's waiting for them to accept. Declined or missed, and you're refunded."
                    : "Sent — the clock is already running."
                  : `From ${cfg.minAmount} $ · you pick the deadline, up to ${cfg.deadlineHours}h.`}
            </div>
          </div>
        )}

        {tp.widgets.find((w) => w.kind === "socials")?.enabled && (
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


        <div className={styles.footer}>
          <Logo />
        </div>
      </div>
    </main>
  );
}

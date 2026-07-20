"use client";

import { useEffect, useState } from "react";
import { Mono } from "@/components/Mono";
import { StatTile } from "@/components/ops";
import { DEFAULT_TASK_CONFIG } from "@/components/TaskGameSettings";
import { readTasks, setTaskState, removeTask, taskTotals, type GameTask, type TaskState } from "@/lib/data/tasks";
import { useCrown } from "@/lib/data/DataProvider";
import type { Profile } from "@/lib/data/types";
import styles from "./GameOverview.module.css";

// Pill tone + label per state: purple (attn) = needs your decision, white (ok) = live/kept,
// grey (wait) = refunded. Resolved rows also dim, so the eye lands on what's still open.
const STATE_PILL: Record<TaskState, { tone: string; label: string }> = {
  pending: { tone: "attn", label: "Awaiting you" },
  active: { tone: "ok", label: "Running" },
  done: { tone: "ok", label: "Done" },
  refunded: { tone: "wait", label: "Refunded" },
};

// The streamer's live queue of paid tasks — the moment of the game the settings only describe.
// Approve to start the clock, complete to keep the money, or refund it to the viewer.
// A COMPLETED task leaves this queue for good: its money becomes a donation in the feed
// (source: "task"), so afterwards it lives where money lives — the Donations tab.
export function TaskOverview({ profile, scope }: { profile: Profile; scope?: string }) {
  const handle = scope ?? profile.handle;
  const cfg = profile.taskConfig ?? DEFAULT_TASK_CONFIG;
  const { feed, applyMockDonation } = useCrown();
  const [tasks, setTasks] = useState<GameTask[]>([]);

  useEffect(() => setTasks(readTasks(handle)), [handle]);

  function act(id: string, state: TaskState) {
    setTasks(setTaskState(handle, id, state));
  }

  // Complete: the escrow settles — money to the streamer, reputation to the viewer, a feed
  // entry with source "task" — and the row disappears from this queue.
  function complete(t: GameTask) {
    applyMockDonation({ handle: profile.handle, amount: t.amount, name: t.from, message: t.text, source: "task" });
    setTasks(removeTask(handle, t.id));
  }

  const totals = taskTotals(tasks);
  // Earned = every task that ever settled into the feed, not just this queue's leftovers.
  const earned = feed.filter((d) => d.source === "task").reduce((sum, d) => sum + d.amount, 0);
  // Completed tasks are gone (they're in Donations); seeded "done" rows hide by the same rule.
  const shown = tasks.filter((t) => t.state !== "done");

  return (
    <div className={styles.col}>
      <div className="footnote">
        Approve a task to start its clock, complete it to keep the money, or refund it to the viewer. Completed
        tasks move to Donations.
      </div>

      <div className="stat-grid">
        <StatTile k="Awaiting you" v={String(totals.pending)} />
        <StatTile k="Active" v={`${totals.active} / ${cfg.maxActiveTasks}`} />
        <StatTile k="Earned" v={`${earned} $`} />
      </div>

      {shown.length === 0 ? (
        <div className="empty-log">No tasks yet — share your task page so viewers can set you one.</div>
      ) : (
        <div className={styles.list}>
          {shown.map((t) => {
            const pill = STATE_PILL[t.state];
            const resolved = t.state === "done" || t.state === "refunded";
            return (
              <div key={t.id} className={`${styles.row}${resolved ? ` ${styles.rowDone}` : ""}`}>
                <Mono name={t.from} size={40} />
                <div className={styles.rowMain}>
                  <div className={styles.rowTop}>
                    <span className={styles.who}>{t.from}</span>
                    <span className={styles.when}>
                      {t.when}
                      {t.durationHours ? ` · ${t.durationHours}h window` : ""}
                    </span>
                  </div>
                  <div className={styles.text}>{t.text}</div>
                  {t.state === "pending" && (
                    <div className={styles.actions}>
                      <button type="button" className="btn" onClick={() => act(t.id, "active")}>
                        Approve
                      </button>
                      <button type="button" className="btn-outline" onClick={() => act(t.id, "refunded")}>
                        Decline
                      </button>
                    </div>
                  )}
                  {t.state === "active" && (
                    <div className={styles.actions}>
                      <button type="button" className="btn" onClick={() => complete(t)}>
                        Mark done
                      </button>
                      <button type="button" className="btn-outline" onClick={() => act(t.id, "refunded")}>
                        Refund
                      </button>
                    </div>
                  )}
                </div>
                <div className={styles.side}>
                  <span className={styles.amount}>
                    <span className="num">{t.amount}</span> $
                  </span>
                  <span className={`pill ${pill.tone}`}>
                    <span className="dot" />
                    {pill.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

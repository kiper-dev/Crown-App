"use client";

import type { Profile, TaskGameConfig } from "@/lib/data/types";

export const DEFAULT_TASK_CONFIG: TaskGameConfig = {
  minAmount: 10,
  deadlineHours: 24,
  requireApproval: true,
  maxActiveTasks: 5,
};

const DEADLINE_OPTIONS = [
  { hours: 6, label: "6 hours" },
  { hours: 12, label: "12 hours" },
  { hours: 24, label: "24 hours" },
  { hours: 48, label: "48 hours" },
  { hours: 72, label: "3 days" },
  { hours: 168, label: "1 week" },
];

// Rules the streamer sets for the Task game — how much a task costs at minimum, how long
// they have to complete one, whether they get to accept it first, and how many can queue up
// at once. Same live-save pattern as SettingsPanel/PageBuilder: no separate "Save" step.
export function TaskGameSettings({ profile, onSave }: { profile: Profile; onSave: (p: Profile) => void }) {
  const cfg = profile.taskConfig ?? DEFAULT_TASK_CONFIG;

  function patch(next: Partial<TaskGameConfig>) {
    onSave({ ...profile, taskConfig: { ...cfg, ...next } });
  }

  return (
    <div className="game-settings">
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2>Rules</h2>

        <div className="field">
          <label htmlFor="task-min">Minimum task amount</label>
          <div className="affix has-pre">
            <span className="affix-pre">$</span>
            <input
              id="task-min"
              type="number"
              min={1}
              value={cfg.minAmount}
              onChange={(e) => patch({ minAmount: Math.max(1, Math.round(+e.target.value) || 1) })}
            />
          </div>
          <div className="footnote">Viewers can't submit a task for less than this.</div>
        </div>

        <div className="field">
          <label htmlFor="task-deadline">Longest deadline a viewer may pick</label>
          <select id="task-deadline" value={cfg.deadlineHours} onChange={(e) => patch({ deadlineHours: +e.target.value })}>
            {DEADLINE_OPTIONS.map((o) => (
              <option key={o.hours} value={o.hours}>
                {o.label}
              </option>
            ))}
          </select>
          <div className="footnote">Miss it and the viewer can claim a refund. Shown on the task page up front.</div>
        </div>

        <div className="field">
          <label htmlFor="task-max">Max active tasks</label>
          <input
            id="task-max"
            type="number"
            min={1}
            max={50}
            value={cfg.maxActiveTasks}
            onChange={(e) => patch({ maxActiveTasks: Math.max(1, Math.round(+e.target.value) || 1) })}
          />
          <div className="footnote">New tasks pause once this many are in progress, so the queue stays doable.</div>
        </div>

        <label className={`toggle${cfg.requireApproval ? " on" : ""}`}>
          <span className="track">
            <span className="knob" />
          </span>
          <input type="checkbox" hidden checked={cfg.requireApproval} onChange={(e) => patch({ requireApproval: e.target.checked })} />
          Require your approval before the clock starts
        </label>
        <div className="footnote">
          Off: paying starts the timer right away. On: you confirm the task first, then it starts.
        </div>
      </div>

      <div className="notice">
        <b>Fixed by the contract, not a setting here:</b> once the deadline passes, anyone can trigger the refund to the
        viewer. That's the one promise the front end gets to make.
      </div>
    </div>
  );
}

// Task game — the streamer's queue of paid tasks, and the localStorage mock behind it.
// Data + store, no React. The real queue will come from crown-app/api reading the escrows;
// until then this seeds the cabinet's Task → Overview tab and lets the actions actually stick.

export type TaskState = "pending" | "active" | "done" | "refunded";

export interface GameTask {
  id: string;
  from: string; // viewer name
  amount: number; // $ locked in escrow for this task
  text: string; // what the viewer is paying for
  state: TaskState;
  when: string; // human-readable "2h ago", like the donations feed
}

// Seed queue — a realistic mix so the tab shows every state: awaiting approval, running,
// and already resolved. Newest first.
export const MOCK_TASKS: GameTask[] = [
  { id: "t1", from: "Timur", amount: 50, text: "Beat the first boss with no armor on.", state: "pending", when: "8 min ago" },
  { id: "t2", from: "anna_k", amount: 25, text: "Speak only in rhymes for one full game.", state: "pending", when: "20 min ago" },
  { id: "t3", from: "Max", amount: 40, text: "Play the next round on inverted controls.", state: "active", when: "1h ago" },
  { id: "t4", from: "Dan", amount: 15, text: "Do the intro voiceover as a pirate.", state: "active", when: "2h ago" },
  { id: "t5", from: "lena", amount: 80, text: "Finish a clutch 1v3 to win the map.", state: "done", when: "Yesterday" },
  { id: "t6", from: "guest_91", amount: 10, text: "Impossible speedrun in under a minute.", state: "refunded", when: "Yesterday" },
];

const KEY = "crown-tasks";

export function readTasks(handle: string): GameTask[] {
  try {
    const raw = localStorage.getItem(`${KEY}:${handle}`);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list;
    }
  } catch {}
  // First visit: start from the seed (not persisted until the streamer acts on a task).
  return MOCK_TASKS.map((t) => ({ ...t }));
}

function writeTasks(handle: string, list: GameTask[]) {
  try {
    localStorage.setItem(`${KEY}:${handle}`, JSON.stringify(list));
  } catch {}
}

// Move one task to a new state (approve/decline/complete/refund) and persist the whole queue.
export function setTaskState(handle: string, id: string, state: TaskState): GameTask[] {
  const next = readTasks(handle).map((t) => (t.id === id ? { ...t, state } : t));
  writeTasks(handle, next);
  return next;
}

// Counts the cabinet cares about: what's waiting, what's running, and what you've earned.
export function taskTotals(list: GameTask[]) {
  return {
    pending: list.filter((t) => t.state === "pending").length,
    active: list.filter((t) => t.state === "active").length,
    earned: list.filter((t) => t.state === "done").reduce((sum, t) => sum + t.amount, 0),
  };
}

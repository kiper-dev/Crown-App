import fs from "fs";
import path from "path";
import { backupTo } from "./db";

// Daily on-line snapshot of data/crown.db → data/backups/crown-YYYY-MM-DD.db
// (VACUUM INTO — consistent even mid-write), keeping the last 7. The DB is
// the only copy of profiles and game texts, so losing it must cost at most
// a day, not everything. No-op when the DB is remote (LIBSQL_URL).

const BACKUP_DIR = path.join(process.env.CROWN_DB_DIR || path.join(process.cwd(), "data"), "backups");
const KEEP = 7;

export async function backupOnce(): Promise<string | null> {
  const stamp = new Date().toISOString().slice(0, 10);
  const dest = path.join(BACKUP_DIR, `crown-${stamp}.db`);
  if (fs.existsSync(dest)) return null; // today's snapshot already exists
  const ok = await backupTo(dest);
  if (!ok) return null;
  // Rotate: drop everything beyond the newest KEEP snapshots.
  const all = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => /^crown-\d{4}-\d{2}-\d{2}\.db$/.test(f))
    .sort()
    .reverse();
  for (const stale of all.slice(KEEP)) fs.unlinkSync(path.join(BACKUP_DIR, stale));
  return dest;
}

const LOOP_KEY = Symbol.for("crown.backup.loop");

export function startBackupLoop(): void {
  const g = globalThis as { [LOOP_KEY]?: boolean };
  if (g[LOOP_KEY]) return;
  g[LOOP_KEY] = true;
  const run = () => {
    backupOnce()
      .then((dest) => {
        if (dest) console.log(`[backup] snapshot written: ${dest}`);
      })
      .catch((e) => console.warn("[backup] failed:", e?.message ?? e));
  };
  run();
  setInterval(run, 60 * 60 * 1000); // hourly check, writes at most once a day
}

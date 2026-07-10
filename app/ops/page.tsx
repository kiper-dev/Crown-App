"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CrownMark, SocialIcon, NavIcon } from "@/components/icons";
import { StatTile, BarList, MiniArea, MiniBars, StatusPill, money, shortMoney } from "@/components/ops";
import { useCrown } from "@/lib/data/DataProvider";
import {
  OPS_STATS, OPS_GROWTH, OPS_BY_PLATFORM, OPS_BY_SIZE, OPS_GAME_ADOPTION, OPS_TASK_STATUS,
  OPS_STREAMERS, OPS_TASKS, OPS_VIEWERS, TASK_STATUS_META, PENALTY_LADDER, APPLY_ACTIONS,
  type TaskStatus,
} from "@/lib/data/ops-mock";

type Section = "overview" | "streamers" | "viewers" | "tasks" | "moderation" | "settings";
const NAV: { key: Section; label: string; icon: Parameters<typeof NavIcon>[0]["name"] }[] = [
  { key: "overview", label: "Overview", icon: "home" },
  { key: "streamers", label: "Streamers", icon: "viewers" },
  { key: "viewers", label: "Viewers", icon: "viewers" },
  { key: "tasks", label: "Tasks", icon: "games" },
];
const RANGES = [
  { key: "1d", label: "1D", n: 2 },
  { key: "1w", label: "1W", n: 7 },
  { key: "1m", label: "1M", n: 14 },
  { key: "all", label: "All", n: 999 },
];

export default function OpsPage() {
  const [section, setSection] = useState<Section>("overview");

  return (
    <main className="ops">
      <nav className="ops-nav" aria-label="Admin panel sections">
        <div className="brand">
          <Link className="logo" href="/" aria-label="Go to homepage">
            <CrownMark />
            Crown
          </Link>
        </div>
        <div className="brand" style={{ paddingTop: 0 }}>
          <span className="tag">admin panel</span>
        </div>
        {NAV.map((n) => (
          <button key={n.key} type="button" className={`ops-item${section === n.key ? " active" : ""}`} onClick={() => setSection(n.key)}>
            <NavIcon name={n.icon} />
            {n.label}
          </button>
        ))}
        <div className="ops-divider" />
        <button type="button" className={`ops-item${section === "moderation" ? " active" : ""}`} onClick={() => setSection("moderation")}>
          <NavIcon name="settings" />
          Moderation
        </button>
        <div className="ops-divider" />
        <button type="button" className={`ops-item${section === "settings" ? " active" : ""}`} onClick={() => setSection("settings")}>
          <NavIcon name="widgets" />
          Settings
        </button>
      </nav>

      <div className="ops-main">
        {section === "overview" && <Overview />}
        {section === "streamers" && <Streamers />}
        {section === "viewers" && <Viewers />}
        {section === "tasks" && <Tasks />}
        {section === "moderation" && <Moderation />}
        {section === "settings" && <Settings />}
      </div>
    </main>
  );
}

function Overview() {
  const [range, setRange] = useState("all");
  const n = RANGES.find((r) => r.key === range)?.n ?? 999;
  const rec = OPS_GROWTH.received.slice(-n);
  const vw = OPS_GROWTH.viewers.slice(-n);
  const s = OPS_STATS;

  return (
    <>
      <div className="ops-head">
        <div>
          <h1>Overview</h1>
          <div className="sub">The whole platform, across all streamers.</div>
        </div>
      </div>

      <div className="stat-grid">
        <StatTile k="Streamers" v={String(s.streamers)} s={`${s.streamersActive} active · ${s.streamersLive} live`} />
        <StatTile k="Total received" v={money(s.received)} />
        <StatTile k="Last 7 days" v={money(s.last7d)} />
        <StatTile k="Fee" v={money(s.fee)} s="3% of volume" />
        <StatTile k="Viewers" v={String(s.viewers)} s="unique" />
        <StatTile k="Average per streamer" v={money(s.avgPerStreamer)} />
        <StatTile k="Largest" v={money(s.largest)} />
        <StatTile k="Live" v={String(s.streamersLive)} s={`of ${s.streamers}`} />
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <h2>Growth</h2>
            <div className="ph-sub">Cumulative · before launch — 0</div>
          </div>
          <div className="seg" role="group" aria-label="Period">
            {RANGES.map((r) => (
              <button key={r.key} type="button" className={range === r.key ? "active" : ""} onClick={() => setRange(r.key)}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div className="growth-two">
          <div className="growth-col">
            <div className="gt">Total received</div>
            <div className="gv num">{money(s.received)}</div>
            <MiniArea data={rec} />
          </div>
          <div className="growth-col">
            <div className="gt">Viewers</div>
            <div className="gv num">{s.viewers}</div>
            <MiniBars data={vw} />
          </div>
        </div>
      </div>

      <div className="two-col">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>Donations by platform</h2>
              <div className="ph-sub">Where volume concentrates</div>
            </div>
          </div>
          <BarList
            unit="money"
            bars={OPS_BY_PLATFORM.map((p) => ({
              label: p.label,
              value: p.value,
              icon: <SocialIcon kind={p.kind} width={16} height={16} />,
              display: shortMoney(p.value),
            }))}
          />
        </div>
        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>Streamers by volume</h2>
              <div className="ph-sub">Distribution by donation amount</div>
            </div>
          </div>
          <BarList unit="count" bars={OPS_BY_SIZE} />
        </div>
      </div>

      <div className="two-col">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>Games</h2>
              <div className="ph-sub">How many pages have each one enabled</div>
            </div>
          </div>
          <BarList unit="count" bars={OPS_GAME_ADOPTION} />
        </div>
        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>Tasks by status</h2>
              <div className="ph-sub">1 paid out to streamer · 1 refunded to viewer</div>
            </div>
          </div>
          <div className="barlist">
            {OPS_TASK_STATUS.map((t) => (
              <div className="barrow" key={t.label} style={{ gridTemplateColumns: "1fr auto" }}>
                <StatusPill tone={t.tone}>{t.label}</StatusPill>
                <span className="bv num">{t.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function Streamers() {
  return (
    <>
      <div className="ops-head">
        <div>
          <h1>Streamers</h1>
          <div className="sub">{OPS_STREAMERS.length} of {OPS_STATS.streamers}</div>
        </div>
        <div className="ops-controls">
          <div className="seg">
            <button type="button" className="active">All time</button>
            <button type="button">7 days</button>
          </div>
        </div>
      </div>

      <div className="panel" style={{ padding: 0 }}>
        <div className="otable-wrap">
          <table className="otable">
            <thead>
              <tr>
                <th className="rank">#</th>
                <th>Streamer</th>
                <th>Socials</th>
                <th className="r">Received</th>
                <th className="r">7 days</th>
                <th className="r">Viewers</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {OPS_STREAMERS.map((r, i) => (
                <tr key={r.handle}>
                  <td className="rank num">{i + 1}</td>
                  <td>
                    <div className="who-cell">
                      <Link className="h" href={`/@${r.handle}`}>@{r.handle}</Link>
                      <span className="n">{r.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="socials-mini">
                      {r.socials.map((k) => (
                        <SocialIcon key={k} kind={k} width={16} height={16} />
                      ))}
                    </span>
                  </td>
                  <td className="r money num">{money(r.received)}</td>
                  <td className="r num" style={{ color: "var(--text-2)" }}>{money(r.d7)}</td>
                  <td className="r num">{r.viewers}</td>
                  <td>{r.live ? <span className="live"><span className="dot" />live</span> : <span style={{ color: "var(--text-3)" }}>active</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function Viewers() {
  return (
    <>
      <div className="ops-head">
        <div>
          <h1>Viewers</h1>
          <div className="sub">Top by reputation on the platform</div>
        </div>
      </div>
      <div className="panel" style={{ padding: 0 }}>
        <div className="otable-wrap">
          <table className="otable">
            <thead>
              <tr>
                <th className="rank">#</th>
                <th>Wallet</th>
                <th className="r">Donated</th>
                <th className="r">Reputation</th>
                <th className="r">Streamers</th>
                <th className="r">Activity</th>
              </tr>
            </thead>
            <tbody>
              {OPS_VIEWERS.map((v, i) => (
                <tr key={v.addr}>
                  <td className="rank num">{i + 1}</td>
                  <td className="mono-addr">{v.addr}</td>
                  <td className="r money num">{money(v.donated)}</td>
                  <td className="r num">{v.reputation}</td>
                  <td className="r num">{v.streamers}</td>
                  <td className="r" style={{ color: "var(--text-3)" }}>{v.last}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

const TASK_FILTERS: { key: string; label: string; match: (s: TaskStatus) => boolean }[] = [
  { key: "all", label: "All", match: () => true },
  { key: "live", label: "Active", match: (s) => ["await", "progress", "review"].includes(s) },
  { key: "disp", label: "Disputes", match: (s) => ["dispute", "vote"].includes(s) },
  { key: "done", label: "Completed", match: (s) => ["refund", "paid"].includes(s) },
];

function Tasks() {
  const [filter, setFilter] = useState("all");
  const match = TASK_FILTERS.find((f) => f.key === filter)!.match;
  const rows = OPS_TASKS.filter((t) => match(t.status));
  const total = OPS_TASKS.reduce((a, t) => a + t.amount, 0);

  return (
    <>
      <div className="ops-head">
        <div>
          <h1>Tasks</h1>
          <div className="sub">All escrow tasks across streamers — {OPS_TASKS.length} worth {money(total)} in play.</div>
        </div>
        <div className="ops-controls">
          <div className="seg">
            {TASK_FILTERS.map((f) => (
              <button key={f.key} type="button" className={filter === f.key ? "active" : ""} onClick={() => setFilter(f.key)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="panel" style={{ padding: 0 }}>
        <div className="otable-wrap">
          <table className="otable">
            <thead>
              <tr>
                <th>Date</th>
                <th>Streamer</th>
                <th>Task</th>
                <th>Viewer</th>
                <th className="r">Amount</th>
                <th>Outcome</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t, i) => {
                const meta = TASK_STATUS_META[t.status];
                return (
                  <tr key={i}>
                    <td style={{ color: "var(--text-3)", whiteSpace: "nowrap" }}>{t.date}</td>
                    <td><Link href={`/@${t.handle}`}>@{t.handle}</Link></td>
                    <td style={{ maxWidth: 420 }}>{t.task}</td>
                    <td className="mono-addr">{t.supporter}</td>
                    <td className="r money num">{money(t.amount)}</td>
                    <td>
                      <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                      {meta.note ? <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 4 }}>{meta.note}</div> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function classify(text: string): { tone: "ok" | "attn" | "bad"; verdict: string; note: string } {
  const t = text.toLowerCase();
  if (/(child.*porn|csam|drugs|terroris)/.test(t)) return { tone: "bad", verdict: "Escalate", note: "Critical: preserve and hand off to law enforcement." };
  if (/(kill|threat|violence|porn|scam)/.test(t)) return { tone: "attn", verdict: "Hide", note: "Rule violation: the message is hidden, the streamer gets a flag." };
  if (!text.trim()) return { tone: "ok", verdict: "—", note: "Enter text to check." };
  return { tone: "ok", verdict: "Passed", note: "No violations found." };
}

function Moderation() {
  const [text, setText] = useState("");
  const [checked, setChecked] = useState<ReturnType<typeof classify> | null>(null);
  const [action, setAction] = useState(APPLY_ACTIONS[0]);
  const [reason, setReason] = useState("");
  const [target, setTarget] = useState("");
  const [preserve, setPreserve] = useState(false);
  const [log, setLog] = useState<{ action: string; target: string; reason: string; when: string }[]>([]);

  function apply() {
    if (!target) return;
    setLog((p) => [{ action, target, reason: reason || "—", when: "just now" }, ...p]);
    setReason("");
    setTarget("");
  }

  return (
    <>
      <div className="ops-head">
        <div>
          <h1>Moderation</h1>
          <div className="sub">Platform level: what a streamer can't do.</div>
        </div>
      </div>

      <div className="mod-stack">
        <div>
          <div className="panel-head"><div><h2>Check sandbox</h2><div className="ph-sub">Type in text — we'll run it through the same pipeline as the live path. Nothing is saved.</div></div></div>
          <div className="panel mod-sandbox">
            <div className="field">
              <label htmlFor="mod-text">Text to check</label>
              <textarea id="mod-text" placeholder="e.g.: great stream · spam · threat" value={text} onChange={(e) => setText(e.target.value)} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 16 }}>
              <button className="btn-outline" type="button" onClick={() => setChecked(classify(text))}>Check</button>
              {checked ? <StatusPill tone={checked.tone}>{checked.verdict}</StatusPill> : null}
            </div>
            {checked ? <div className="verdict" style={{ marginTop: 16 }}>{checked.note}</div> : null}
          </div>
        </div>

        <div>
          <div className="panel-head"><div><h2>Penalty ladder</h2><div className="ph-sub">From mild to severe</div></div></div>
          <div className="ladder">
            {PENALTY_LADDER.map((r) => (
              <div key={r.n} className={`rung${r.severe ? " severe" : ""}`}>
                <span className="num">{r.n}</span>
                {r.label}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="panel-head"><div><h2>Apply a measure</h2></div></div>
          <div className="panel">
            <div className="apply-grid">
              <div className="field">
                <label>Action</label>
                <select value={action} onChange={(e) => setAction(e.target.value)}>
                  {APPLY_ACTIONS.map((a) => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Reason</label>
                <input type="text" placeholder="CSAM / flooding / sanctions" value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>
              <div className="field">
                <label>Streamer</label>
                <select value={target} onChange={(e) => setTarget(e.target.value)}>
                  <option value="">— choose a streamer —</option>
                  {OPS_STREAMERS.map((r) => <option key={r.handle} value={r.handle}>@{r.handle}</option>)}
                </select>
              </div>
              <label className={`toggle${preserve ? " on" : ""}`} style={{ alignSelf: "end", height: 52 }} onClick={() => setPreserve((v) => !v)}>
                <span className="track"><span className="knob" /></span>
                Preserve evidence + report
              </label>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 20 }}>
              <button className="btn-danger" type="button" disabled={!target} onClick={apply}>Apply measure</button>
              {!target ? <span className="footnote">Specify a target: streamer</span> : null}
            </div>
          </div>
        </div>

        <div>
          <div className="panel-head"><div><h2>Incident log</h2></div></div>
          {log.length === 0 ? (
            <div className="empty-log"><b style={{ color: "var(--text-1)" }}>No incidents</b></div>
          ) : (
            <div className="panel" style={{ padding: 0 }}>
              <div className="otable-wrap">
                <table className="otable">
                  <thead><tr><th>When</th><th>Action</th><th>Streamer</th><th>Reason</th></tr></thead>
                  <tbody>
                    {log.map((l, i) => (
                      <tr key={i}>
                        <td style={{ color: "var(--text-3)" }}>{l.when}</td>
                        <td>{l.action}</td>
                        <td>@{l.target}</td>
                        <td style={{ color: "var(--text-2)" }}>{l.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Settings() {
  const { mode, setMode, ready } = useCrown();

  return (
    <>
      <div className="ops-head">
        <div>
          <h1>Settings</h1>
          <div className="sub">Admin panel parameters.</div>
        </div>
      </div>

      <div className="panel" style={{ maxWidth: 640 }}>
        <div className="panel-head">
          <div>
            <h2>Data source</h2>
            <div className="ph-sub">Switch the whole site between mock data and a live wallet, for testing.</div>
          </div>
        </div>
        {ready && (
          <div className="seg" role="group" aria-label="Data source">
            <button type="button" className={mode === "mock" ? "active" : ""} onClick={() => setMode("mock")}>
              Mock
            </button>
            <button type="button" className={mode === "chain" ? "active" : ""} onClick={() => setMode("chain")}>
              Chain
            </button>
          </div>
        )}
      </div>

      <div className="panel placeholder" style={{ maxWidth: 640 }}>
        <h2>Coming soon</h2>
        Operator roles, access, and thresholds are on the plan. The panel runs on demo data: real data will come from crown-app/api and the reputation ledger.
        <div style={{ marginTop: 16 }}>
          <Link className="btn-outline" href="/">To the site</Link>
        </div>
      </div>
    </>
  );
}

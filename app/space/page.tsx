"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/data/ProfileProvider";
import { Logo } from "@/components/Logo";
import { Mono } from "@/components/Mono";
import { Feed } from "@/components/Feed";
import { Chart } from "@/components/Chart";
import { BarList } from "@/components/ops";
import { PageBuilder } from "@/components/PageBuilder";
import { NavIcon, GameIcon, ChevronDown } from "@/components/icons";
import { MOCK_DASHBOARD, type DashboardPeriodKey } from "@/lib/data/mock";
import { GAMES, type GameId, type GameModule } from "@/lib/data/games";

const BY_GAME_LABEL: Record<GameId | "direct", string> = {
  direct: "Regular donation",
  task: "Task for donation",
  roulette: "Roulette",
  battles: "Battles",
};

type Section = "home" | "donations" | "games" | "widgets" | "settings";
const NAV_TOP: { key: Section; label: string }[] = [
  { key: "home", label: "Home" },
  { key: "donations", label: "Donations" },
];
const NAV_BOTTOM: { key: Section; label: string }[] = [
  { key: "widgets", label: "Widgets" },
  { key: "settings", label: "Settings" },
];

// How the game works + what fields it takes at creation (front.md I §5: a game = a campaign type
// + rules on the front end). Every game is currently in "building" status — fields are shown but not editable.
const GAME_HOW: Record<GameId, string> = {
  task: "The viewer pays for a task. The money waits for the outcome: complete it — it's yours; miss the deadline — it returns to the viewer.",
  roulette: "Once per round, the wheel picks one viewer among those who donated. Reputation gives you odds, not luck.",
  battles: "Two camps crown their favorite with donations. Whoever has more by the end of the round wins.",
};
const GAME_FIELDS: Record<GameId, { label: string; placeholder: string }[]> = {
  task: [
    { label: "Minimum task amount", placeholder: "$10" },
    { label: "Time to complete", placeholder: "24 hours" },
  ],
  roulette: [
    { label: "Minimum to enter", placeholder: "$5" },
    { label: "Draw duration", placeholder: "30 minutes" },
  ],
  battles: [
    { label: "Camp A name", placeholder: "e.g. Fire" },
    { label: "Camp B name", placeholder: "e.g. Ice" },
  ],
};
const GAME_HISTORY_EMPTY: Record<GameId, string> = {
  task: "No tasks yet.",
  roulette: "No draws yet.",
  battles: "No battles yet.",
};

type GameTab = "overview" | "settings" | "history";
const GAME_TABS: { key: GameTab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "settings", label: "Settings" },
  { key: "history", label: "History" },
];

function statusOf(game: GameModule): { label: string; live: boolean } {
  return game.status === "available" ? { label: "Available", live: true } : { label: "Soon", live: false };
}

export default function SpacePage() {
  const router = useRouter();
  const { ready, registered, profile, save, reset } = useProfile();
  const [section, setSection] = useState<Section>("home");
  const [period, setPeriod] = useState<DashboardPeriodKey>("30");

  // "Games" accordion in the sidebar: which game is expanded and which of its tabs is selected.
  const [openGame, setOpenGame] = useState<GameId | null>(null);
  const [gameId, setGameId] = useState<GameId>(GAMES[0].id);
  const [gameTab, setGameTab] = useState<GameTab>("overview");

  if (!ready) return <main className="page" />;

  if (!registered || !profile) {
    return (
      <main className="page">
        <header className="appbar">
          <Logo />
        </header>
        <div className="center-note">
          <h1>Create your page first</h1>
          <p>The dashboard appears as soon as you have your own donation page.</p>
          <Link className="btn" href="/create">
            Create your page
          </Link>
        </div>
      </main>
    );
  }

  const d = MOCK_DASHBOARD[period];
  const game = GAMES.find((g) => g.id === gameId)!;
  const st = statusOf(game);

  // Click on a game name: expands/collapses its tab list in the sidebar
  // and immediately shows its Overview in the main column.
  function toggleGame(id: GameId) {
    if (openGame === id) {
      setOpenGame(null);
      return;
    }
    setOpenGame(id);
    setSection("games");
    setGameId(id);
    setGameTab("overview");
  }

  function selectGameTab(id: GameId, tab: GameTab) {
    setSection("games");
    setGameId(id);
    setGameTab(tab);
  }

  return (
    <main className="page">
      <div className="space">
        <div className="topbar">
          <Logo />
          <div className="me">
            <span className="who">
              <Mono name={profile.name} size={28} />
              {profile.name}
            </span>
            <Link className="btn-outline" href={`/@${profile.handle}`}>
              My page
            </Link>
          </div>
        </div>

        <nav className="sidenav" aria-label="Cabinet sections">
          {NAV_TOP.map((n) => (
            <button key={n.key} type="button" className={`nav-item${section === n.key ? " active" : ""}`} onClick={() => setSection(n.key)}>
              <NavIcon name={n.key} />
              {n.label}
            </button>
          ))}

          <div className="side-divider" />
          <div className="side-label">Games</div>

          {GAMES.map((g) => {
            const gs = statusOf(g);
            const open = openGame === g.id;
            return (
              <div key={g.id}>
                <button type="button" className={`game-row${open ? " open" : ""}`} aria-expanded={open} onClick={() => toggleGame(g.id)}>
                  <GameIcon id={g.id} width={18} height={18} />
                  {g.title}
                  <span className={`gt-dot${gs.live ? " live" : ""}`} aria-hidden />
                  <ChevronDown className="chev" />
                </button>
                {open && g.id !== "task" && (
                  <div className="game-sub">
                    {GAME_TABS.map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        className={`game-sub-item${section === "games" && gameId === g.id && gameTab === t.key ? " active" : ""}`}
                        onClick={() => selectGameTab(g.id, t.key)}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className="side-divider" />

          {NAV_BOTTOM.map((n) => (
            <button key={n.key} type="button" className={`nav-item${section === n.key ? " active" : ""}`} onClick={() => setSection(n.key)}>
              <NavIcon name={n.key} />
              {n.label}
            </button>
          ))}
        </nav>

        <div className="main">
          {section === "home" && (
            <>
              <div className="main-head">
                <h1>Home</h1>
                <div className="seg" role="group" aria-label="Period">
                  <button type="button" className={period === "7" ? "active" : ""} onClick={() => setPeriod("7")}>
                    7 days
                  </button>
                  <button type="button" className={period === "30" ? "active" : ""} onClick={() => setPeriod("30")}>
                    30 days
                  </button>
                  <button type="button" className={period === "all" ? "active" : ""} onClick={() => setPeriod("all")}>
                    All time
                  </button>
                </div>
              </div>

              <div className="tiles">
                <div className="card tile">
                  <div className="v num">{d.received} $</div>
                  <div className="k">received</div>
                </div>
                <div className="card tile">
                  <div className="v num">{d.donations}</div>
                  <div className="k">donations</div>
                </div>
                <div className="card tile">
                  <div className="v num">{d.newViewers}</div>
                  <div className="k">new viewers</div>
                </div>
              </div>

              <div className="card chart-card">
                <Chart title="Donations by day" days={d.days} peakValue={d.peakValue} peakLabel={d.peakLabel} axis={d.axis} />
              </div>

              <div className="card chart-card">
                <h2>Donations by game</h2>
                <BarList
                  unit="money"
                  bars={d.byGame.map((g) => ({
                    label: BY_GAME_LABEL[g.id],
                    value: g.amount,
                    icon: g.id === "direct" ? <NavIcon name="donations" /> : <GameIcon id={g.id} width={16} height={16} />,
                  }))}
                />
              </div>

              <div className="card recent-card">
                <Feed title="Recent donations" limit={4} moreHref="/space" />
              </div>
            </>
          )}

          {section === "donations" && (
            <>
              <div className="main-head">
                <h1>Donations</h1>
              </div>
              <div className="card">
                <Feed title="All donations" />
              </div>
            </>
          )}

          {section === "games" && gameId === "task" && (
            <>
              <div className="main-head">
                <h1>{game.title}</h1>
                <span className={`pill ${st.live ? "ok" : "wait"}`}>
                  <span className="dot" />
                  {st.label}
                </span>
              </div>
              <p className="hint" style={{ marginBottom: 8 }}>
                Build the task form, then share the link or QR — viewers open it and create a task.
              </p>
              <PageBuilder profile={profile} onSave={save} />
            </>
          )}

          {section === "games" && gameId !== "task" && (
            <>
              <div className="main-head">
                <h1>{game.title}</h1>
                <span className={`pill ${st.live ? "ok" : "wait"}`}>
                  <span className="dot" />
                  {st.label}
                </span>
              </div>

              <div className="card" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div className="footnote">{game.tagline}</div>

                {gameTab === "overview" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 640 }}>
                    <p style={{ fontSize: 16, color: "var(--text-2)" }}>{GAME_HOW[game.id]}</p>
                    <label className="toggle" aria-disabled style={{ pointerEvents: "none", opacity: 0.6 }}>
                      <span className="track">
                        <span className="knob" />
                      </span>
                      Enable on my page
                    </label>
                    <div className="footnote">Will appear once the game is ready.</div>
                  </div>
                )}

                {gameTab === "settings" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 420 }}>
                    {GAME_FIELDS[game.id].map((f) => (
                      <div className="field" key={f.label}>
                        <label>{f.label}</label>
                        <input type="text" placeholder={f.placeholder} disabled />
                      </div>
                    ))}
                    <div className="footnote">Settings will open together with the game launch.</div>
                  </div>
                )}

                {gameTab === "history" && <div className="empty-log">{GAME_HISTORY_EMPTY[game.id]}</div>}
              </div>
            </>
          )}

          {section === "settings" && (
            <>
              <div className="main-head">
                <h1>Settings</h1>
              </div>
              <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="placeholder">
                  <h2>Profile</h2>
                  {profile.name} · @{profile.handle}
                  <br />
                  Donations arrive at: {profile.address}
                </div>
                <button
                  className="btn-outline"
                  type="button"
                  style={{ alignSelf: "flex-start" }}
                  onClick={() => {
                    reset();
                    router.push("/");
                  }}
                >
                  Delete page
                </button>
              </div>
            </>
          )}

          {section === "widgets" && (
            <>
              <div className="main-head">
                <h1>Widgets</h1>
              </div>
              <div className="card placeholder">
                <h2>Coming soon</h2>
                This section is on the build plan. Donations, the streamer page, and campaigns already work.
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

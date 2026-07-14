"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/data/ProfileProvider";
import { Logo } from "@/components/Logo";
import { Mono } from "@/components/Mono";
import { Feed } from "@/components/Feed";
import { DonationsPanel } from "@/components/DonationsPanel";
import { DonationsChart } from "@/components/DonationsChart";
import { HomeLive } from "@/components/HomeLive";
import { PageBuilder } from "@/components/PageBuilder";
import { WidgetsPanel } from "@/components/WidgetsPanel";
import { SettingsPanel } from "@/components/SettingsPanel";
import { TaskGameSettings } from "@/components/TaskGameSettings";
import { TaskOverview } from "@/components/TaskOverview";
import { FundraiserPanel } from "@/components/FundraiserPanel";
import { FundraiserGameSettings } from "@/components/FundraiserGameSettings";
import { FundraiserOverview } from "@/components/FundraiserOverview";
import { RoulettePanel } from "@/components/RoulettePanel";
import { RouletteGameSettings } from "@/components/RouletteGameSettings";
import { RouletteOverview } from "@/components/RouletteOverview";
import { RouletteHistory } from "@/components/RouletteHistory";
import { NavIcon, GameIcon, ChevronDown } from "@/components/icons";
import { MOCK_DASHBOARD, type DashboardPeriodKey } from "@/lib/data/mock";
import { GAMES, type GameId, type GameModule } from "@/lib/data/games";

type Section = "home" | "donations" | "games" | "widgets" | "settings";
const NAV_TOP: { key: Section; label: string }[] = [
  { key: "home", label: "Home" },
  { key: "donations", label: "Donations" },
];
const NAV_BOTTOM: { key: Section; label: string }[] = [
  { key: "widgets", label: "Widgets" },
  { key: "settings", label: "Settings" },
];

type GameTab = "page" | "overview" | "settings" | "history";
const GAME_TABS: Record<GameId, { key: GameTab; label: string }[]> = {
  task: [
    { key: "page", label: "Page" },
    { key: "overview", label: "Overview" },
    { key: "settings", label: "Settings" },
  ],
  roulette: [
    { key: "page", label: "Page" },
    { key: "overview", label: "Overview" },
    { key: "settings", label: "Settings" },
    { key: "history", label: "History" },
  ],
  fundraiser: [
    { key: "page", label: "Page" },
    { key: "overview", label: "Overview" },
    { key: "settings", label: "Settings" },
  ],
};

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
  const [gameTab, setGameTab] = useState<GameTab>(GAME_TABS[GAMES[0].id][0].key);

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
  // and immediately shows its first tab in the main column.
  function toggleGame(id: GameId) {
    if (openGame === id) {
      // Collapsing the open game: also leave the games section, otherwise its full builder stays
      // rendered in the main column with nothing active in the sidebar.
      setOpenGame(null);
      if (section === "games" && gameId === id) setSection("home");
      return;
    }
    setOpenGame(id);
    setSection("games");
    setGameId(id);
    setGameTab(GAME_TABS[id][0].key);
  }

  // Switching to a flat section (Home/Donations/Widgets/Settings) closes any expanded game row.
  function goSection(s: Section) {
    setSection(s);
    setOpenGame(null);
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
            <button key={n.key} type="button" className={`nav-item${section === n.key ? " active" : ""}`} onClick={() => goSection(n.key)}>
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
                {open && (
                  <div className="game-sub">
                    {GAME_TABS[g.id].map((t) => (
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
            <button key={n.key} type="button" className={`nav-item${section === n.key ? " active" : ""}`} onClick={() => goSection(n.key)}>
              <NavIcon name={n.key} />
              {n.label}
            </button>
          ))}
        </nav>

        <div className={`main${section === "games" && gameTab === "page" ? " main-wide" : ""}`}>
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

              <HomeLive
                profile={profile}
                onOpen={(g) => {
                  setOpenGame(g);
                  selectGameTab(g, "overview");
                }}
              />

              <div className="card chart-card">
                <DonationsChart d={d} periodLabel={period === "7" ? "7 days" : period === "30" ? "30 days" : "All time"} />
              </div>

              <div className="card recent-card">
                <Feed title="Recent donations" limit={4} onMore={() => setSection("donations")} />
              </div>
            </>
          )}

          {section === "donations" && (
            <>
              <div className="main-head">
                <h1>Donations</h1>
              </div>
              <div className="card">
                <DonationsPanel />
              </div>
            </>
          )}

          {section === "games" && gameTab === "page" && (
            <>
              <div className="main-head">
                <h1>{game.title}</h1>
                <span className={`pill ${st.live ? "ok" : "wait"}`}>
                  <span className="dot" />
                  {st.label}
                </span>
              </div>
              {game.id === "task" && (
                <>
                  <p className="hint" style={{ marginBottom: 8 }}>
                    Build the task form, then share the link or QR — viewers open it and create a task.
                  </p>
                  <PageBuilder profile={profile} onSave={save} />
                </>
              )}
              {game.id === "roulette" && (
                <>
                  <p className="hint" style={{ marginBottom: 8 }}>
                    Build the roulette page, then share the link or QR — viewers open it and suggest a game.
                  </p>
                  <RoulettePanel profile={profile} onSave={save} />
                </>
              )}
              {game.id === "fundraiser" && (
                <>
                  <p className="hint" style={{ marginBottom: 8 }}>
                    Build the fundraiser page, then share the link or QR — viewers open it and chip in.
                  </p>
                  <FundraiserPanel profile={profile} onSave={save} />
                </>
              )}
            </>
          )}

          {section === "games" && gameTab !== "page" && (
            <>
              <div className="main-head">
                <h1>{game.title}</h1>
                <span className={`pill ${st.live ? "ok" : "wait"}`}>
                  <span className="dot" />
                  {st.label}
                </span>
              </div>

              {game.id === "task" && gameTab === "overview" && <TaskOverview profile={profile} />}
              {game.id === "task" && gameTab === "settings" && <TaskGameSettings profile={profile} onSave={save} />}

              {game.id === "fundraiser" && gameTab === "overview" && <FundraiserOverview profile={profile} />}
              {game.id === "fundraiser" && gameTab === "settings" && <FundraiserGameSettings profile={profile} onSave={save} />}

              {game.id === "roulette" && gameTab === "overview" && <RouletteOverview profile={profile} />}
              {game.id === "roulette" && gameTab === "settings" && <RouletteGameSettings profile={profile} onSave={save} />}
              {game.id === "roulette" && gameTab === "history" && <RouletteHistory handle={profile.handle} />}
            </>
          )}

          {section === "settings" && (
            <>
              <div className="main-head">
                <h1>Settings</h1>
              </div>
              <SettingsPanel
                profile={profile}
                onSave={save}
                onDelete={() => {
                  reset();
                  router.push("/");
                }}
              />
            </>
          )}

          {section === "widgets" && (
            <>
              <div className="main-head">
                <h1>Widgets</h1>
              </div>
              <WidgetsPanel handle={profile.handle} />
            </>
          )}
        </div>
      </div>
    </main>
  );
}

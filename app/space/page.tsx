"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSolanaWallet } from "@/lib/chain/wallet";
import { useProfile } from "@/lib/data/ProfileProvider";
import { useCrown } from "@/lib/data/DataProvider";
import { SpaceGate } from "@/components/SpaceGate";
import { isDemoAddress, walletOwns, readDemoSession, startDemoSession, endDemoSession } from "@/lib/data/session";
import { Logo } from "@/components/Logo";
import { Mono } from "@/components/Mono";
import { NotificationBell } from "@/components/NotificationBell";
import { DonationsPanel } from "@/components/DonationsPanel";
import { DonationsChart } from "@/components/DonationsChart";
import { HomeLive } from "@/components/HomeLive";
import { TaskPanel } from "@/components/TaskPanel";
import { WidgetsPanel } from "@/components/WidgetsPanel";
import { SettingsPanel } from "@/components/SettingsPanel";
import { TelegramPanel } from "@/components/TelegramPanel";
import { TaskGameSettings } from "@/components/TaskGameSettings";
import { TaskOverview } from "@/components/TaskOverview";
import { FundraiserPanel } from "@/components/FundraiserPanel";
import { FundraiserGameSettings } from "@/components/FundraiserGameSettings";
import { FundraiserOverview } from "@/components/FundraiserOverview";
import { RoulettePanel } from "@/components/RoulettePanel";
import { RouletteGameSettings } from "@/components/RouletteGameSettings";
import { RouletteOverview } from "@/components/RouletteOverview";
import { AuctionPanel } from "@/components/AuctionPanel";
import { AuctionGameSettings } from "@/components/AuctionGameSettings";
import { AuctionOverview } from "@/components/AuctionOverview";
import { GameSessions, SessionBar } from "@/components/GameSessions";
import { getCurrentSession, activeSessions } from "@/lib/data/gameSessions";
import { NavIcon, GameIcon, ChevronDown } from "@/components/icons";
import { MOCK_DASHBOARD, type DashboardPeriodKey } from "@/lib/data/mock";
import { GAMES, type GameId, type GameModule } from "@/lib/data/games";

type Section = "home" | "donations" | "games" | "widgets" | "settings";

// The panel reads as two labelled groups — "Home" and "Games", the same shape — with Settings
// pinned to the bottom on its own (see .side-bottom).
const NAV_HOME: { key: Section; label: string }[] = [
  { key: "home", label: "Dashboard" },
  { key: "donations", label: "Donations" },
  { key: "widgets", label: "Widgets" },
];

type GameTab = "page" | "sessions" | "overview" | "settings";
const GAME_TABS: Record<GameId, { key: GameTab; label: string }[]> = {
  task: [
    { key: "page", label: "Page" },
    { key: "sessions", label: "Sessions" },
    { key: "overview", label: "Overview" },
    { key: "settings", label: "Settings" },
  ],
  roulette: [
    { key: "page", label: "Page" },
    { key: "sessions", label: "Sessions" },
    { key: "overview", label: "Overview" },
    { key: "settings", label: "Settings" },
  ],
  fundraiser: [
    { key: "page", label: "Page" },
    { key: "sessions", label: "Sessions" },
    { key: "overview", label: "Overview" },
    { key: "settings", label: "Settings" },
  ],
  auction: [
    { key: "page", label: "Page" },
    { key: "sessions", label: "Sessions" },
    { key: "overview", label: "Overview" },
    { key: "settings", label: "Settings" },
  ],
};

// Only whether a game is live — no shipping-status label anywhere: the sidebar shows it as a
// dot, and a game's own tabs say what it does rather than when it lands.
function isLive(game: GameModule): boolean {
  return game.status === "available";
}

export default function SpacePage() {
  const router = useRouter();
  const { address, connected: isConnected, disconnect } = useSolanaWallet();
  const { mode } = useCrown();
  const { ready, registered, profile, save, reset } = useProfile();
  const [section, setSection] = useState<Section>("home");
  const [period, setPeriod] = useState<DashboardPeriodKey>("30");

  // Signing in: the wallet is the login, with an explicit demo way in (see lib/data/session).
  // Read after mount — localStorage doesn't exist during SSR.
  const [demoSession, setDemoSession] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  useEffect(() => {
    setDemoSession(readDemoSession());
    setSessionReady(true);
  }, []);

  // Bumps whenever a session is created/selected/ended, so everything reading the session
  // registry (a plain localStorage store) re-renders with the fresh pick.
  const [sessionNonce, setSessionNonce] = useState(0);

  // "Games" accordion in the sidebar: which game is expanded and which of its tabs is selected.
  const [openGame, setOpenGame] = useState<GameId | null>(null);
  const [gameId, setGameId] = useState<GameId>(GAMES[0].id);
  const [gameTab, setGameTab] = useState<GameTab>(GAME_TABS[GAMES[0].id][0].key);

  if (!ready || !sessionReady) return <main className="page" />;

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

  // Signed in when the connected wallet is the one this page pays out to — or via the demo
  // session, which is the only way into a page whose payout address is the demo placeholder.
  const signedIn = walletOwns(address ?? undefined, profile.address) || demoSession;
  if (!signedIn) {
    return (
      <SpaceGate
        pageAddress={profile.address}
        connectedAddress={isConnected && address ? address : undefined}
        // A demo page can never be matched by a real wallet, and on mock data nothing is real
        // money yet — in both cases locking the owner out would be theatre, not security.
        allowDemo={isDemoAddress(profile.address) || mode === "mock"}
        onDemoEnter={() => {
          startDemoSession();
          setDemoSession(true);
        }}
      />
    );
  }

  const d = MOCK_DASHBOARD[period];
  const game = GAMES.find((g) => g.id === gameId)!;

  // The session the game tabs are looking at. Reading sessionNonce here is what ties the reads
  // below to the counter, so any create/select/end re-runs them.
  void sessionNonce;
  const currentSession = getCurrentSession(profile.handle, gameId);
  const liveSessions = activeSessions(profile.handle, gameId);
  const gameScope = currentSession?.scope ?? profile.handle;
  const shareQuery = currentSession && currentSession.scope !== profile.handle ? `?s=${currentSession.id}` : "";

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
            {/* your public page opens from your name — no separate button needed */}
            <Link className="who" href={`/@${profile.handle}`} title={`Open /@${profile.handle}`} style={{ textDecoration: "none", color: "inherit" }}>
              <Mono name={profile.name} size={28} src={profile.avatarUrl} />
              {profile.name}
            </Link>
            <NotificationBell handle={profile.handle} />
          </div>
        </div>

        <nav className="sidenav" aria-label="Cabinet sections">
          <div className="side-label">Home</div>

          {NAV_HOME.map((n) => (
            <button key={n.key} type="button" className={`nav-item${section === n.key ? " active" : ""}`} onClick={() => goSection(n.key)}>
              <NavIcon name={n.key} />
              {n.label}
            </button>
          ))}

          <div className="side-divider" />
          <div className="side-label">Games</div>

          {GAMES.map((g) => {
            const gsLive = isLive(g);
            const open = openGame === g.id;
            return (
              <div key={g.id}>
                <button type="button" className={`game-row${open ? " open" : ""}`} aria-expanded={open} onClick={() => toggleGame(g.id)}>
                  <GameIcon id={g.id} width={18} height={18} />
                  {g.title}
                  <span className={`gt-dot${gsLive ? " live" : ""}`} aria-hidden />
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

          <div className="side-bottom">
            <div className="side-divider" />
            <button
              type="button"
              className={`nav-item${section === "settings" ? " active" : ""}`}
              onClick={() => goSection("settings")}
            >
              <NavIcon name="settings" />
              Settings
            </button>
          </div>
        </nav>

        <div className={`main${(section === "games" && gameTab === "page") || section === "widgets" ? " main-wide" : ""}`}>
          {section === "home" && (
            <>
              <div className="main-head">
                <h1>Dashboard</h1>
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
                <DonationsChart d={d} periodLabel={period === "7" ? "7 days" : period === "30" ? "30 days" : "All time"} />
              </div>

              <HomeLive
                profile={profile}
                onOpen={(g) => {
                  setOpenGame(g);
                  selectGameTab(g, "overview");
                }}
              />
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

          {section === "games" && gameTab === "page" && liveSessions.length === 0 && (
            <>
              <div className="main-head">
                <h1>{game.title}</h1>
              </div>
              <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
                <h2 style={{ fontSize: 16 }}>No live session</h2>
                <p className="footnote">
                  The page needs a running session behind it — start one, and the builder and the public link light up.
                </p>
                <button className="btn" type="button" onClick={() => setGameTab("sessions")}>
                  Create a session
                </button>
              </div>
            </>
          )}

          {section === "games" && gameTab === "page" && liveSessions.length > 0 && (
            <>
              <div className="main-head">
                <h1>{game.title}</h1>
              </div>
              {game.id === "task" && (
                <>
                  <p className="hint" style={{ marginBottom: 8 }}>
                    Build the task page, then share the link or QR — viewers open it and set you a task.
                  </p>
                  <TaskPanel profile={profile} onSave={save} />
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
              {game.id === "auction" && (
                <>
                  <p className="hint" style={{ marginBottom: 8 }}>
                    Build the auction page, then share the link or QR — viewers open it and bid their lots.
                  </p>
                  <AuctionPanel profile={profile} onSave={save} />
                </>
              )}
            </>
          )}

          {section === "games" && gameTab !== "page" && (
            <>
              <div className="main-head">
                <h1>{game.title}</h1>
              </div>

              {gameTab === "sessions" && (
                <GameSessions
                  handle={profile.handle}
                  gameId={game.id}
                  gameTitle={game.title}
                  tiers={profile.tiers}
                  onOpen={() => {
                    setSessionNonce((n) => n + 1);
                    setGameTab("overview");
                  }}
                  onCreated={() => {
                    setSessionNonce((n) => n + 1);
                    setGameTab("page");
                  }}
                />
              )}

              {gameTab === "overview" && (
                <SessionBar
                  handle={profile.handle}
                  gameId={game.id}
                  currentId={currentSession?.id ?? null}
                  onSwitch={() => setSessionNonce((n) => n + 1)}
                />
              )}
              {gameTab === "overview" && liveSessions.length === 0 && !currentSession && (
                <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
                  <h2 style={{ fontSize: 16 }}>No live session</h2>
                  <p className="footnote">Start a session and this tab becomes its control room.</p>
                  <button className="btn" type="button" onClick={() => setGameTab("sessions")}>
                    Create a session
                  </button>
                </div>
              )}

              {game.id === "task" && gameTab === "overview" && (liveSessions.length > 0 || currentSession) && <TaskOverview profile={profile} scope={gameScope} />}
              {game.id === "task" && gameTab === "settings" && <TaskGameSettings profile={profile} onSave={save} />}

              {game.id === "fundraiser" && gameTab === "overview" && (liveSessions.length > 0 || currentSession) && <FundraiserOverview profile={profile} scope={gameScope} />}
              {game.id === "fundraiser" && gameTab === "settings" && <FundraiserGameSettings profile={profile} onSave={save} />}

              {game.id === "roulette" && gameTab === "overview" && (liveSessions.length > 0 || currentSession) && <RouletteOverview profile={profile} scope={gameScope} shareQuery={shareQuery} />}
              {game.id === "roulette" && gameTab === "settings" && <RouletteGameSettings profile={profile} onSave={save} />}

              {game.id === "auction" && gameTab === "overview" && (liveSessions.length > 0 || currentSession) && <AuctionOverview profile={profile} scope={gameScope} shareQuery={shareQuery} />}
              {game.id === "auction" && gameTab === "settings" && <AuctionGameSettings profile={profile} onSave={save} />}
            </>
          )}

          {section === "settings" && (
            <>
              <div className="main-head">
                <h1>Settings</h1>
              </div>
              <TelegramPanel handle={profile.handle} name={profile.name} />
              <SettingsPanel
                profile={profile}
                onSave={save}
                onDelete={() => {
                  reset();
                  router.push("/");
                }}
                onLogOut={() => {
                  // Signing out ends the session, nothing more: drop the wallet, drop the demo
                  // session. The page and its settings stay put — sign back in to pick them up.
                  disconnect();
                  endDemoSession();
                  setDemoSession(false);
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

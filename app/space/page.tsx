"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/data/ProfileProvider";
import { Logo } from "@/components/Logo";
import { Mono } from "@/components/Mono";
import { Feed } from "@/components/Feed";
import { Chart } from "@/components/Chart";
import { NavIcon } from "@/components/icons";
import { MOCK_DASHBOARD } from "@/lib/data/mock";

type Section = "home" | "donations" | "viewers" | "games" | "widgets" | "settings";
const NAV: { key: Section; label: string }[] = [
  { key: "home", label: "Главная" },
  { key: "donations", label: "Донаты" },
  { key: "viewers", label: "Зрители" },
  { key: "games", label: "Игры" },
  { key: "widgets", label: "Виджеты" },
  { key: "settings", label: "Настройки" },
];

export default function SpacePage() {
  const router = useRouter();
  const { ready, registered, profile, reset } = useProfile();
  const [section, setSection] = useState<Section>("home");
  const [period, setPeriod] = useState<"7" | "30">("30");

  if (!ready) return <main className="page" />;

  if (!registered || !profile) {
    return (
      <main className="page">
        <header className="appbar">
          <Logo />
        </header>
        <div className="center-note">
          <h1>Сначала создай страницу</h1>
          <p>Кабинет появится, как только у тебя будет своя страница для донатов.</p>
          <Link className="btn" href="/create">
            Создать страницу
          </Link>
        </div>
      </main>
    );
  }

  const d = MOCK_DASHBOARD;

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
              Моя страница
            </Link>
          </div>
        </div>

        <nav className="sidenav" aria-label="Разделы кабинета">
          {NAV.map((n) => (
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
                <h1>Главная</h1>
                <div className="seg" role="group" aria-label="Период">
                  <button type="button" className={period === "7" ? "active" : ""} onClick={() => setPeriod("7")}>
                    7 дней
                  </button>
                  <button type="button" className={period === "30" ? "active" : ""} onClick={() => setPeriod("30")}>
                    30 дней
                  </button>
                </div>
              </div>

              <div className="tiles">
                <div className="card tile">
                  <div className="v num">{d.received} $</div>
                  <div className="k">получено</div>
                </div>
                <div className="card tile">
                  <div className="v num">{d.donations}</div>
                  <div className="k">донатов</div>
                </div>
                <div className="card tile">
                  <div className="v num">{d.newViewers}</div>
                  <div className="k">новых зрителей</div>
                </div>
              </div>

              <div className="card chart-card">
                <h2>Донаты по дням</h2>
                <Chart days={d.days} peakValue={d.peakValue} peakLabel={d.peakLabel} axis={d.axis} />
              </div>

              <div className="card recent-card">
                <Feed title="Последние донаты" limit={4} moreHref="/space" />
              </div>
            </>
          )}

          {section === "donations" && (
            <>
              <div className="main-head">
                <h1>Донаты</h1>
              </div>
              <div className="card">
                <Feed title="Все донаты" />
              </div>
            </>
          )}

          {section === "settings" && (
            <>
              <div className="main-head">
                <h1>Настройки</h1>
              </div>
              <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="placeholder">
                  <h2>Профиль</h2>
                  {profile.name} · @{profile.handle}
                  <br />
                  Донаты приходят на: {profile.address}
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
                  Удалить страницу
                </button>
              </div>
            </>
          )}

          {(section === "viewers" || section === "games" || section === "widgets") && (
            <>
              <div className="main-head">
                <h1>{NAV.find((n) => n.key === section)?.label}</h1>
              </div>
              <div className="card placeholder">
                <h2>Скоро</h2>
                Этот раздел — в плане сборки. Пока работает донат, страница стримера и кампании.
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

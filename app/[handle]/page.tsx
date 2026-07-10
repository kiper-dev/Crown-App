"use client";

import Link from "next/link";
import { useCrown } from "@/lib/data/DataProvider";
import { levelInfo } from "@/lib/level";
import { AppBar } from "@/components/AppBar";
import { DonateForm } from "@/components/DonateForm";
import { Feed } from "@/components/Feed";
import { Mono } from "@/components/Mono";
import { SocialIcon, SOCIAL_LABEL } from "@/components/icons";

export default function StreamerPage({ params }: { params: { handle: string } }) {
  const { getStreamer, reputation, lastGain } = useCrown();
  const handle = decodeURIComponent(params.handle).replace(/^@/, "");
  const streamer = getStreamer(handle);

  if (!streamer) {
    return (
      <main className="page">
        <AppBar />
        <div className="center-note">
          <h1>Такого стримера нет</h1>
          <p>Проверь ссылку — возможно, в нике опечатка.</p>
          <Link className="btn" href="/">
            На главную
          </Link>
        </div>
      </main>
    );
  }

  const { level, next } = levelInfo(reputation, streamer.levels);

  return (
    <main className="page">
      <AppBar />

      <div className="hero">
        <Mono name={streamer.name} size={96} />
        <h1>{streamer.name}</h1>
        <div className="handle">@{streamer.handle}</div>
        <p className="bio">{streamer.bio}</p>
        <div className="socials">
          {streamer.socials.map((s) => (
            <a key={s.kind} href={s.url} target="_blank" rel="noreferrer" aria-label={SOCIAL_LABEL[s.kind]}>
              <SocialIcon kind={s.kind} />
            </a>
          ))}
        </div>
      </div>

      <div className="cols">
        <div className="stack">
          <DonateForm handle={streamer.handle} defaultAmount={5} streamerName={`${streamer.name} на кошелёк`} />

          <div className="card rep-card">
            <div className="rep-title">Твоя репутация у {streamer.name}</div>
            <div className="rep-num num">{reputation}</div>
            <div className="rep-level">
              {level >= 1 ? `Уровень ${level}` : "Пока без уровня"}
              {next ? ` · Уровень ${level + 1} — от ${next}` : ""}
            </div>
            <span className={`rep-gain num${lastGain ? " show" : ""}`}>{lastGain ? `+${lastGain} только что` : ""}</span>
            <div className="rep-hint">+1 к репутации за каждый доллар доната</div>
          </div>
        </div>

        <Feed title="Донаты" />
      </div>
    </main>
  );
}

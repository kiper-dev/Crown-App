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
          <h1>No such streamer</h1>
          <p>Check the link — there might be a typo in the handle.</p>
          <Link className="btn" href="/">
            Back to home
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
          <DonateForm handle={streamer.handle} defaultAmount={5} streamerName={`${streamer.name}'s wallet`} />

          <div className="card rep-card">
            <div className="rep-title">Your reputation with {streamer.name}</div>
            <div className="rep-num num">{reputation}</div>
            <div className="rep-level">
              {level >= 1 ? `Level ${level}` : "No level yet"}
              {next ? ` · Level ${level + 1} — from ${next}` : ""}
            </div>
            <span className={`rep-gain num${lastGain ? " show" : ""}`}>{lastGain ? `+${lastGain} just now` : ""}</span>
            <div className="rep-hint">+1 reputation for every dollar donated</div>
          </div>
        </div>

        <Feed title="Donations" />
      </div>
    </main>
  );
}

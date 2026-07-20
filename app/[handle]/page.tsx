"use client";

import Link from "next/link";
import { useCrown } from "@/lib/data/DataProvider";
import { tierInfo } from "@/lib/level";
import { Logo } from "@/components/Logo";
import { DonateForm } from "@/components/DonateForm";
import { Feed } from "@/components/Feed";
import { ViewerLive } from "@/components/ViewerLive";
import { Mono } from "@/components/Mono";
import { SocialIcon, SOCIAL_LABEL } from "@/components/icons";
import { normalizeSocialLink } from "@/lib/data/social-links";

export default function StreamerPage({ params }: { params: { handle: string } }) {
  const { getStreamer, getReputation, lastGainFor } = useCrown();
  const handle = decodeURIComponent(params.handle).replace(/^@/, "");
  const streamer = getStreamer(handle);

  if (!streamer) {
    return (
      <main className="page">
        <div className="center-note">
          <h1>No such content maker</h1>
          <p>Check the link — there might be a typo in the handle.</p>
          <Link className="btn" href="/">
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  const reputation = getReputation(streamer.handle);
  const lastGain = lastGainFor(streamer.handle);
  const { current, next } = tierInfo(reputation, streamer.tiers);
  // Progress toward the next tier: from the current tier's threshold (or 0) up to the next one.
  const fromT = current?.threshold ?? 0;
  const repPct = next ? Math.min(100, Math.max(0, Math.round(((reputation - fromT) / Math.max(1, next.threshold - fromT)) * 100))) : 100;

  return (
    <main className="page">
      <div className="hero">
        <Mono name={streamer.name} size={96} src={streamer.avatarUrl} />
        <h1>{streamer.name}</h1>
        <div className="handle">@{streamer.handle}</div>
        <p className="bio">{streamer.bio}</p>
        <div className="socials">
          {streamer.socials.map((s) => {
            // Output-side anti-phishing: only render a clickable link if it canonicalizes to a real
            // profile URL on the platform's domain. A bad link isn't shown as a link at all.
            const safe = normalizeSocialLink(s.kind, s.url);
            if (!safe) return null;
            return (
              <a key={s.kind} href={safe} target="_blank" rel="noreferrer nofollow" aria-label={SOCIAL_LABEL[s.kind]}>
                <SocialIcon kind={s.kind} />
              </a>
            );
          })}
        </div>
      </div>

      <div className="viewer-body">
        <div className="viewer-main">
          <ViewerLive handle={streamer.handle} name={streamer.name} />
          <DonateForm handle={streamer.handle} defaultAmount={5} streamerName={`${streamer.name}'s wallet`} presets={streamer.donatePresets} />
        </div>

        <aside className="viewer-side">
          <div className="card rep-card">
            <div className="rep-title">Your reputation with {streamer.name}</div>
            <div className="rep-num num">
              {reputation}
              <span className={`rep-gain num${lastGain ? " show" : ""}`}>{lastGain ? `+${lastGain}` : ""}</span>
            </div>
            <div className="rep-level">
              {current ? (
                <span className="tier-badge">
                  <span className="tier-dot" style={{ background: current.color }} />
                  {current.name}
                </span>
              ) : (
                "No tier yet"
              )}
            </div>
            {next ? (
              <div className="rep-progress">
                <div className="rep-track">
                  <div className="rep-fill" style={{ width: `${repPct}%` }} />
                </div>
                <div className="rep-next">
                  {next.threshold - reputation} more to <b>{next.name}</b>
                </div>
              </div>
            ) : (
              <div className="rep-hint">Top tier reached 👑</div>
            )}
            <div className="rep-hint">+1 reputation for every dollar you donate to {streamer.name}.</div>
          </div>

          <div className="card">
            <Feed title="Recent supporters" limit={8} />
          </div>
        </aside>
      </div>

      <div className="page-footer">
        <Logo />
      </div>
    </main>
  );
}

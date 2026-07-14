import { Mono } from "@/components/Mono";
import { SocialIcon } from "@/components/icons";
import { backgroundStyle } from "@/lib/data/pagebuilder";
import type { Profile } from "@/lib/data/types";
import styles from "./PagePreview.module.css";

// Static mirror of the real /@handle page, driven by the same profile/widgets/design state the
// builder edits. Not an iframe of the live route — a lightweight visual echo, so it updates instantly
// as the streamer toggles things, with no network round-trip.
export function PagePreview({ profile, device }: { profile: Profile; device: "phone" | "desktop" }) {
  const widgets = profile.widgets ?? [];
  const presets = profile.donatePresets?.length ? profile.donatePresets : [1, 5, 10];
  const activeIdx = Math.min(1, presets.length - 1);
  const isDesktop = device === "desktop";

  return (
    <div className={`${styles.frame} ${isDesktop ? styles.desktop : styles.phone}`}>
      {isDesktop && (
        <div className={styles.browserBar}>
          <span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} />
        </div>
      )}
      <div className={styles.screen} style={backgroundStyle(profile.design ?? { background: { type: "color", value: "#141318" } })}>
        <div className={styles.body}>
          {profile.avatarEnabled !== false &&
            (profile.avatarUrl ? (
              <span
                className={styles.avatarImg}
                style={{ width: isDesktop ? 72 : 64, height: isDesktop ? 72 : 64, backgroundImage: `url(${profile.avatarUrl})` }}
                aria-hidden
              />
            ) : (
              <Mono name={profile.name || "?"} size={isDesktop ? 72 : 64} />
            ))}
          <div className={styles.name}>{profile.name || "Your name"}</div>
          {profile.task && <p className={styles.task}>{profile.task}</p>}
          {profile.bioEnabled !== false && profile.bio && <p className={styles.bio}>{profile.bio}</p>}

          {widgets.filter((w) => w.enabled).map((w) =>
            w.kind === "donate" ? (
              <div key="donate" className={styles.donateWidget}>
                <div className={styles.chips}>
                  {presets.map((amount, i) => (
                    <span key={i} className={`${styles.chip} ${i === activeIdx ? styles.chipActive : ""}`}>${amount}</span>
                  ))}
                </div>
                <div className={styles.donateBtn}>Donate ${presets[activeIdx]}</div>
              </div>
            ) : (
              <div key="socials" className={styles.socials}>
                {profile.socials.map((s, i) => (
                  <span key={`${s.kind}-${i}`} className={styles.socialDot}>
                    <SocialIcon kind={s.kind} width={isDesktop ? 16 : 14} height={isDesktop ? 16 : 14} />
                  </span>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

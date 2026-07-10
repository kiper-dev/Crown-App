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

  return (
    <div className={`${styles.frame} ${device === "desktop" ? styles.desktop : styles.phone}`}>
      {device === "desktop" && (
        <div className={styles.browserBar}>
          <span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} />
        </div>
      )}
      <div className={styles.screen} style={backgroundStyle(profile.design ?? { background: { type: "color", value: "#141318" } })}>
        <div className={styles.body}>
          {profile.avatarEnabled !== false && <Mono name={profile.name || "?"} size={64} />}
          <div className={styles.name}>{profile.name || "Your name"}</div>
          {profile.bioEnabled !== false && profile.bio && <p className={styles.bio}>{profile.bio}</p>}

          {widgets.filter((w) => w.enabled).map((w) =>
            w.kind === "donate" ? (
              <div key="donate" className={styles.donateWidget}>
                <div className={styles.chips}>
                  <span className={styles.chip}>$1</span>
                  <span className={`${styles.chip} ${styles.chipActive}`}>$5</span>
                  <span className={styles.chip}>$10</span>
                </div>
                <div className={styles.donateBtn}>Donate $5</div>
              </div>
            ) : (
              <div key="socials" className={styles.socials}>
                {profile.socials.map((s) => (
                  <span key={s.kind} className={styles.socialDot}>
                    <SocialIcon kind={s.kind} width={14} height={14} />
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

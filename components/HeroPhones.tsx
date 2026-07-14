import { Mono } from "./Mono";
import styles from "./HeroPhones.module.css";

// Three fanned phone mockups for the hero — the same product from three angles:
// the viewer's donate page (left), the streamer's live earnings (center, raised),
// and all-time growth (right, dark). Static decoration, not live components.

const DAY_BARS = [38, 26, 54, 44, 30, 72, 58]; // center: donations by day, one highlighted
const GROWTH_BARS = [6, 9, 13, 11, 17, 22, 19, 27, 34, 30, 41, 48, 44, 56, 68, 62, 78, 90]; // right: all-time climb

function StatusBar({ dark = false }: { dark?: boolean }) {
  return (
    <div className={`${styles.status}${dark ? " " + styles.statusDark : ""}`}>
      <span className={styles.time}>9:41</span>
      <span className={styles.statusIcons}>
        <span className={styles.bars} />
        <span className={styles.battery} />
      </span>
    </div>
  );
}

export function HeroPhones() {
  return (
    <div className={styles.phones} aria-hidden>
      {/* LEFT — the viewer's donation page */}
      <div className={`${styles.phone} ${styles.side} ${styles.left}`}>
        <span className={styles.notch} />
        <div className={styles.screen}>
          <StatusBar />
          <div className={styles.donateScreen}>
            <Mono name="Kira" size={52} />
            <div className={styles.donName}>Kira</div>
            <div className={styles.donHandle}>@kira</div>
            <div className={styles.chips}>
              <span className={styles.chip}>1 $</span>
              <span className={`${styles.chip} ${styles.chipActive}`}>5 $</span>
              <span className={styles.chip}>10 $</span>
            </div>
            <div className={styles.donateBtn}>Donate 5 $</div>
            <div className={styles.donNote}>Straight to Kira's wallet</div>
          </div>
        </div>
      </div>

      {/* CENTER — the streamer's live earnings */}
      <div className={`${styles.phone} ${styles.center}`}>
        <span className={styles.notch} />
        <div className={styles.screen}>
          <StatusBar />
          <div className={styles.earnScreen}>
            <div className={styles.earnTop}>
              <Mono name="Kira" size={22} />
              <span className={styles.earnLabel}>Received · July</span>
            </div>
            <div className={styles.bigNum}>
              $9,128<span className={styles.cents}>.74</span>
            </div>
            <div className={styles.delta}>
              <span className={styles.deltaDot} />
              +$50 from Timur · just now
            </div>
            <div className={styles.tags}>
              <span className={styles.tag}>+$50 Timur</span>
              <span className={styles.tag}>+$10 Max</span>
            </div>
            <div className={styles.chart}>
              {DAY_BARS.map((h, i) => (
                <span key={i} className={`${styles.bar}${i === 5 ? " " + styles.barHot : ""}`} style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className={styles.tabs}>
              <span className={`${styles.tab} ${styles.tabActive}`}>1W</span>
              <span className={styles.tab}>1M</span>
              <span className={styles.tab}>1Y</span>
              <span className={styles.tab}>All</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT — all-time growth, dark */}
      <div className={`${styles.phone} ${styles.side} ${styles.right}`}>
        <span className={styles.notch} />
        <div className={`${styles.screen} ${styles.screenDark}`}>
          <StatusBar dark />
          <div className={styles.growthScreen}>
            <div className={styles.growthLabel}>All-time received</div>
            <div className={styles.growthNum}>$48,920</div>
            <div className={styles.growthSub}>+$3,120 this week</div>
            <div className={styles.growthChart}>
              {GROWTH_BARS.map((h, i) => (
                <span key={i} className={styles.gbar} style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className={styles.growthFoot}>Top donator · Timur</div>
          </div>
        </div>
      </div>
    </div>
  );
}

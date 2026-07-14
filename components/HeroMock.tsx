import { Mono } from "./Mono";
import { SocialIcon } from "./icons";
import styles from "./HeroMock.module.css";

const FEED = [
  { name: "Max", amount: 10 },
  { name: "anna_k", amount: 5 },
  { name: "Timur", amount: 50 },
];

// Decorative preview of a real streamer page — not a live component, just a static
// mock so the hero shows the actual product instead of describing it in prose.
export function HeroMock() {
  return (
    <div className={styles.frame}>
      <div className={styles.bar}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.url}>crown.tv/@kira</span>
      </div>
      <div className={styles.body}>
        <div className={styles.who}>
          <Mono name="Kira" size={40} />
          <div>
            <div className={styles.name}>Kira</div>
            <div className={styles.handle}>@kira</div>
          </div>
        </div>
        <div className={styles.socials}>
          <SocialIcon kind="twitch" />
          <SocialIcon kind="youtube" />
          <SocialIcon kind="telegram" />
        </div>
        <div className={styles.feed}>
          {FEED.map((f) => (
            <div className={styles.row} key={f.name}>
              <Mono name={f.name} size={22} />
              <span className={styles.rowName}>{f.name}</span>
              <span className={styles.rowAmt}>{f.amount} $</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

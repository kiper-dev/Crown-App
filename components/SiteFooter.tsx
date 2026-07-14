import Link from "next/link";
import { CrownMark } from "./icons";
import styles from "./SiteFooter.module.css";

// The five letters of the wordmark, each wearing its own little crown — "название crown
// из маленьких короночек". Data-driven so the crown hats line up over the exact letters.
const WORD = ["C", "R", "O", "W", "N"];

const CORE_REPO = "https://github.com/69walterwhite420-star/Crown-Core";

// The big page footer. Every link points somewhere real (post-front.md: no links to pages that
// don't exist) — internal routes that ship today, plus the open-source contract. The brand
// lockup is the one purple spot; the little crowns and letters stay neutral.
export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <CrownMark className={styles.glyph} aria-hidden />
            <div className={styles.wordmark} role="img" aria-label="Crown">
              {WORD.map((ch, i) => (
                <span key={i} className={styles.letter} aria-hidden>
                  <CrownMark className={styles.mini} />
                  <span className={styles.char}>{ch}</span>
                </span>
              ))}
            </div>
            <p className={styles.tagline}>Donations straight to your wallet. The money never touches us.</p>
          </div>

          <nav className={styles.cols} aria-label="Footer">
            <div className={styles.col}>
              <div className={styles.colHead}>Explore</div>
              <Link href="/discover">Find a streamer</Link>
              <Link href="/games">Mini-games</Link>
              <Link href="/@kira">Example page</Link>
            </div>
            <div className={styles.col}>
              <div className={styles.colHead}>For streamers</div>
              <Link href="/create">Create your page</Link>
              <Link href="/space">Dashboard</Link>
            </div>
            <div className={styles.col}>
              <div className={styles.colHead}>Open &amp; honest</div>
              <a href={CORE_REPO} target="_blank" rel="noreferrer">
                Core contract
              </a>
              <span className={styles.fact}>Non-custodial</span>
              <span className={styles.fact}>3% flat, hardcoded</span>
            </div>
          </nav>
        </div>

        <div className={styles.bar}>
          <span className={styles.copy}>© Crown — a wallet is all you need.</span>
          <div className={styles.barLinks}>
            <a href={CORE_REPO} target="_blank" rel="noreferrer">
              GitHub
            </a>
            <Link href="/">Terms</Link>
            <Link href="/">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

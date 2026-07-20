import Link from "next/link";
import styles from "./SiteFooter.module.css";

// Every repo linked here was checked to actually exist (200) under the org — the "open & honest"
// column is only honest if the links resolve. Crown-Contracts / Crown-Programs are 404, so absent.
const ORG = "https://github.com/69walterwhite420-star";
const REPOS = [
  { href: `${ORG}/Crown-Core`, label: "Core contract" }, // splitter + canister
  { href: `${ORG}/Crown-Factory`, label: "Escrow factory" }, // the games' escrow
  { href: ORG, label: "All on GitHub" },
];

// The big page footer: links that point somewhere real (post-front.md: no links to pages that
// don't exist), and nothing else. The brand is said exactly ONCE, by the giant watermark at the
// bottom — the badge, the spelled-out wordmark, the tagline and the copyright line all used to
// repeat it up here, which is four ways of saying "Crown" to someone already on the site.
export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <nav className={styles.cols} aria-label="Footer">
            <div className={styles.col}>
              <div className={styles.colHead}>Explore</div>
              <Link href="/discover">Find a content maker</Link>
              <Link href="/games">Mini-games</Link>
            </div>
            <div className={styles.col}>
              <div className={styles.colHead}>For content makers</div>
              <Link href="/create">Create your page</Link>
              <Link href="/space">Personal space</Link>
            </div>
            <div className={styles.col}>
              <div className={styles.colHead}>Open &amp; honest</div>
              {REPOS.map((r) => (
                <a key={r.href} href={r.href} target="_blank" rel="noreferrer">
                  {r.label}
                </a>
              ))}
            </div>
            <div className={styles.col}>
              <div className={styles.colHead}>Legal</div>
              <Link href="/terms">Terms</Link>
              <Link href="/privacy">Privacy</Link>
            </div>
          </nav>
        </div>
      </div>

      {/* The wordmark as a watermark: oversized, barely-there, and cropped by the page edge — it
          signs the page off without being another thing to read. Not aria-hidden: with the badge,
          wordmark and copyright line all gone, this is the only place the footer names Crown, so
          hiding it would leave a screen reader with an unnamed page. */}
      <div className={styles.watermark}>
        Crown
      </div>
    </footer>
  );
}

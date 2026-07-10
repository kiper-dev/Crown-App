import Link from "next/link";
import { TopRight } from "@/components/TopRight";
import { CrownMark } from "@/components/icons";
import { GamesList } from "@/components/GamesList";
import styles from "./page.module.css";

// /games — the platform's overall mini-games catalog. You play a specific game on the page of the
// streamer who enabled it. This is the showcase: what exists and what's coming.
export default function GamesPage() {
  return (
    <main className={styles.wrap}>
      <header className={styles.topnav}>
        <div className={styles.bar}>
          <div className={styles.left}>
            <Link className={styles.brand} href="/">
              <span className={styles.badge}>
                <CrownMark width={16} height={16} />
              </span>
              CROWN
            </Link>
            <nav className={styles.nav}>
              <Link className={`${styles.navLink} ${styles.navActive}`} href="/games">
                Mini-games
              </Link>
              <Link className={styles.navLink} href="/ops">
                Ops
              </Link>
              <Link className={styles.navLink} href="/ops">
                Admin
              </Link>
            </nav>
          </div>
          <TopRight />
        </div>
      </header>

      <div className={styles.main}>
        <div className={styles.head}>
          <h1>Mini-games</h1>
          <p>Games built on top of your donations.</p>
        </div>
        <GamesList />
      </div>
    </main>
  );
}

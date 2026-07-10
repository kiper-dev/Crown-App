import Link from "next/link";
import { TopRight } from "@/components/TopRight";
import { CrownMark } from "@/components/icons";
import { GamesList } from "@/components/GamesList";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <main className={styles.wrap}>
      <header className={`${styles.topnav} ${styles.navIn}`}>
        <div className={styles.bar}>
          <div className={styles.left}>
            <Link className={styles.brand} href="/">
              <span className={styles.badge}>
                <CrownMark width={16} height={16} />
              </span>
              CROWN
            </Link>
            <nav className={styles.nav}>
              <Link className={styles.navLink} href="/games">
                Mini-games
              </Link>
              <Link className={styles.navLink} href="/ops">
                Admin Panel
              </Link>
            </nav>
          </div>
          <TopRight />
        </div>
      </header>

      <div className="landing">
        <div className={`hero-l ${styles.heroCenter}`} id="l-hero">
          <h1 className={`${styles.reveal} ${styles.d1}`}>Donations straight to your wallet</h1>
          <p className={`lead ${styles.reveal} ${styles.d2}`}>
            Crown is a donation page in dollars. A viewer sends — the money reaches you directly.
          </p>
          <div className={`cta-row ${styles.reveal} ${styles.d3}`}>
            <Link className="btn" href="/create">
              Create your page
            </Link>
            <Link className="link-quiet" href="/@kira">
              See an example page
            </Link>
          </div>
        </div>

        <div className={`pillars ${styles.reveal} ${styles.d4}`}>
          <div className="card pillar">
            <h3>
              <span className="num">3%</span> and that's it
            </h3>
            <p>One fee. No subscriptions, no hidden cuts. 97% of every donation is yours.</p>
          </div>
          <div className="card pillar">
            <h3>Payouts don't exist</h3>
            <p>A donation goes from the viewer's wallet straight to yours. We have nothing to hold — we never touch the money.</p>
          </div>
          <div className="card pillar">
            <h3>Trust, but verify</h3>
            <p>The code is open — you can verify every donation's path yourself.</p>
            <a href="https://github.com/69walterwhite420-star/Crown-Core" target="_blank" rel="noreferrer">
              Open on GitHub →
            </a>
          </div>
        </div>

        <div className={`steps ${styles.reveal} ${styles.d5}`}>
          <div className="step">
            <div className="n num">1</div>
            <h3>Create your page</h3>
            <p>Name and wallet. Under a minute.</p>
          </div>
          <div className="step">
            <div className="n num">2</div>
            <h3>Drop the link to viewers</h3>
            <p>crown.tv/@you — in your stream description, chat, anywhere.</p>
          </div>
          <div className="step">
            <div className="n num">3</div>
            <h3>Donations arrive directly</h3>
            <p>And every donation grows the viewer's reputation with you.</p>
          </div>
        </div>

        <section className={`${styles.gamesTeaser} ${styles.reveal} ${styles.d6}`}>
          <div className={styles.gamesHead}>
            <div>
              <h2>Mini-games</h2>
              <p>Games built on top of your donations.</p>
            </div>
            <Link className={styles.seeAll} href="/games">
              See all mini-games →
            </Link>
          </div>
          <GamesList limit={3} />
        </section>

        <div className={`final ${styles.reveal} ${styles.d6}`}>
          <p>All you need is a wallet.</p>
          <Link className="btn" href="/create">
            Create your page
          </Link>
        </div>
      </div>

      <div className="footer">
        <span>Crown</span>
        <a href="https://github.com/69walterwhite420-star/Crown-Core" target="_blank" rel="noreferrer">
          GitHub
        </a>
        <Link href="/">Terms</Link>
        <Link href="/">Privacy</Link>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { GamesList } from "@/components/GamesList";
import { DonateForm } from "@/components/DonateForm";
import { HeroPhones } from "@/components/HeroPhones";
import { MoneyFlow } from "@/components/MoneyFlow";
import { SiteFooter } from "@/components/SiteFooter";
import { CrownMark } from "@/components/icons";
import styles from "./page.module.css";

export default function HomePage() {
  const rootRef = useRef<HTMLElement>(null);

  // Scroll reveal: each .reveal section plays its entrance animation every time it
  // enters view — and resets the moment it leaves, so scrolling back up and down
  // replays it. The hero's own .reveal elements are already on-screen at mount, so
  // the observer fires on them immediately — same effect as before.
  useEffect(() => {
    const els = rootRef.current?.querySelectorAll(`.${styles.reveal}`);
    if (!els || els.length === 0) return;

    if (typeof IntersectionObserver === "undefined") {
      els.forEach((el) => el.classList.add(styles.inView));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // toggle instead of unobserve: leaving view drops .inView (resetting to the
          // hidden start state), re-entering adds it back and the animation runs again.
          entry.target.classList.toggle(styles.inView, entry.isIntersecting);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <main className={styles.wrap} ref={rootRef}>
      <TopNav className={styles.navIn} />

      <section className={`${styles.band} ${styles.heroBand}`}>
        <div className={styles.bandInner}>
          <div className={styles.heroCenter}>
            <div className={`${styles.appLabel} ${styles.reveal} ${styles.d1}`}>
              <CrownMark />
              Crown App
            </div>
            <h1 className={`${styles.heroTitle} ${styles.reveal} ${styles.d1}`}>
              Donations for <span className={styles.italic}>everyone</span>
            </h1>
            <p className={`${styles.heroSub} ${styles.reveal} ${styles.d2}`}>
              Put your page to work — every dollar lands in your wallet the second it&apos;s sent.
            </p>
            <div className={`${styles.heroCta} ${styles.reveal} ${styles.d3}`}>
              <Link className="btn" href="/create">
                Create your page
              </Link>
              <Link className={styles.ctaGhost} href="/@kira">
                See an example
              </Link>
            </div>
          </div>
          <div className={`${styles.reveal} ${styles.d4}`}>
            <HeroPhones />
          </div>
        </div>
      </section>

      <section className={`${styles.band} ${styles.flowBand}`}>
        <div className={styles.bandInner}>
          <div className={styles.reveal}>
            <MoneyFlow />
          </div>
        </div>
      </section>

      <section className={`${styles.band} ${styles.bandAlt}`}>
        <div className={styles.bandInner}>
          <div className={styles.reveal}>
            <div className={styles.gamesHead}>
              <div>
                <h2>Mini-games</h2>
                <p>Games built on top of your donations.</p>
              </div>
              <Link className={styles.seeAll} href="/games">
                See all mini-games →
              </Link>
            </div>
            <GamesList limit={3} alwaysShowCaption columns={3} />
          </div>
        </div>
      </section>

      <section className={styles.band}>
        <div className={styles.bandInner}>
          <div className={`${styles.statRow} ${styles.reveal}`}>
            <div className={styles.statNum}>97%</div>
            <p className={styles.statCaption}>
              of every donation is yours. <span className={styles.strike}>Other platforms keep ~10%.</span> Crown takes <b>3% flat</b> — no
              subscriptions, no hidden cuts.
            </p>
          </div>
          <div className={`barlist ${styles.compare} ${styles.reveal}`}>
            <div className="barrow">
              <span className="bl">Crown</span>
              <div className="bartrack">
                <div className="barfill" style={{ width: "30%" }} />
              </div>
              <span className="bv num">3%</span>
            </div>
            <div className="barrow">
              <span className="bl">Typical platform</span>
              <div className="bartrack">
                <div className="barfill" style={{ width: "100%", background: "var(--bg-3)" }} />
              </div>
              <span className="bv num">~10%</span>
            </div>
          </div>

          <div className={`${styles.pillarsTwo} ${styles.reveal}`} style={{ marginTop: 56 }}>
            <div className="card pillar">
              <h3>
                Payouts <span className={styles.strike}>take days</span> don't exist
              </h3>
              <div className={styles.route}>
                <span className="pill ok">Viewer wallet</span>
                <span className={styles.routeArrow}>→</span>
                <span className="pill ok">Crown split</span>
                <span className={styles.routeArrow}>→</span>
                <span className="pill ok">Your wallet</span>
              </div>
              <p className="footnote">One on-chain transaction. No custody, no delay.</p>
            </div>
            <div className="card pillar">
              <h3>Trust, but verify</h3>
              <code className={styles.codeBlock}>
                <b>donate(streamer, gross)</b>
                <br />→ 97 / 3 split, hardcoded. No admin key.
              </code>
              <a href="https://github.com/69walterwhite420-star/Crown-Core" target="_blank" rel="noreferrer">
                Open on GitHub →
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.band} ${styles.bandAlt}`}>
        <div className={styles.bandInner}>
          <div className={`${styles.howRow} ${styles.reveal}`}>
            <div className={styles.howList}>
              <div className="step">
                <div className="n num">1</div>
                <h3>Create your page</h3>
                <p>Name + wallet.</p>
              </div>
              <div className="step">
                <div className="n num">2</div>
                <h3>Share the link</h3>
                <p>crown.tv/@you</p>
              </div>
              <div className="step">
                <div className="n num">3</div>
                <h3>Get paid directly</h3>
                <p>Straight to your wallet.</p>
              </div>
            </div>
            <div>
              <div className={styles.demoLabel}>
                <span className="live">
                  <span className="dot" aria-hidden />
                  Live demo
                </span>
              </div>
              <DonateForm handle="kira" defaultAmount={5} streamerName="Kira" />
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.band} ${styles.finalBand}`}>
        <div className={styles.bandInner}>
          <div className={`final ${styles.reveal}`}>
            <p>All you need is a wallet.</p>
            <Link className="btn" href="/create">
              Create your page
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

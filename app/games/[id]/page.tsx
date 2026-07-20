import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { GameIcon } from "@/components/icons";
import { PlayMode } from "@/components/games/PlayMode";
import { RuleLine } from "@/components/games/RuleLine";
import { getGame } from "@/lib/data/games";
import styles from "./page.module.css";

// One template for every mini-game: hero → what it is → the rules (with the streamer's knobs marked
// inline) → what you control → CTA, with the game's demo playing in a sticky panel alongside.
// Everything a game needs is data in games.ts — this file never special-cases an id.
// Only games with hasPage (games.ts) resolve here — see components/GamesList.tsx.
export default function GameDetailPage({ params }: { params: { id: string } }) {
  const game = getGame(params.id);

  if (!game || !game.hasPage) {
    return (
      <main className={styles.wrap}>
        <TopNav active="games" />
        <div className="center-note">
          <h1>No page for this game yet</h1>
          <p>This one&apos;s still being built — check back later.</p>
          <Link className="btn" href="/games">
            All mini-games
          </Link>
        </div>
      </main>
    );
  }

  const live = game.status === "available";

  return (
    <main className={styles.wrap}>
      <TopNav active="games" />

      <div className={styles.main}>
        <div className={styles.hero}>
          <span className={styles.icon} aria-hidden>
            <GameIcon id={game.id} width={30} height={30} />
          </span>
          <div className={styles.heroCopy}>
            <div className={styles.head}>
              <h1>{game.title}</h1>
            </div>
            <p className={styles.tagline}>{game.tagline}</p>
          </div>
        </div>

        <div className={styles.cols}>
          <div className={styles.left}>
            {game.pitch && game.pitch.length > 0 && (
              <section className={styles.pitch}>
                {game.pitch.map((p) => (
                  <div className={styles.pitchCard} key={p.label}>
                    <div className={styles.pitchLabel}>{p.label}</div>
                    <div className={styles.pitchValue}>{p.value}</div>
                  </div>
                ))}
              </section>
            )}

            {game.rules && game.rules.length > 0 && (
              <section className={styles.section}>
                <div className={styles.rulesHead}>
                  <h2 className={styles.h2}>The rules</h2>
                  <span className={styles.legend}>
                    <span className={styles.legendChip} aria-hidden />
                    you set this
                  </span>
                </div>
                <ol className={styles.rules}>
                  {game.rules.map((r, i) => (
                    <li className={styles.rule} key={i}>
                      <span className={styles.ruleNum}>{i + 1}</span>
                      <span className={styles.ruleText}>
                        <RuleLine text={r} />
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {game.controls && game.controls.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.h2}>What you control</h2>
                <div className={styles.controls}>
                  {game.controls.map((c) => (
                    <div className={styles.control} key={c.label}>
                      <div className={styles.controlTop}>
                        <span className={styles.controlLabel}>{c.label}</span>
                        <span className={styles.controlValue}>{c.example}</span>
                      </div>
                      <p className={styles.controlHint}>{c.hint}</p>
                    </div>
                  ))}
                </div>
                <p className={styles.note}>Example values — every one of them is yours to change.</p>
              </section>
            )}

            <div className={styles.cta}>
              <Link className="btn" href="/space">
                Set it up on my page
              </Link>
              <span className="footnote">
                {live ? "Enable it from your cabinet." : "Not live yet — you'll be able to enable it here once it ships."}
              </span>
            </div>
          </div>

          <aside className={styles.right}>
            <PlayMode id={game.id} title={game.title} />
          </aside>
        </div>
      </div>
    </main>
  );
}

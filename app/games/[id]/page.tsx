import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { GameIcon } from "@/components/icons";
import { getGame } from "@/lib/data/games";
import styles from "./page.module.css";

// Only games with hasPage (games.ts) resolve here — see components/GamesList.tsx.
export default function GameDetailPage({ params }: { params: { id: string } }) {
  const game = getGame(params.id);

  if (!game || !game.hasPage) {
    return (
      <main className={styles.wrap}>
        <TopNav active="games" />
        <div className="center-note">
          <h1>No page for this game yet</h1>
          <p>This one's still being built — check back later.</p>
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
        <Link className={styles.back} href="/games">
          ← All mini-games
        </Link>

        <div className={styles.cover} style={game.coverUrl ? { backgroundImage: `url(${game.coverUrl})` } : undefined}>
          {!game.coverUrl && <GameIcon id={game.id} width={64} height={64} />}
        </div>

        <div>
          <div className={styles.head}>
            <h1>{game.title}</h1>
            <span className={`pill ${live ? "ok" : "wait"}`}>
              <span className="dot" />
              {live ? "Available" : "Soon"}
            </span>
          </div>
          <p className={styles.tagline}>{game.tagline}</p>
        </div>

        {game.description && (
          <div className={styles.section}>
            <h2>About</h2>
            <p>{game.description}</p>
          </div>
        )}

        {game.howItWorks && game.howItWorks.length > 0 && (
          <div className={styles.section}>
            <h2>How it works</h2>
            <div className={styles.steps}>
              {game.howItWorks.map((step, i) => (
                <div className="step" key={i}>
                  <div className="n num">{i + 1}</div>
                  <p>{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.cta}>
          <Link className="btn" href="/space">
            Set it up on my page
          </Link>
          <span className="footnote">{live ? "Enable it from your cabinet." : "Not live yet — you'll be able to enable it here once it ships."}</span>
        </div>
      </div>
    </main>
  );
}

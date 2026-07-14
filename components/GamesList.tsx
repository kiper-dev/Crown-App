import Link from "next/link";
import { GameIcon } from "@/components/icons";
import { GAMES, type GameModule } from "@/lib/data/games";
import styles from "./GamesList.module.css";

function statusOf(game: GameModule): { label: string; live: boolean } {
  if (game.status === "available") return { label: "Available", live: true };
  return { label: "Soon", live: false };
}

/**
 * Mini-games catalog: poster cards in a grid. Cover is a placeholder (neutral gradient + icon,
 * an image later). Title and description reveal on hover. `limit` — show only the first N
 * (for the homepage teaser); without it — every game in the catalog.
 */
export function GamesList({
  limit,
  alwaysShowCaption,
  columns,
}: {
  limit?: number;
  alwaysShowCaption?: boolean;
  columns?: number;
}) {
  const games = limit ? GAMES.slice(0, limit) : GAMES;
  return (
    <div className={styles.grid} style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 220px))` } : undefined}>
      {games.map((game) => {
        const st = statusOf(game);
        const className = `${styles.card}${alwaysShowCaption ? ` ${styles.alwaysShow}` : ""}`;
        const inner = (
          <>
            <span className={styles.cover}>
              <GameIcon id={game.id} />
            </span>
            <div className={styles.caption}>
              <div className={styles.capHead}>
                <span className={styles.title}>{game.title}</span>
                <span className={`${styles.status} ${st.live ? styles.statusLive : ""}`}>{st.label}</span>
              </div>
              <p className={styles.tagline}>{game.tagline}</p>
            </div>
          </>
        );
        // Only games with their own page (games.ts hasPage) are clickable — the rest
        // stay inert placeholders until there's somewhere real to send a click.
        return game.hasPage ? (
          <Link key={game.id} href={`/games/${game.id}`} className={className} aria-label={game.title}>
            {inner}
          </Link>
        ) : (
          <div key={game.id} className={className} tabIndex={0} aria-label={game.title}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}

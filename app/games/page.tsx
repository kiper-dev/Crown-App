import { TopNav } from "@/components/TopNav";
import { GamesList } from "@/components/GamesList";
import styles from "./page.module.css";

// /games — the platform's overall mini-games catalog. You play a specific game on the page of the
// streamer who enabled it. This is the showcase: what exists and what's coming.
export default function GamesPage() {
  return (
    <main className={styles.wrap}>
      <TopNav active="games" />

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

import Link from "next/link";
import { CrownMark } from "@/components/icons";
import { TopRight } from "@/components/TopRight";
import { WalletButton } from "@/components/WalletButton";
import styles from "./TopNav.module.css";

const LINKS = [
  { href: "/discover", label: "Find a streamer" },
  { href: "/games", label: "Mini-games" },
  { href: "/admin", label: "Admin Panel" },
];

// The one and only top navigation on the site: wordmark + nav links + TopRight.
// Every full-nav page renders this — don't fork a second copy, or pages drift out of sync.
export function TopNav({ active, className = "" }: { active?: "games" | "discover"; className?: string }) {
  return (
    <header className={`${styles.topnav} ${className}`}>
      <div className={styles.bar}>
        <div className={styles.left}>
          <Link className={styles.brand} href="/">
            <span className={styles.badge}>
              <CrownMark width={16} height={16} />
            </span>
            CROWN
          </Link>
          <nav className={styles.nav}>
            {LINKS.map((l) => {
              const key = l.href === "/games" ? "games" : l.href === "/discover" ? "discover" : null;
              return (
                <Link key={l.label} className={`${styles.navLink} ${active && key === active ? styles.navActive : ""}`} href={l.href}>
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className={styles.right}>
          <WalletButton />
          <TopRight />
        </div>
      </div>
    </header>
  );
}

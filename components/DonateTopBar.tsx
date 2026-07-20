import Link from "next/link";
import { CrownBadge } from "@/components/CrownBadge";
import { WalletConnect } from "@/components/WalletConnect";
import styles from "./DonateTopBar.module.css";

// The donation pages have no site nav of their own — this is their header: the Crown wordmark and,
// always in reach at the top-right, the connect-wallet control. Sticky + blurred over whatever
// backdrop the content maker chose for the page.
export function DonateTopBar() {
  return (
    <header className={styles.bar}>
      <Link className={styles.brand} href="/">
        <CrownBadge size={26} />
        <span className={styles.word}>CROWN</span>
      </Link>
      <WalletConnect />
    </header>
  );
}

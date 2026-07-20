"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useSolanaWallet, type WalletName } from "@/lib/chain/wallet";
import { PhantomIcon, SolflareIcon, WalletConnectIcon } from "@/components/WalletIcons";
import styles from "./WalletModal.module.css";

// The connect-wallet dialog — a centred modal (Aave-style): a featured primary (Phantom, the most
// popular Solana wallet), then the rest of the list. Rendered through a portal onto <body>, because
// the donation header uses backdrop-filter, which would otherwise trap a position:fixed overlay.
export function WalletModal({ onClose }: { onClose: () => void }) {
  const { detected, connect } = useSolanaWallet();
  const [busy, setBusy] = useState<WalletName | null>(null);
  const [soon, setSoon] = useState(false);

  // Escape to close + lock the page scroll behind the modal.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  async function choose(name: WalletName, installUrl: string) {
    if (!detected.includes(name)) {
      window.open(installUrl, "_blank", "noreferrer");
      return;
    }
    setBusy(name);
    try {
      await connect(name);
      onClose();
    } catch {
      setBusy(null); // user dismissed the wallet popup — leave the dialog open
    }
  }

  const modal = (
    <div className={styles.overlay} onMouseDown={onClose} role="dialog" aria-modal="true" aria-label="Connect wallet">
      <div className={styles.card} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.head}>
          <Link className={styles.help} href="/wallet-guide" onClick={onClose} title="New to wallets? Here's how to set one up" aria-label="How to get a wallet">
            ?
          </Link>
          <span className={styles.title}>Connect Wallet</span>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* featured: Phantom */}
        <button
          type="button"
          className={styles.featured}
          disabled={busy === "phantom"}
          onClick={() => void choose("phantom", "https://phantom.app/download")}
        >
          <PhantomIcon size={24} />
          {busy === "phantom" ? "Opening Phantom…" : "Continue with Phantom"}
        </button>

        <div className={styles.divider}>or select a wallet from the list below</div>

        <div className={styles.list}>
          <button
            type="button"
            className={styles.row}
            disabled={busy === "solflare"}
            onClick={() => void choose("solflare", "https://solflare.com/download")}
          >
            <span className={styles.rowName}>{busy === "solflare" ? "Opening Solflare…" : "Solflare"}</span>
            <SolflareIcon size={30} />
          </button>

          <button type="button" className={styles.row} onClick={() => setSoon(true)}>
            <span className={styles.rowName}>WalletConnect</span>
            <WalletConnectIcon size={30} />
          </button>
        </div>

        {soon && <div className={styles.soon}>WalletConnect support is coming soon — use Phantom or Solflare for now.</div>}

        <div className={styles.foot}>
          By connecting your wallet you agree to the{" "}
          <Link href="/terms" onClick={onClose}>
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" onClick={onClose}>
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}

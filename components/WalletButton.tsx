"use client";

import { useState } from "react";
import { useSolanaWallet, type WalletName } from "@/lib/chain/wallet";
import styles from "./WalletButton.module.css";

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

const WALLETS: { name: WalletName; label: string; badge: string; installUrl: string }[] = [
  { name: "phantom", label: "Phantom", badge: "P", installUrl: "https://phantom.app/download" },
  { name: "solflare", label: "Solflare", badge: "S", installUrl: "https://solflare.com/download" },
];

// Site-wide "connect your wallet" entry point — independent of the mock/chain data-mode toggle
// (Settings): a viewer can connect for real any time. Talks to the same SolanaWalletProvider as
// useWallet()/DonateForm, so connecting here is immediately reflected there too. Solana-only now —
// the wagmi/EVM picker (MetaMask, WalletConnect) left with the Sepolia era.
export function WalletButton() {
  const [open, setOpen] = useState(false);
  const { address, connected, connecting, detected, connect, disconnect } = useSolanaWallet();

  async function connectTo(name: WalletName) {
    try {
      await connect(name);
      setOpen(false);
    } catch {
      // user closed the wallet popup — keep the picker open, no error theater
    }
  }

  if (connected && address) {
    return (
      <div className={styles.wrap}>
        <button type="button" className={styles.connected} onClick={() => setOpen((v) => !v)}>
          <span className={styles.dot} aria-hidden />
          {short(address)}
        </button>
        {open && (
          <div className={styles.pop} role="menu">
            <button
              type="button"
              className={styles.disconnect}
              onClick={() => {
                void disconnect();
                setOpen(false);
              }}
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <button type="button" className="btn-outline" onClick={() => setOpen((v) => !v)}>
        Connect wallet
      </button>
      {open && (
        <div className={styles.pop} role="menu" aria-label="Choose a wallet">
          {WALLETS.map((w) =>
            detected.includes(w.name) ? (
              <button key={w.name} type="button" className={styles.option} disabled={connecting} onClick={() => void connectTo(w.name)}>
                <span className={styles.badge}>{w.badge}</span>
                <span className={styles.optionText}>
                  <span className={styles.optionName}>{w.label}</span>
                  {connecting && <span className={styles.optionHint}>Connecting…</span>}
                </span>
              </button>
            ) : (
              <a key={w.name} className={styles.option} href={w.installUrl} target="_blank" rel="noreferrer">
                <span className={styles.badge}>{w.badge}</span>
                <span className={styles.optionText}>
                  <span className={styles.optionName}>{w.label}</span>
                  <span className={styles.optionHint}>Not installed — get it</span>
                </span>
              </a>
            )
          )}
        </div>
      )}
    </div>
  );
}

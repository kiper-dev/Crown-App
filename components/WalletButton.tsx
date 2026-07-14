"use client";

import { useState } from "react";
import { useAccount, useConnect, useConnectors, useDisconnect } from "wagmi";
import type { Connector } from "wagmi";
import { isWalletConnectConfigured } from "@/lib/chain/config";
import styles from "./WalletButton.module.css";

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

// Site-wide "connect your wallet" entry point — independent of the mock/chain data-mode toggle
// (Settings): a viewer can connect for real any time, whether or not the rest of the site is
// currently showing mock data. Shares wagmi's account state with useWallet()/DonateForm, so
// connecting here is immediately reflected there too.
export function WalletButton() {
  const [open, setOpen] = useState(false);
  const { address, isConnected } = useAccount();
  const connectors = useConnectors();
  const { connect, isPending, variables } = useConnect();
  const { disconnect } = useDisconnect();

  const walletConnectConnector = connectors.find((c) => c.id === "walletConnect");
  const phantomConnector = connectors.find((c) => /phantom/i.test(c.name));
  const browserConnectors = connectors.filter((c) => c.id !== "walletConnect" && c !== phantomConnector);

  function connectTo(connector: Connector) {
    connect({ connector });
    setOpen(false);
  }

  if (isConnected && address) {
    return (
      <div className={styles.wrap}>
        <button type="button" className={styles.connected} onClick={() => setOpen((v) => !v)}>
          <span className={styles.dot} aria-hidden />
          {short(address)}
        </button>
        {open && (
          <div className={styles.pop} role="menu">
            <button type="button" className={styles.disconnect} onClick={() => { disconnect(); setOpen(false); }}>
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
          {browserConnectors.map((c) => (
            <button
              key={c.uid}
              type="button"
              className={styles.option}
              disabled={isPending}
              onClick={() => connectTo(c)}
            >
              <span className={styles.badge}>{(c.name === "Injected" ? "B" : c.name.charAt(0)).toUpperCase()}</span>
              <span className={styles.optionText}>
                <span className={styles.optionName}>{c.name === "Injected" ? "Browser wallet" : c.name}</span>
                {isPending && variables?.connector === c && <span className={styles.optionHint}>Connecting…</span>}
              </span>
            </button>
          ))}

          {phantomConnector ? (
            <button type="button" className={styles.option} disabled={isPending} onClick={() => connectTo(phantomConnector)}>
              <span className={styles.badge}>P</span>
              <span className={styles.optionText}>
                <span className={styles.optionName}>Phantom</span>
                {isPending && variables?.connector === phantomConnector && <span className={styles.optionHint}>Connecting…</span>}
              </span>
            </button>
          ) : (
            <a className={styles.option} href="https://phantom.app/download" target="_blank" rel="noreferrer">
              <span className={styles.badge}>P</span>
              <span className={styles.optionText}>
                <span className={styles.optionName}>Phantom</span>
                <span className={styles.optionHint}>Not installed — get it</span>
              </span>
            </a>
          )}

          {isWalletConnectConfigured() && walletConnectConnector ? (
            <button type="button" className={styles.option} disabled={isPending} onClick={() => connectTo(walletConnectConnector)}>
              <span className={styles.badge}>W</span>
              <span className={styles.optionText}>
                <span className={styles.optionName}>WalletConnect</span>
                {isPending && variables?.connector === walletConnectConnector && <span className={styles.optionHint}>Connecting…</span>}
              </span>
            </button>
          ) : (
            <span className={`${styles.option} ${styles.optionDisabled}`}>
              <span className={styles.badge}>W</span>
              <span className={styles.optionText}>
                <span className={styles.optionName}>WalletConnect</span>
                <span className={styles.optionHint}>Not configured yet</span>
              </span>
            </span>
          )}

          <span className={`${styles.option} ${styles.optionDisabled}`}>
            <span className={styles.badge}>S</span>
            <span className={styles.optionText}>
              <span className={styles.optionName}>Solflare</span>
              <span className={styles.optionHint}>Soon — Solana isn't live yet</span>
            </span>
          </span>
        </div>
      )}
    </div>
  );
}

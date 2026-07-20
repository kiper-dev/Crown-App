"use client";

import { useRef, useState } from "react";
import { useCrown, NotConfiguredError } from "@/lib/data/DataProvider";
import { useWallet } from "@/lib/chain/useWallet";

type Status = "idle" | "sending" | "done" | "error";

const DEFAULT_PRESETS = [1, 5, 10];

function short(addr?: string) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";
}

function friendlyError(e: unknown): { text: string; soft: boolean } {
  if (e instanceof NotConfiguredError) return { text: e.message, soft: false };
  const msg = e instanceof Error ? e.message : String(e);
  if (/rejected|denied|declined|cancel/i.test(msg)) return { text: "", soft: true }; // user closed the wallet — not an error
  // Solana wallets phrase an empty USDC account several ways; SOL covers tx fees.
  if (/insufficient|custom program error: 0x1\b|InsufficientFunds/i.test(msg)) return { text: "Not enough USDC in the wallet.", soft: false };
  if (/could not find account|AccountNotFound/i.test(msg)) return { text: "No devnet USDC in this wallet yet.", soft: false };
  if (/connect.*wallet/i.test(msg)) return { text: "Connect your wallet first.", soft: false };
  return { text: "Something went wrong. Try again.", soft: false };
}

export function DonateForm({
  handle,
  defaultAmount = 5,
  streamerName = "the content maker's wallet",
  presets = DEFAULT_PRESETS,
  slug,
}: {
  handle: string;
  defaultAmount?: number;
  streamerName?: string;
  presets?: number[];
  slug?: string; // campaign page passes its slug so only that campaign's total is bumped
}) {
  const { mode, donate } = useCrown();
  const wallet = useWallet();
  const PRESETS = presets.length ? presets : DEFAULT_PRESETS;

  // Open on a real preset. If defaultAmount isn't one of this streamer's presets, fall back to a
  // middle preset instead of opening the "custom" input (which read as broken with custom presets).
  const initialAmount = PRESETS.includes(defaultAmount) ? defaultAmount : PRESETS[Math.min(1, PRESETS.length - 1)];
  const [amount, setAmount] = useState(initialAmount);
  const [activePreset, setActivePreset] = useState<number | "custom">(initialAmount);
  const [customOpen, setCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const lastPreset = useRef<number>(initialAmount);

  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  const busy = status === "sending";
  const chainNeedsConnect = mode === "chain" && !wallet.connected;

  function pickPreset(p: number) {
    setActivePreset(p);
    setAmount(p);
    lastPreset.current = p;
    setCustomOpen(false);
    setCustomValue("");
  }

  function openCustom() {
    setActivePreset("custom");
    setCustomOpen(true);
  }

  function onCustomBlur() {
    if (!customValue) {
      setActivePreset(lastPreset.current);
      setAmount(lastPreset.current);
      setCustomOpen(false);
    } else {
      // Show the rounded whole-dollar value that will actually be donated (no "10.5 shown, 11 sent").
      setCustomValue(String(amount));
    }
  }

  async function onSubmit() {
    if (busy) return;
    setError("");

    if (chainNeedsConnect) {
      if (!wallet.hasWallet) {
        setError("No Solana wallet found in the browser. Install Phantom or Solflare.");
        return;
      }
      wallet.connect();
      return;
    }

    setStatus("sending");
    try {
      await donate({ handle, amount, name, message, slug }, wallet.address);
      setStatus("done");
      setName("");
      setMessage("");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (e) {
      const { text, soft } = friendlyError(e);
      if (soft) {
        setStatus("idle");
      } else {
        setStatus("error");
        setError(text);
        setTimeout(() => setStatus("idle"), 10000);
      }
    }
  }

  let label: React.ReactNode;
  if (busy) label = "Sending…";
  else if (status === "done") label = "Done";
  else if (chainNeedsConnect) label = wallet.connecting ? "Opening wallet…" : "Connect wallet";
  else label = (<>Donate <span className="num">{amount} $</span></>);

  return (
    <div className="card form-card">
      <div className="chips" role="group" aria-label="Donation amount">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            className={`chip num${activePreset === p ? " active" : ""}`}
            disabled={busy}
            onClick={() => pickPreset(p)}
          >
            {p} $
          </button>
        ))}
        {customOpen ? (
          <span className={`chip${activePreset === "custom" ? " active" : ""}`}>
            <input
              type="number"
              min={1}
              autoFocus
              placeholder="$"
              aria-label="Custom amount"
              value={customValue}
              disabled={busy}
              onChange={(e) => {
                setCustomValue(e.target.value);
                setActivePreset("custom");
                if (e.target.value) setAmount(Math.max(1, Math.round(+e.target.value) || 1));
              }}
              onBlur={onCustomBlur}
            />
          </span>
        ) : (
          <button type="button" className="chip" disabled={busy} onClick={openCustom}>
            Custom
          </button>
        )}
      </div>

      <div className="field">
        <label htmlFor="don-name">Your name</label>
        <input id="don-name" type="text" placeholder="optional" value={name} disabled={busy} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="don-msg">Message</label>
        <textarea id="don-msg" rows={2} placeholder="optional" value={message} disabled={busy} onChange={(e) => setMessage(e.target.value)} />
      </div>

      <button type="button" className="btn" disabled={busy} onClick={onSubmit}>
        {label}
      </button>

      {error ? (
        <div className="footnote" style={{ color: "var(--error)" }}>
          {error}
        </div>
      ) : (
        <div className="footnote">
          Dollars (USDC) · arrive at {streamerName} directly
          {mode === "chain" && wallet.connected ? ` · ${short(wallet.address)}` : ""}
        </div>
      )}
    </div>
  );
}

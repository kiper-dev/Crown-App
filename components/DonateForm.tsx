"use client";

import { useRef, useState } from "react";
import { useCrown, NotConfiguredError } from "@/lib/data/DataProvider";
import { useWallet } from "@/lib/chain/useWallet";

type Status = "idle" | "sending" | "done" | "error";

const PRESETS = [1, 5, 10];

function short(addr?: string) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";
}

function friendlyError(e: unknown): { text: string; soft: boolean } {
  if (e instanceof NotConfiguredError) return { text: e.message, soft: false };
  const msg = e instanceof Error ? e.message : String(e);
  if (/rejected|denied|4001|cancel/i.test(msg)) return { text: "", soft: true }; // cancel — not an error
  if (/insufficient/i.test(msg)) return { text: "Not enough USDC in the wallet.", soft: false };
  if (/connect.*wallet/i.test(msg)) return { text: "Connect your wallet first.", soft: false };
  return { text: "Something went wrong. Try again.", soft: false };
}

export function DonateForm({
  handle,
  defaultAmount = 5,
  streamerName = "the streamer's wallet",
}: {
  handle: string;
  defaultAmount?: number;
  streamerName?: string;
}) {
  const { mode, donate } = useCrown();
  const wallet = useWallet();

  const [amount, setAmount] = useState(defaultAmount);
  const [activePreset, setActivePreset] = useState<number | "custom">(
    PRESETS.includes(defaultAmount) ? defaultAmount : "custom"
  );
  const [customOpen, setCustomOpen] = useState(!PRESETS.includes(defaultAmount));
  const [customValue, setCustomValue] = useState(PRESETS.includes(defaultAmount) ? "" : String(defaultAmount));
  const lastPreset = useRef<number>(PRESETS.includes(defaultAmount) ? defaultAmount : defaultAmount);

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
    }
  }

  async function onSubmit() {
    if (busy) return;
    setError("");

    if (chainNeedsConnect) {
      if (!wallet.hasWallet) {
        setError("No wallet found in the browser. Install MetaMask or Rabby.");
        return;
      }
      wallet.connect();
      return;
    }

    setStatus("sending");
    try {
      await donate({ handle, amount, name, message }, wallet.address);
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
        setTimeout(() => setStatus("idle"), 10);
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

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/data/ProfileProvider";
import { useWallet } from "@/lib/chain/useWallet";
import { useCrown } from "@/lib/data/DataProvider";
import { Logo } from "@/components/Logo";
import { SocialIcon, SOCIAL_LABEL } from "@/components/icons";
import { toHandle } from "@/lib/translit";
import type { Social } from "@/lib/data/types";

const STEPS = ["Profile", "Socials", "Wallet", "Levels"];
const SOCIAL_KINDS: Social["kind"][] = ["youtube", "twitch", "kick", "x", "tiktok", "instagram", "telegram", "onlyfans"];
const DEMO_ADDRESS = "0xDEmo0000000000000000000000000000000000A1" as const;

export default function CreatePage() {
  const router = useRouter();
  const { save } = useProfile();
  const { mode } = useCrown();
  const wallet = useWallet();

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [handleEdited, setHandleEdited] = useState(false);
  const [bio, setBio] = useState("");
  const [socials, setSocials] = useState<Social[]>([{ kind: "youtube", url: "" }]);
  const [walletMode, setWalletMode] = useState<"connected" | "manual">("connected");
  const [manualAddr, setManualAddr] = useState("");
  const [levels, setLevels] = useState<[string, string, string]>(["10", "100", "1000"]);

  const cleanHandle = handle.trim().replace(/^@/, "").toLowerCase();
  const canNext1 = name.trim().length > 0 && cleanHandle.length > 0;

  function resolvedAddress(): `0x${string}` | "" {
    if (walletMode === "manual") return (manualAddr.trim() as `0x${string}`) || "";
    if (mode === "chain") return (wallet.address as `0x${string}`) || "";
    return DEMO_ADDRESS;
  }

  const addr = resolvedAddress();
  const canFinish = !!addr;

  function finish() {
    const parsedLevels = levels.map((l) => Math.max(1, Math.round(+l) || 0)).filter((n) => n > 0);
    save({
      handle: cleanHandle,
      name: name.trim(),
      bio: bio.trim(),
      address: addr,
      socials: socials.filter((s) => s.url.trim()),
      levels: parsedLevels.length ? parsedLevels : [10, 100, 1000],
    });
    router.push("/space");
  }

  return (
    <main className="page">
      <header className="appbar">
        <Logo />
      </header>

      <div className="wizard">
        <div className="head">
          <h1>Create your page</h1>
          <p>Free — one page per wallet.</p>
        </div>

        <div className="stepper">
          {STEPS.map((s, i) => {
            const n = i + 1;
            const cls = n === step ? "active" : n < step ? "done" : "";
            return (
              <div key={s} style={{ display: "contents" }}>
                <span className={`st ${cls}`}>
                  <span className="dot">{n < step ? "✓" : n}</span>
                  {s}
                </span>
                {n < STEPS.length ? <span className="sep" /> : null}
              </div>
            );
          })}
        </div>

        {step === 1 && (
          <div className="step-body">
            <div className="field">
              <label htmlFor="w-name">Name</label>
              <input
                id="w-name"
                type="text"
                placeholder="What people call you on stream"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!handleEdited) setHandle(toHandle(e.target.value));
                }}
              />
            </div>
            <div className="field">
              <label htmlFor="w-handle">Page address</label>
              <input
                id="w-handle"
                type="text"
                placeholder="handle"
                value={handle}
                onChange={(e) => {
                  setHandleEdited(true);
                  setHandle(toHandle(e.target.value));
                }}
              />
            </div>
            <div className="link-preview">
              Your link: <b>crown.tv/@{cleanHandle || "handle"}</b>
            </div>
            <div className="field">
              <label htmlFor="w-bio">About</label>
              <textarea id="w-bio" rows={2} placeholder="optional" value={bio} onChange={(e) => setBio(e.target.value)} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="step-body">
            <p className="hint">Where to find you. Can be skipped.</p>
            {socials.map((s, i) => (
              <div className="social-row" key={i}>
                <span className="ic">
                  <SocialIcon kind={s.kind} />
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: 10 }}>
                  <select
                    className="chip"
                    style={{ height: 48, padding: "0 12px", borderRadius: "var(--r-2)", background: "var(--bg-0)" }}
                    value={s.kind}
                    onChange={(e) => setSocials((p) => p.map((x, j) => (j === i ? { ...x, kind: e.target.value as Social["kind"] } : x)))}
                  >
                    {SOCIAL_KINDS.map((k) => (
                      <option key={k} value={k}>
                        {SOCIAL_LABEL[k]}
                      </option>
                    ))}
                  </select>
                  <div className="field">
                    <input
                      type="text"
                      placeholder={`${s.kind}.com/…`}
                      value={s.url}
                      onChange={(e) => setSocials((p) => p.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))}
                    />
                  </div>
                </div>
                <button className="rm" type="button" aria-label="Remove" onClick={() => setSocials((p) => p.filter((_, j) => j !== i))}>
                  ✕
                </button>
              </div>
            ))}
            {socials.length < SOCIAL_KINDS.length && (
              <button className="btn-outline" type="button" style={{ alignSelf: "flex-start" }} onClick={() => setSocials((p) => [...p, { kind: "twitch", url: "" }])}>
                + Add link
              </button>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="step-body">
            <p className="hint">Where donations arrive. Money goes straight there and only there.</p>
            <div className="wallet-choice">
              <button type="button" className="wallet-opt" onClick={() => setWalletMode("connected")} style={{ borderColor: walletMode === "connected" ? "var(--accent)" : undefined }}>
                <div className="t">Use {mode === "chain" ? "connected wallet" : "demo wallet"}</div>
                <div className="s">
                  {mode === "chain"
                    ? wallet.connected
                      ? `Connected: ${wallet.address}`
                      : "Wallet not connected"
                    : `Demo address: ${DEMO_ADDRESS}`}
                </div>
              </button>
              {mode === "chain" && walletMode === "connected" && !wallet.connected && (
                <button className="btn" type="button" style={{ alignSelf: "flex-start" }} onClick={() => wallet.connect()}>
                  {wallet.connecting ? "Opening wallet…" : "Connect wallet"}
                </button>
              )}
              <button type="button" className="wallet-opt" onClick={() => setWalletMode("manual")} style={{ borderColor: walletMode === "manual" ? "var(--accent)" : undefined }}>
                <div className="t">Enter a different address</div>
                <div className="s">Double-check it — donations can't be redirected after the fact.</div>
              </button>
              {walletMode === "manual" && (
                <div className="field">
                  <input type="text" placeholder="0x…" value={manualAddr} onChange={(e) => setManualAddr(e.target.value)} />
                </div>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="step-body">
            <p className="hint">Levels for your viewers — a threshold in dollars. You can leave the defaults.</p>
            {levels.map((l, i) => (
              <div className="field" key={i}>
                <label>Level {i + 1} — from, $</label>
                <input type="number" min={1} value={l} onChange={(e) => setLevels((p) => p.map((x, j) => (j === i ? e.target.value : x)) as [string, string, string])} />
              </div>
            ))}
          </div>
        )}

        <div className="wizard-nav">
          <button className="back" type="button" onClick={() => (step === 1 ? router.push("/") : setStep(step - 1))}>
            ← Back
          </button>
          <div style={{ display: "flex", alignItems: "center" }}>
            {(step === 2 || step === 4) && (
              <button className="skip" type="button" onClick={() => (step === 4 ? finish() : setStep(step + 1))}>
                Skip
              </button>
            )}
            {step < 4 ? (
              <button className="btn" type="button" disabled={step === 1 && !canNext1} onClick={() => setStep(step + 1)}>
                Next
              </button>
            ) : (
              <button className="btn" type="button" disabled={!canFinish} onClick={finish}>
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

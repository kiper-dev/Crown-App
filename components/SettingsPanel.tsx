"use client";

import { useRef } from "react";
import { UploadIcon, SocialIcon, SOCIAL_LABEL, SOCIAL_KINDS, SOCIAL_BRAND } from "@/components/icons";
import { SOCIAL_EXAMPLE, isSocialValid } from "@/lib/data/social-links";
import { TierEditor } from "@/components/TierEditor";
import pageBuilderStyles from "@/components/PageBuilder.module.css";
import type { Profile, Social } from "@/lib/data/types";

// Profile identity: name, logo, socials, wallet, reputation tiers. Edits save live, the
// same pattern as PageBuilder's patch() — no separate "Save" step, one less thing to forget.
export function SettingsPanel({ profile, onSave, onDelete }: { profile: Profile; onSave: (p: Profile) => void; onDelete: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);

  function patch(next: Partial<Profile>) {
    onSave({ ...profile, ...next });
  }

  function onAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => patch({ avatarUrl: String(reader.result), avatarEnabled: true });
    reader.readAsDataURL(file);
  }

  function addSocial() {
    patch({ socials: [...profile.socials, { kind: "twitch", url: "" }] });
  }
  function updateSocial(i: number, next: Partial<Social>) {
    patch({ socials: profile.socials.map((s, j) => (j === i ? { ...s, ...next } : s)) });
  }
  function removeSocial(i: number) {
    patch({ socials: profile.socials.filter((_, j) => j !== i) });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600 }}>Profile</h2>

        <div className={pageBuilderStyles.avatarRow}>
          <div className={pageBuilderStyles.avatarPreview} style={profile.avatarUrl ? { backgroundImage: `url(${profile.avatarUrl})` } : undefined}>
            {!profile.avatarUrl && (profile.name.trim().charAt(0) || "?")}
          </div>
          <div className={pageBuilderStyles.avatarControls}>
            <button type="button" className="btn-outline" onClick={() => fileRef.current?.click()}>
              <UploadIcon /> Choose logo
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onAvatarFile} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="set-name">Name</label>
          <input id="set-name" type="text" value={profile.name} onChange={(e) => patch({ name: e.target.value })} />
        </div>

        <div className="footnote">
          Your page: <b>crown.tv/@{profile.handle}</b> — the address itself can't be changed once your page exists.
        </div>
      </div>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600 }}>Socials</h2>
        {profile.socials.map((s, i) => (
          <div className="social-row" key={i}>
            <span className="ic" style={{ background: SOCIAL_BRAND[s.kind].bg, color: SOCIAL_BRAND[s.kind].fg }}>
              <SocialIcon kind={s.kind} />
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: 10 }}>
              <select
                className="chip"
                style={{ height: 48, padding: "0 12px", borderRadius: "var(--r-2)", background: "var(--bg-0)" }}
                value={s.kind}
                onChange={(e) => updateSocial(i, { kind: e.target.value as Social["kind"] })}
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
                  placeholder={SOCIAL_EXAMPLE[s.kind]}
                  value={s.url}
                  aria-invalid={!!s.url.trim() && !isSocialValid(s.kind, s.url)}
                  style={s.url.trim() && !isSocialValid(s.kind, s.url) ? { borderColor: "var(--error)" } : undefined}
                  onChange={(e) => updateSocial(i, { url: e.target.value })}
                />
                {s.url.trim() && !isSocialValid(s.kind, s.url) && (
                  <div className="footnote" style={{ color: "var(--error)" }}>
                    Enter your {SOCIAL_LABEL[s.kind]} link, e.g. {SOCIAL_EXAMPLE[s.kind]}
                  </div>
                )}
              </div>
            </div>
            <button className="rm" type="button" aria-label="Remove" onClick={() => removeSocial(i)}>
              ✕
            </button>
          </div>
        ))}
        {profile.socials.length < SOCIAL_KINDS.length && (
          <button className="btn-outline" type="button" style={{ alignSelf: "flex-start" }} onClick={addSocial}>
            + Add link
          </button>
        )}
      </div>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600 }}>Wallet</h2>
        <p className="hint">Where donations arrive. Double-check it — donations can't be redirected after the fact.</p>
        <div className="field">
          <label htmlFor="set-wallet">Address</label>
          <input id="set-wallet" type="text" placeholder="0x…" value={profile.address} onChange={(e) => patch({ address: e.target.value as `0x${string}` })} />
        </div>
      </div>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600 }}>Tiers</h2>
        <p className="hint">
          <b>1 reputation point = $1 donated.</b> Rename, recolor, or add a tier — takes effect on your page right away.
        </p>
        <TierEditor initialTiers={profile.tiers ?? []} onChange={(tiers) => patch({ tiers })} />
      </div>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600 }}>Danger zone</h2>
        <button className="btn-outline" type="button" style={{ alignSelf: "flex-start" }} onClick={onDelete}>
          Delete page
        </button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { QrIcon, CopyIcon, PhoneIcon, DesktopIcon, DragHandleIcon, UploadIcon, ChevronDown, SocialIcon, SOCIAL_LABEL, SOCIAL_KINDS, SOCIAL_BRAND } from "@/components/icons";
import { LivePreview } from "@/components/LivePreview";
import {
  BACKGROUND_COLOR_PRESETS,
  BACKGROUND_GRADIENT_PRESETS,
  THEMES,
  backgroundStyle,
  sameBackground,
} from "@/lib/data/pagebuilder";
import { AU_HEADLINE_MAX, AU_DESCRIPTION_MAX, MAX_AU_PRESETS, withAuctionDefaults } from "@/lib/data/auction";
import type { PageWidget, Profile, AuctionDraft, Social } from "@/lib/data/types";
import styles from "./PageBuilder.module.css";

type Tab = "page" | "design";
type Device = "phone" | "desktop";

// Widget names as they read on THIS page — same widget shapes as the main page, different verb.
const AU_WIDGET_LABEL: Record<PageWidget["kind"], string> = {
  donate: "Bid form",
  socials: "Social icons",
};

// The Auction page builder — deliberately the same experience as the other game
// builders: editor on the left with Page/Design tabs, live device preview on the right,
// link + QR under it. Shares PageBuilder.module.css so the builders can't drift apart.
export function AuctionPanel({ profile, onSave }: { profile: Profile; onSave: (p: Profile) => void }) {
  const au = withAuctionDefaults(profile);
  const [tab, setTab] = useState<Tab>("page");
  const [device, setDevice] = useState<Device>("phone");
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [openWidget, setOpenWidget] = useState<PageWidget["kind"] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bgFileRef = useRef<HTMLInputElement>(null);

  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const link = `${origin || "https://crown.tv"}/@${profile.handle}/auction`;

  useEffect(() => {
    if (!qrOpen) return;
    QRCode.toDataURL(link, { margin: 1, width: 240, color: { dark: "#F1EFF7", light: "#00000000" } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [qrOpen, link]);

  // Avatar and socials are the streamer's shared identity (same fields the main page uses);
  // everything else lives on the auction draft.
  function patchProfile(next: Partial<Profile>) {
    onSave({ ...profile, ...next });
  }

  function patchAu(next: Partial<AuctionDraft>) {
    onSave({ ...profile, auction: { ...au, ...next } });
  }

  function patchWidget(kind: PageWidget["kind"], next: Partial<PageWidget>) {
    patchAu({ widgets: au.widgets.map((w) => (w.kind === kind ? { ...w, ...next } : w)) });
  }

  function moveWidget(index: number, dir: -1 | 1) {
    const to = index + dir;
    if (to < 0 || to >= au.widgets.length) return;
    const next = au.widgets.slice();
    [next[index], next[to]] = [next[to], next[index]];
    patchAu({ widgets: next });
  }

  function toggleWidgetConfig(kind: PageWidget["kind"]) {
    setOpenWidget((k) => (k === kind ? null : kind));
  }

  function updatePreset(i: number, value: number) {
    const next = au.presets.slice();
    next[i] = Math.max(1, Math.round(value) || 1);
    patchAu({ presets: next });
  }

  function addPreset() {
    const last = au.presets[au.presets.length - 1] ?? 5;
    patchAu({ presets: [...au.presets, last + 5] });
  }

  function removePreset(i: number) {
    if (au.presets.length <= 1) return;
    patchAu({ presets: au.presets.filter((_, j) => j !== i) });
  }

  function addSocial() {
    patchProfile({ socials: [...profile.socials, { kind: "twitch", url: "" }] });
  }

  function updateSocial(i: number, next: Partial<Social>) {
    patchProfile({ socials: profile.socials.map((s, j) => (j === i ? { ...s, ...next } : s)) });
  }

  function removeSocial(i: number) {
    patchProfile({ socials: profile.socials.filter((_, j) => j !== i) });
  }

  function onAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => patchProfile({ avatarUrl: String(reader.result) });
    reader.readAsDataURL(file);
  }

  function onBackgroundFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => patchAu({ design: { background: { type: "image", value: String(reader.result) } } });
    reader.readAsDataURL(file);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.builder}>
        <div className={styles.editor}>
          <div className={styles.tabs} role="tablist" aria-label="Auction builder">
            <button type="button" role="tab" aria-selected={tab === "page"} className={tab === "page" ? styles.tabOn : ""} onClick={() => setTab("page")}>
              Auction
            </button>
            <button type="button" role="tab" aria-selected={tab === "design"} className={tab === "design" ? styles.tabOn : ""} onClick={() => setTab("design")}>
              Design
            </button>
          </div>

          {tab === "page" && (
            <div className={styles.tabBody}>
              <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className={styles.rowHead}>Profile</div>
                <div className={styles.avatarRow}>
                  <div className={styles.avatarPreview} style={profile.avatarUrl ? { backgroundImage: `url(${profile.avatarUrl})` } : undefined}>
                    {!profile.avatarUrl && (profile.name.trim().charAt(0) || "?")}
                  </div>
                  <div className={styles.avatarControls}>
                    <label className={`toggle${profile.avatarEnabled !== false ? " on" : ""}`}>
                      <span className="track"><span className="knob" /></span>
                      <input type="checkbox" hidden checked={profile.avatarEnabled !== false} onChange={(e) => patchProfile({ avatarEnabled: e.target.checked })} />
                      Avatar
                    </label>
                    <button type="button" className="btn-outline" onClick={() => fileRef.current?.click()}>
                      <UploadIcon /> Choose
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" hidden onChange={onAvatarFile} />
                  </div>
                </div>

                <div className={styles.bioField}>
                  <div className={styles.rowHead}>Headline</div>
                  <div className={styles.bioBox}>
                    <textarea
                      className={styles.bioInput}
                      rows={2}
                      maxLength={AU_HEADLINE_MAX}
                      placeholder="e.g. Name your price — the richest lot owns my next stream"
                      value={au.headline}
                      onChange={(e) => patchAu({ headline: e.target.value })}
                    />
                    <span className={styles.charCount}>{au.headline.length}/{AU_HEADLINE_MAX}</span>
                  </div>
                  <div className="footnote">Lots you don't accept never enter the bidding — their money goes straight back.</div>
                </div>

                <div className={styles.bioField}>
                  <label className={`toggle${au.descriptionEnabled ? " on" : ""}`}>
                    <span className="track"><span className="knob" /></span>
                    <input type="checkbox" hidden checked={au.descriptionEnabled} onChange={(e) => patchAu({ descriptionEnabled: e.target.checked })} />
                    Description
                  </label>
                  <div className={styles.bioBox}>
                    <textarea
                      className={styles.bioInput}
                      rows={2}
                      maxLength={AU_DESCRIPTION_MAX}
                      placeholder="House rules: what you will and won't do, when the bell rings"
                      value={au.description}
                      onChange={(e) => patchAu({ description: e.target.value })}
                    />
                    <span className={styles.charCount}>{au.description.length}/{AU_DESCRIPTION_MAX}</span>
                  </div>
                </div>
              </div>

              <div className={styles.rowHead}>Widgets</div>

              <div className={styles.widgetList}>
                {au.widgets.map((w, i) => {
                  const open = openWidget === w.kind;
                  return (
                    <div key={w.kind} className={styles.widgetGroup}>
                      <div className={`${styles.widgetRow}${w.enabled ? "" : ` ${styles.widgetOff}`}`}>
                        <DragHandleIcon className={styles.dragHandle} />
                        <div className={styles.widgetStepper}>
                          <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => moveWidget(i, -1)}>▲</button>
                          <button type="button" aria-label="Move down" disabled={i === au.widgets.length - 1} onClick={() => moveWidget(i, 1)}>▼</button>
                        </div>
                        <button type="button" className={styles.widgetNameBtn} aria-expanded={open} onClick={() => toggleWidgetConfig(w.kind)}>
                          {AU_WIDGET_LABEL[w.kind]}
                          <ChevronDown className={`${styles.widgetChev}${open ? ` ${styles.widgetChevOn}` : ""}`} />
                        </button>
                        <label className={`toggle${w.enabled ? " on" : ""}`}>
                          <span className="track"><span className="knob" /></span>
                          <input type="checkbox" hidden checked={w.enabled} onChange={(e) => patchWidget(w.kind, { enabled: e.target.checked })} />
                        </label>
                      </div>

                      {open && w.kind === "donate" && (
                        <div className={styles.widgetConfig}>
                          <div className={styles.presetRow}>
                            {au.presets.map((amount, pi) => (
                              <div className={styles.presetChip} key={pi}>
                                <span className={styles.presetDollar}>$</span>
                                <input
                                  type="number"
                                  min={1}
                                  aria-label={`Amount ${pi + 1}`}
                                  value={amount}
                                  onChange={(e) => updatePreset(pi, +e.target.value)}
                                />
                                {au.presets.length > 1 && (
                                  <button
                                    type="button"
                                    className={styles.presetRemove}
                                    aria-label={`Remove amount ${pi + 1}`}
                                    onClick={() => removePreset(pi)}
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            ))}
                            {au.presets.length < MAX_AU_PRESETS && (
                              <button type="button" className={styles.presetAdd} aria-label="Add amount" onClick={addPreset}>
                                +
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {open && w.kind === "socials" && (
                        <div className={styles.widgetConfig}>
                          {profile.socials.map((s, si) => (
                            <div className="social-row" key={si}>
                              <span className="ic" style={{ background: SOCIAL_BRAND[s.kind].bg, color: SOCIAL_BRAND[s.kind].fg }}>
                                <SocialIcon kind={s.kind} />
                              </span>
                              <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: 10 }}>
                                <select
                                  className="chip"
                                  style={{ height: 48, padding: "0 12px", borderRadius: "var(--r-2)", background: "var(--bg-0)" }}
                                  value={s.kind}
                                  onChange={(e) => updateSocial(si, { kind: e.target.value as Social["kind"] })}
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
                                    onChange={(e) => updateSocial(si, { url: e.target.value })}
                                  />
                                </div>
                              </div>
                              <button className="rm" type="button" aria-label="Remove" onClick={() => removeSocial(si)}>
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
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "design" && (
            <div className={styles.tabBody}>
              <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className={styles.rowHead}>Themes</div>
                <div className={styles.themeGrid}>
                  {THEMES.map((t) => {
                    const active = sameBackground(au.design, t.design);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        aria-pressed={active}
                        className={`${styles.themeCard} ${active ? styles.themeCardOn : ""}`}
                        onClick={() => patchAu({ design: t.design })}
                      >
                        <span className={styles.themeThumb} style={backgroundStyle(t.design)}>
                          <span className={styles.tAvatar} />
                          <span className={styles.tLine} />
                          <span className={styles.tBtn} />
                        </span>
                        <span className={styles.themeLabel}>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className={styles.rowHead}>Page background</div>
                <div className={styles.bgTypeRow}>
                  {(["color", "gradient", "image"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`${styles.bgType} ${au.design.background.type === t ? styles.bgTypeOn : ""}`}
                      onClick={() => {
                        if (t === "image") { bgFileRef.current?.click(); return; }
                        patchAu({ design: { background: { type: t, value: t === "color" ? BACKGROUND_COLOR_PRESETS[0] : BACKGROUND_GRADIENT_PRESETS[0].id } } });
                      }}
                    >
                      {t === "color" ? "Color" : t === "gradient" ? "Gradient" : "Image"}
                    </button>
                  ))}
                  <input ref={bgFileRef} type="file" accept="image/*" hidden onChange={onBackgroundFile} />
                </div>

                {au.design.background.type === "color" && (
                  <div className={styles.swatches}>
                    {BACKGROUND_COLOR_PRESETS.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        aria-label={hex}
                        className={`${styles.swatch} ${au.design.background.value === hex ? styles.swatchOn : ""}`}
                        style={{ background: hex }}
                        onClick={() => patchAu({ design: { background: { type: "color", value: hex } } })}
                      />
                    ))}
                    <input
                      className={styles.hexInput}
                      type="text"
                      value={au.design.background.value}
                      onChange={(e) => patchAu({ design: { background: { type: "color", value: e.target.value } } })}
                    />
                  </div>
                )}

                {au.design.background.type === "gradient" && (
                  <div className={styles.swatches}>
                    {BACKGROUND_GRADIENT_PRESETS.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        aria-label={g.label}
                        className={`${styles.swatch} ${au.design.background.value === g.id ? styles.swatchOn : ""}`}
                        style={{ backgroundImage: g.css }}
                        onClick={() => patchAu({ design: { background: { type: "gradient", value: g.id } } })}
                      />
                    ))}
                  </div>
                )}

                {au.design.background.type === "image" && (
                  <div className="footnote">
                    {au.design.background.value ? "Image set — pick Choose file to replace it." : "No image chosen yet."}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className={styles.previewCol}>
          <div className={styles.deviceSeg} role="group" aria-label="Preview device">
            <button type="button" className={device === "phone" ? styles.deviceOn : ""} onClick={() => setDevice("phone")}>
              <PhoneIcon /> Phone
            </button>
            <button type="button" className={device === "desktop" ? styles.deviceOn : ""} onClick={() => setDevice("desktop")}>
              <DesktopIcon /> Desktop
            </button>
          </div>
          <LivePreview src={`/@${profile.handle}/auction`} device={device} />

          <div className={styles.linkRow}>
            <div className={styles.linkLabel}>Auction link</div>
            <a className={styles.linkChip} href={`/@${profile.handle}/auction`} target="_blank" rel="noreferrer">
              <span className="num">{link}</span>
            </a>
            <button type="button" className="btn-outline" onClick={copyLink} aria-label="Copy link">
              <CopyIcon /> {copied ? "Copied!" : "Copy"}
            </button>
            <button type="button" className="btn-outline" onClick={() => setQrOpen((v) => !v)}>
              <QrIcon /> QR code
            </button>
            {qrOpen && (
              <div className={styles.qrPop} role="dialog" aria-label="QR code">
                {qrDataUrl ? (
                  <>
                    <img src={qrDataUrl} alt={`QR code for ${link}`} width={200} height={200} />
                    <a className={styles.qrDownload} href={qrDataUrl} download="crown-auction-qr.png">
                      Download PNG
                    </a>
                  </>
                ) : (
                  <div className={styles.qrLoading}>Generating…</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

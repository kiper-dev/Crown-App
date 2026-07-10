"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { CopyIcon, QrIcon, DragHandleIcon, UploadIcon } from "@/components/icons";
import { PagePreview } from "@/components/PagePreview";
import {
  BIO_MAX,
  WIDGET_LABEL,
  BACKGROUND_COLOR_PRESETS,
  BACKGROUND_GRADIENT_PRESETS,
  THEMES,
  backgroundStyle,
  sameBackground,
  withPageDefaults,
} from "@/lib/data/pagebuilder";
import type { PageWidget, Profile } from "@/lib/data/types";
import styles from "./PageBuilder.module.css";

type Tab = "page" | "design";
type Device = "phone" | "desktop";

export function PageBuilder({ profile, onSave }: { profile: Profile; onSave: (p: Profile) => void }) {
  const p = withPageDefaults(profile);
  const [tab, setTab] = useState<Tab>("page");
  const [device, setDevice] = useState<Device>("phone");
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const bgFileRef = useRef<HTMLInputElement>(null);

  const link = `crown.tv/@${p.handle}`;

  useEffect(() => {
    if (!qrOpen) return;
    QRCode.toDataURL(`https://${link}`, { margin: 1, width: 240, color: { dark: "#F1EFF7", light: "#00000000" } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [qrOpen, link]);

  function patch(next: Partial<Profile>) {
    onSave({ ...p, ...next });
  }

  function patchWidget(kind: PageWidget["kind"], next: Partial<PageWidget>) {
    patch({ widgets: p.widgets.map((w) => (w.kind === kind ? { ...w, ...next } : w)) });
  }

  function moveWidget(index: number, dir: -1 | 1) {
    const to = index + dir;
    if (to < 0 || to >= p.widgets.length) return;
    const next = p.widgets.slice();
    [next[index], next[to]] = [next[to], next[index]];
    patch({ widgets: next });
  }

  function onAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => patch({ avatarUrl: String(reader.result) });
    reader.readAsDataURL(file);
  }

  function onBackgroundFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => patch({ design: { background: { type: "image", value: String(reader.result) } } });
    reader.readAsDataURL(file);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`https://${link}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.linkRow}>
        <div className={styles.linkLabel}>Your link</div>
        <div className={styles.linkChip}>
          <span className="num">{link}</span>
        </div>
        <button type="button" className="btn-outline" onClick={copyLink}>
          <CopyIcon /> {copied ? "Copied" : "Copy"}
        </button>
        <button type="button" className="btn-outline" onClick={() => setQrOpen((v) => !v)}>
          <QrIcon /> QR code
        </button>
        {qrOpen && (
          <div className={styles.qrPop} role="dialog" aria-label="QR code">
            {qrDataUrl ? (
              <>
                <img src={qrDataUrl} alt={`QR code for ${link}`} width={200} height={200} />
                <a className={styles.qrDownload} href={qrDataUrl} download="crown-qr.png">
                  Download PNG
                </a>
              </>
            ) : (
              <div className={styles.qrLoading}>Generating…</div>
            )}
          </div>
        )}
      </div>

      <div className={styles.builder}>
        <div className={styles.editor}>
          <div className={styles.tabs} role="tablist" aria-label="Page builder">
            <button type="button" role="tab" aria-selected={tab === "page"} className={tab === "page" ? styles.tabOn : ""} onClick={() => setTab("page")}>
              My page
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
                  <div className={styles.avatarPreview} style={p.avatarUrl ? { backgroundImage: `url(${p.avatarUrl})` } : undefined}>
                    {!p.avatarUrl && (p.name.trim().charAt(0) || "?")}
                  </div>
                  <div className={styles.avatarControls}>
                    <label className={`toggle${p.avatarEnabled ? " on" : ""}`}>
                      <span className="track"><span className="knob" /></span>
                      <input type="checkbox" hidden checked={p.avatarEnabled} onChange={(e) => patch({ avatarEnabled: e.target.checked })} />
                      Avatar
                    </label>
                    <button type="button" className="btn-outline" onClick={() => fileRef.current?.click()}>
                      <UploadIcon /> Choose
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" hidden onChange={onAvatarFile} />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label className={`toggle${p.bioEnabled ? " on" : ""}`}>
                    <span className="track"><span className="knob" /></span>
                    <input type="checkbox" hidden checked={p.bioEnabled} onChange={(e) => patch({ bioEnabled: e.target.checked })} />
                    Description
                  </label>
                  <textarea
                    rows={2}
                    maxLength={BIO_MAX}
                    placeholder="Give for…"
                    value={p.bio}
                    onChange={(e) => patch({ bio: e.target.value })}
                  />
                  <div className={styles.charCount}>{p.bio.length}/{BIO_MAX} characters</div>
                </div>
              </div>

              <button type="button" className={`btn ${styles.addWidgetBtn}`} disabled title="More widgets are on the way">
                + Add widget
              </button>
              <div className="footnote">More widgets are on the way — donate form and social icons ship today.</div>

              <div className={styles.widgetList}>
                {p.widgets.map((w, i) => (
                  <div key={w.kind} className={styles.widgetRow}>
                    <DragHandleIcon className={styles.dragHandle} />
                    <div className={styles.widgetStepper}>
                      <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => moveWidget(i, -1)}>▲</button>
                      <button type="button" aria-label="Move down" disabled={i === p.widgets.length - 1} onClick={() => moveWidget(i, 1)}>▼</button>
                    </div>
                    <span className={styles.widgetName}>{WIDGET_LABEL[w.kind]}</span>
                    <label className={`toggle${w.enabled ? " on" : ""}`}>
                      <span className="track"><span className="knob" /></span>
                      <input type="checkbox" hidden checked={w.enabled} onChange={(e) => patchWidget(w.kind, { enabled: e.target.checked })} />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "design" && (
            <div className={styles.tabBody}>
              <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className={styles.rowHead}>Themes</div>
                <div className={styles.themeGrid}>
                  {THEMES.map((t) => {
                    const active = sameBackground(p.design, t.design);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        aria-pressed={active}
                        className={`${styles.themeCard} ${active ? styles.themeCardOn : ""}`}
                        onClick={() => patch({ design: t.design })}
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
                      className={`${styles.bgType} ${p.design.background.type === t ? styles.bgTypeOn : ""}`}
                      onClick={() => {
                        if (t === "image") { bgFileRef.current?.click(); return; }
                        patch({ design: { background: { type: t, value: t === "color" ? BACKGROUND_COLOR_PRESETS[0] : BACKGROUND_GRADIENT_PRESETS[0].id } } });
                      }}
                    >
                      {t === "color" ? "Color" : t === "gradient" ? "Gradient" : "Image"}
                    </button>
                  ))}
                  <input ref={bgFileRef} type="file" accept="image/*" hidden onChange={onBackgroundFile} />
                </div>

                {p.design.background.type === "color" && (
                  <div className={styles.swatches}>
                    {BACKGROUND_COLOR_PRESETS.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        aria-label={hex}
                        className={`${styles.swatch} ${p.design.background.value === hex ? styles.swatchOn : ""}`}
                        style={{ background: hex }}
                        onClick={() => patch({ design: { background: { type: "color", value: hex } } })}
                      />
                    ))}
                    <input
                      className={styles.hexInput}
                      type="text"
                      value={p.design.background.value}
                      onChange={(e) => patch({ design: { background: { type: "color", value: e.target.value } } })}
                    />
                  </div>
                )}

                {p.design.background.type === "gradient" && (
                  <div className={styles.swatches}>
                    {BACKGROUND_GRADIENT_PRESETS.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        aria-label={g.label}
                        className={`${styles.swatch} ${p.design.background.value === g.id ? styles.swatchOn : ""}`}
                        style={{ backgroundImage: g.css }}
                        onClick={() => patch({ design: { background: { type: "gradient", value: g.id } } })}
                      />
                    ))}
                  </div>
                )}

                {p.design.background.type === "image" && (
                  <div className="footnote">
                    {p.design.background.value ? "Image set — pick Choose file to replace it." : "No image chosen yet."}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className={styles.previewCol}>
          <div className={styles.deviceSeg} role="group" aria-label="Preview device">
            <button type="button" className={device === "phone" ? styles.deviceOn : ""} onClick={() => setDevice("phone")}>
              Phone
            </button>
            <button type="button" className={device === "desktop" ? styles.deviceOn : ""} onClick={() => setDevice("desktop")}>
              Desktop
            </button>
          </div>
          <PagePreview profile={p} device={device} />
        </div>
      </div>
    </div>
  );
}

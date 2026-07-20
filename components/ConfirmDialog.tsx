"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./ConfirmDialog.module.css";

/**
 * A blocking yes/no for actions you can't take back. Deliberately plain: a title, the plain
 * consequence, and two buttons where Cancel is the easy one to hit.
 *
 * Escape and a click on the scrim both cancel — the safe way out is always available.
 */
export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
  danger = false,
}: {
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean; // red confirm — only for what can't be taken back
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  // Rendered into <body> through a portal, NOT where it's written in the tree. A `position: fixed`
  // child is positioned against the nearest ancestor that has a transform/filter/perspective —
  // and the cabinet's `.main` animates in, so its final `transform` frame silently turned this
  // dialog's "fixed" into "absolute inside .main": off-centre, and tall enough to scroll the page.
  // The portal puts it outside anyone's transform, so fixed means the viewport again.
  useEffect(() => setMounted(true), []);

  // Focus lands on Cancel, not on the destructive button — a stray Enter shouldn't wipe anything.
  // preventScroll: focusing normally makes the browser scroll the page to the focused element, and
  // the page behind is still scrollable at that instant — it jumped, which read as the content
  // sliding away under the dialog.
  useEffect(() => {
    if (mounted) cancelRef.current?.focus({ preventScroll: true });
  }, [mounted]);

  // An open dialog owns the screen: freeze the page behind it so it can't scroll away underneath.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  if (!mounted) return null; // no document during SSR

  return createPortal(
    <div className={styles.scrim} onClick={onCancel}>
      <div
        className={styles.card}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className={styles.title} id="confirm-title">
          {title}
        </h2>
        <div className={styles.body}>{body}</div>
        <div className={styles.actions}>
          <button ref={cancelRef} type="button" className="btn-outline" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className={danger ? styles.danger : styles.confirm} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

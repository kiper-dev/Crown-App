"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { Tier } from "@/lib/data/types";

const TIER_COLORS = ["#9AA0AE", "#5B9BF0", "#4FD1A5", "#F0B94F", "#F0834F", "#8B7CF6"];
let uid = 0;

export function defaultTiers(): Tier[] {
  return [
    { name: "Newcomer", threshold: 0, color: TIER_COLORS[0] },
    { name: "Regular", threshold: 10, color: TIER_COLORS[1] },
    { name: "VIP", threshold: 100, color: TIER_COLORS[3] },
  ];
}

interface Row {
  id: number;
  name: string;
  threshold: string;
  color: string;
}

function toRows(tiers: Tier[]): Row[] {
  return tiers.map((t) => ({ id: uid++, name: t.name, threshold: String(t.threshold), color: t.color }));
}

function toTiers(rows: Row[]): Tier[] {
  return rows.map((r) => ({ name: r.name, threshold: Math.max(0, Math.round(+r.threshold) || 0), color: r.color }));
}

// FLIP: after any render where rows moved, slide each one from its previous screen
// position to its new one instead of letting it snap. No-ops when nothing moved
// (typing a name, picking a color) — only a resort actually displaces rows.
function useFlip(order: number[]) {
  const els = useRef(new Map<number, HTMLDivElement>());
  const prevRects = useRef(new Map<number, DOMRect>());

  useLayoutEffect(() => {
    const nextRects = new Map<number, DOMRect>();
    els.current.forEach((el, id) => nextRects.set(id, el.getBoundingClientRect()));

    for (const id of order) {
      const el = els.current.get(id);
      const prev = prevRects.current.get(id);
      const next = nextRects.get(id);
      if (!el || !prev || !next) continue;
      const dy = prev.top - next.top;
      if (Math.abs(dy) < 1) continue;
      el.style.transition = "none";
      el.style.transform = `translateY(${dy}px)`;
      el.getBoundingClientRect(); // force reflow before re-enabling the transition
      requestAnimationFrame(() => {
        el.style.transition = "transform 320ms cubic-bezier(.22,.61,.36,1)";
        el.style.transform = "";
      });
    }
    prevRects.current = nextRects;
  });

  return (id: number) => (el: HTMLDivElement | null) => {
    if (el) els.current.set(id, el);
    else els.current.delete(id);
  };
}

// Name / logo / color per reputation tier. Sorts itself by threshold — reorder on blur,
// animated, so a value typed out of order (e.g. 50 under an existing 100) slides into
// its correct spot instead of just sitting in the wrong place (front.md I §6 tiers).
export function TierEditor({ initialTiers, onChange, max = 8 }: { initialTiers: Tier[]; onChange: (tiers: Tier[]) => void; max?: number }) {
  const [rows, setRows] = useState<Row[]>(() => toRows(initialTiers));
  const setRef = useFlip(rows.map((r) => r.id));

  function commit(next: Row[]) {
    setRows(next);
    onChange(toTiers(next));
  }

  function update(id: number, patch: Partial<Row>) {
    commit(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function resort() {
    const sorted = [...rows].sort((a, b) => (+a.threshold || 0) - (+b.threshold || 0));
    setRows(sorted);
    onChange(toTiers(sorted));
  }

  function addTier() {
    const last = rows[rows.length - 1]?.threshold ?? "0";
    const row: Row = { id: uid++, name: "New tier", threshold: String((+last || 0) + 100), color: TIER_COLORS[rows.length % TIER_COLORS.length] };
    commit([...rows, row]);
  }

  function removeTier(id: number) {
    commit(rows.filter((r) => r.id !== id));
  }

  return (
    <>
      <div className="tier-list">
        <div className="tier-head">
          <span>Name</span>
          <span>Reputation ≥</span>
          <span>Color</span>
          <span />
        </div>
        {rows.map((t) => (
          <div className="tier-row" key={t.id} ref={setRef(t.id)}>
            <input type="text" placeholder="Tier name" value={t.name} onChange={(e) => update(t.id, { name: e.target.value })} />
            <input
              type="number"
              min={0}
              value={t.threshold}
              onChange={(e) => update(t.id, { threshold: e.target.value })}
              onBlur={resort}
            />
            <input type="color" className="tier-swatch" aria-label={`${t.name || "Tier"} color`} value={t.color} onChange={(e) => update(t.id, { color: e.target.value })} />
            <button type="button" className="rm" aria-label="Remove tier" onClick={() => removeTier(t.id)}>
              ✕
            </button>
          </div>
        ))}
      </div>
      {rows.length < max && (
        <button className="btn-outline" type="button" style={{ alignSelf: "flex-start" }} onClick={addTier}>
          + Add tier
        </button>
      )}
    </>
  );
}

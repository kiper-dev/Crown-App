"use client";

import { useCrown } from "@/lib/data/DataProvider";

// Служебный тумблер режима данных: mock (всё на фейке) / chain (реальный кошелёк).
export function ModeSwitch() {
  const { mode, setMode, ready } = useCrown();
  if (!ready) return null;
  return (
    <div className="mode-switch" role="group" aria-label="Режим данных">
      <span className="lbl">данные</span>
      <button type="button" className={mode === "mock" ? "active" : ""} onClick={() => setMode("mock")}>
        mock
      </button>
      <button type="button" className={mode === "chain" ? "active" : ""} onClick={() => setMode("chain")}>
        chain
      </button>
    </div>
  );
}

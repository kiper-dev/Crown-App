"use client";

import styles from "./RuleLine.module.css";

// Rules are authored in games.ts with the streamer's knobs wrapped in [[double brackets]]. This
// splits on those and renders the marked parts as chips, so reading a rule shows at a glance which
// parts of it are the streamer's to decide. Everything outside the brackets is plain text.
const BRACKETS = /\[\[(.+?)\]\]/g;

export function RuleLine({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  BRACKETS.lastIndex = 0;

  while ((m = BRACKETS.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <span className={styles.chip} key={m.index} title="You set this">
        <svg className={styles.pencil} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M4 20h4L20 8l-4-4L4 16v4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
        {m[1]}
      </span>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));

  return <>{parts}</>;
}

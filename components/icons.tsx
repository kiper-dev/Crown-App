import type { SVGProps } from "react";
import type { Social } from "@/lib/data/types";

export function CrownMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" aria-hidden {...props}>
      <path d="M3.5 17.5 5 8l4.5 4L12 5.5 14.5 12 19 8l1.5 9.5Z" />
    </svg>
  );
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function ChevronDown(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="m6 10 6 6 6-6" />
    </svg>
  );
}

const SOCIAL_PATHS: Record<Social["kind"], string> = {
  twitch: "M4 2 2 6v14h5v3h3l3-3h4l5-5V2H4Zm14 11-3 3h-4l-3 3v-3H5V4h13v9ZM13 7h2v5h-2V7ZM9 7h2v5H9V7Z",
  youtube:
    "M21.6 7.2a2.8 2.8 0 0 0-2-2C17.9 4.8 12 4.8 12 4.8s-5.9 0-7.6.4a2.8 2.8 0 0 0-2 2A29.5 29.5 0 0 0 2 12a29.5 29.5 0 0 0 .4 4.8 2.8 2.8 0 0 0 2 2c1.7.4 7.6.4 7.6.4s5.9 0 7.6-.4a2.8 2.8 0 0 0 2-2A29.5 29.5 0 0 0 22 12a29.5 29.5 0 0 0-.4-4.8ZM10 15V9l5.2 3L10 15Z",
  telegram:
    "M9.04 15.51 8.9 19c.4 0 .58-.17.8-.38l1.92-1.83 3.98 2.91c.73.4 1.25.19 1.44-.67l2.61-12.26c.24-1.06-.38-1.48-1.09-1.21L3.34 11.1c-1.04.4-1.03.98-.18 1.24l3.9 1.22 9.05-5.71c.43-.26.82-.12.5.17l-7.57 7.49Z",
  x: "M17.5 3h3l-6.6 7.6L21.5 21h-6l-4.7-6.1L5.4 21H2.4l7-8.1L2.5 3h6.1l4.3 5.6L17.5 3Zm-1 16h1.7L7.6 4.7H5.8L16.5 19Z",
  kick: "M3 3h6v5l4-5h7l-6 8 6 8h-7l-4-5v5H3V3Z",
};

export function SocialIcon({ kind, ...props }: { kind: Social["kind"] } & SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d={SOCIAL_PATHS[kind]} />
    </svg>
  );
}

export const SOCIAL_LABEL: Record<Social["kind"], string> = {
  twitch: "Twitch",
  youtube: "YouTube",
  telegram: "Telegram",
  x: "X",
  kick: "Kick",
};

export function NavIcon({ name }: { name: "home" | "donations" | "viewers" | "games" | "widgets" | "settings" }) {
  const p = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (name) {
    case "home":
      return (<svg {...p}><path d="m4 11 8-7 8 7" /><path d="M6 10v9h12v-9" /></svg>);
    case "donations":
      return (<svg {...p}><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></svg>);
    case "viewers":
      return (<svg {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3.8 19c0-2.9 2.3-5.2 5.2-5.2s5.2 2.3 5.2 5.2" /><path d="M15.4 5.2a3.2 3.2 0 0 1 0 5.6" /><path d="M16.6 13.9c2.1.6 3.6 2.7 3.6 5.1" /></svg>);
    case "games":
      return (<svg {...p}><rect x="2.5" y="7.5" width="19" height="10" rx="5" /><path d="M7 10.5v3M5.5 12h3" /><path d="M16.2 11h.01M18.2 13h.01" /></svg>);
    case "widgets":
      return (<svg {...p}><rect x="4" y="4" width="7" height="7" rx="2" /><rect x="13" y="4" width="7" height="7" rx="2" /><rect x="4" y="13" width="7" height="7" rx="2" /><rect x="13" y="13" width="7" height="7" rx="2" /></svg>);
    case "settings":
      return (<svg {...p}><path d="M4 7h16" /><circle cx="15" cy="7" r="2.2" fill="var(--bg-0)" /><path d="M4 12h16" /><circle cx="9" cy="12" r="2.2" fill="var(--bg-0)" /><path d="M4 17h16" /><circle cx="13" cy="17" r="2.2" fill="var(--bg-0)" /></svg>);
  }
}

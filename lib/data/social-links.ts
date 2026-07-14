// Anti-phishing for social links (front.md §6): a link is accepted ONLY if it points to a
// profile/channel on that platform's official domain. The owner pastes a URL; we check the domain
// against an allowlist and the path against a strict pattern (a profile page, not /watch or an
// arbitrary path), strip query/hash, and rebuild a canonical https. Result: an arbitrary domain
// (a phishing lookalike) or a deep link (youtube.com/watch?v=…) simply returns null.
//
// Used everywhere a social link is entered (create wizard, cabinet settings) AND everywhere one is
// rendered as a clickable <a> (the public page) — validate on input, sanitize on output.

import type { Social } from "./types";

type Kind = Social["kind"];

// hostname without a leading www.
const bareHost = (u: URL): string => u.hostname.toLowerCase().replace(/^www\./, "");
const cleanPath = (u: URL): string => u.pathname.replace(/\/+$/, ""); // drop trailing slash

/** Common case: a single username segment on the canonical domain. */
function singleSegment(hosts: string[], canonical: string, re: RegExp): (u: URL) => string | null {
  return (u) => {
    if (!hosts.includes(bareHost(u))) return null;
    const m = re.exec(cleanPath(u));
    return m ? `https://${canonical}/${m[1]}` : null;
  };
}

const MATCHERS: Record<Kind, (u: URL) => string | null> = {
  // @handle, c/name, channel/ID, user/name — but NOT /watch, /shorts, /playlist.
  youtube: (u) => {
    if (!["youtube.com", "m.youtube.com"].includes(bareHost(u))) return null;
    const p = cleanPath(u);
    const ok =
      /^\/@[A-Za-z0-9_.-]{1,100}$/.test(p) ||
      /^\/c\/[A-Za-z0-9_.-]{1,100}$/.test(p) ||
      /^\/channel\/[A-Za-z0-9_-]{1,100}$/.test(p) ||
      /^\/user\/[A-Za-z0-9_.-]{1,100}$/.test(p);
    return ok ? `https://www.youtube.com${p}` : null;
  },
  twitch: singleSegment(["twitch.tv", "m.twitch.tv"], "www.twitch.tv", /^\/([A-Za-z0-9_]{3,25})$/),
  kick: singleSegment(["kick.com"], "kick.com", /^\/([A-Za-z0-9_]{2,30})$/),
  x: (u) => {
    if (!["x.com", "twitter.com", "mobile.twitter.com", "mobile.x.com"].includes(bareHost(u))) return null;
    const m = /^\/([A-Za-z0-9_]{1,15})$/.exec(cleanPath(u));
    if (!m) return null;
    // Reserved, non-profile routes must not canonicalize as a handle.
    const reserved = new Set(["home", "login", "signup", "i", "settings", "explore", "search", "messages", "notifications", "compose", "tos", "privacy", "about"]);
    if (reserved.has(m[1].toLowerCase())) return null;
    return `https://x.com/${m[1]}`;
  },
  tiktok: (u) => {
    if (!["tiktok.com", "m.tiktok.com"].includes(bareHost(u))) return null;
    const m = /^\/(@[A-Za-z0-9_.]{1,24})$/.exec(cleanPath(u));
    return m ? `https://www.tiktok.com/${m[1]}` : null;
  },
  instagram: singleSegment(["instagram.com"], "instagram.com", /^\/([A-Za-z0-9_.]{1,30})$/),
  telegram: singleSegment(["t.me", "telegram.me"], "t.me", /^\/([A-Za-z0-9_]{4,32})$/),
  onlyfans: singleSegment(["onlyfans.com"], "onlyfans.com", /^\/([A-Za-z0-9_.-]{1,30})$/),
};

// Hint shown in the input — what a valid link looks like for each platform.
export const SOCIAL_EXAMPLE: Record<Kind, string> = {
  youtube: "youtube.com/@channel",
  twitch: "twitch.tv/username",
  kick: "kick.com/username",
  x: "x.com/username",
  tiktok: "tiktok.com/@username",
  instagram: "instagram.com/username",
  telegram: "t.me/username",
  onlyfans: "onlyfans.com/username",
};

/**
 * Raw input → canonical https of a profile/channel, or null. Accepts input without a scheme
 * ("twitch.tv/username"). Arbitrary domain/path, query, hash → rejected.
 */
export function normalizeSocialLink(kind: Kind, raw: string): string | null {
  let s = (raw ?? "").trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  return MATCHERS[kind](u);
}

/** True if the (non-empty) input is a valid link for its platform. Empty input is "not invalid". */
export function isSocialValid(kind: Kind, raw: string): boolean {
  return normalizeSocialLink(kind, raw) !== null;
}

/**
 * Sanitize a list before saving: keep only valid links, each canonicalized, drop empties and exact
 * duplicates. This is what actually gets stored — phishing disguised as YouTube is never saved.
 */
export function sanitizeSocials(socials: Social[]): Social[] {
  const out: Social[] = [];
  const seen = new Set<string>();
  for (const s of socials) {
    const url = normalizeSocialLink(s.kind, s.url);
    if (!url) continue;
    const key = `${s.kind}|${url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ kind: s.kind, url });
  }
  return out;
}

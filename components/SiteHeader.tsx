"use client";

import Link from "next/link";
import { Logo } from "./Logo";
import { TopRight } from "./TopRight";

// Same sections as the homepage header. Mini-games is a public page;
// Admin Panel is the internal operator console.
const NAV = [
  { href: "/games", label: "Mini-games" },
  { href: "/ops", label: "Admin Panel" },
];

export function SiteHeader() {
  return (
    <header className="site-head">
      <div className="site-head-in">
        <Logo />
        <nav className="site-nav" aria-label="Sections">
          {NAV.map((n) => (
            <Link key={n.label} href={n.href}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="site-head-right">
          <TopRight />
        </div>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { useProfile } from "@/lib/data/ProfileProvider";
import { Mono } from "./Mono";

// Right corner of the top bar.
// Not registered → "Create your page" button.
// Registered → avatar + "Dashboard" (the personal cabinet is available).
export function TopRight() {
  const { ready, registered, profile } = useProfile();
  if (!ready) return <span style={{ width: 150 }} aria-hidden />;

  if (!registered) {
    return (
      <Link className="btn" href="/create" style={{ height: 44, fontSize: 15 }}>
        Create your page
      </Link>
    );
  }

  return (
    <Link className="persona" href="/space">
      Dashboard
      <Mono name={profile?.name || "?"} size={32} />
    </Link>
  );
}

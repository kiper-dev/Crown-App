"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProfile } from "@/lib/data/ProfileProvider";
import { Mono } from "./Mono";

// Right corner of the top bar.
// Not registered → "Create your page" button.
// Registered → avatar + "Personal space" (the personal cabinet is available).
export function TopRight() {
  const { ready, registered, profile } = useProfile();
  const pathname = usePathname();
  if (!ready) return <span style={{ width: 150 }} aria-hidden />;

  if (!registered) {
    // Already on the create page — a button pointing at the page you're on is just noise.
    if (pathname === "/create") return null;
    return (
      <Link className="btn" href="/create" style={{ height: 44, fontSize: 15 }}>
        Create your page
      </Link>
    );
  }

  return (
    <Link className="persona" href="/space">
      Personal space
      <Mono name={profile?.name || "?"} size={32} src={profile?.avatarUrl} />
    </Link>
  );
}

import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="page">
      <header className="appbar">
        <Logo />
      </header>
      <div className="center-note">
        <h1>Page not found</h1>
        <p>Check the link — it might have a typo.</p>
        <Link className="btn" href="/">
          Back to home
        </Link>
      </div>
    </main>
  );
}

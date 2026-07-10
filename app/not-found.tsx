import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="page">
      <header className="appbar">
        <Logo />
      </header>
      <div className="center-note">
        <h1>Страница не найдена</h1>
        <p>Проверь ссылку — возможно, в ней опечатка.</p>
        <Link className="btn" href="/">
          На главную
        </Link>
      </div>
    </main>
  );
}

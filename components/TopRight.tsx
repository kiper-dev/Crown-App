"use client";

import Link from "next/link";
import { useProfile } from "@/lib/data/ProfileProvider";
import { Mono } from "./Mono";

// Правый угол верхней панели.
// Не зарегистрирован → кнопка «Создать страницу».
// Зарегистрирован → аватар + «Кабинет» (личный кабинет появился).
export function TopRight() {
  const { ready, registered, profile } = useProfile();
  if (!ready) return <span style={{ width: 150 }} aria-hidden />;

  if (!registered) {
    return (
      <Link className="btn" href="/create" style={{ height: 44, fontSize: 15 }}>
        Создать страницу
      </Link>
    );
  }

  return (
    <Link className="who" href="/space">
      <Mono name={profile?.name || "?"} size={28} />
      Кабинет
    </Link>
  );
}

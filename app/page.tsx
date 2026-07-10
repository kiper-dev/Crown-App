"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { TopRight } from "@/components/TopRight";
import { SearchIcon, ChevronDown } from "@/components/icons";

export default function HomePage() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function go(e: React.FormEvent) {
    e.preventDefault();
    const handle = q.trim().replace(/^@/, "");
    if (handle) router.push(`/@${handle}`);
  }

  return (
    <main className="page">
      <section className="vp">
        <div className="vp-bar">
          <Logo />
          <TopRight />
        </div>

        <form className="search" onSubmit={go}>
          <SearchIcon />
          <input
            type="text"
            placeholder="@ник стримера"
            aria-label="Поиск стримера"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </form>
        <div className="search-hint">
          например, <b>@kira</b>
        </div>

        <a className="down" href="#l-hero" aria-label="Вниз, к разделу для стримеров">
          Для стримеров
          <ChevronDown />
        </a>
      </section>

      <div className="landing">
        <div className="hero-l" id="l-hero">
          <h1>Донаты сразу на твой кошелёк</h1>
          <p className="lead">
            Crown — страница для донатов в долларах. Зритель отправляет — деньги приходят тебе напрямую.
          </p>
          <div className="cta-row">
            <Link className="btn" href="/create">
              Создать страницу
            </Link>
            <Link className="link-quiet" href="/@kira">
              Посмотреть пример страницы
            </Link>
          </div>
        </div>

        <div className="pillars">
          <div className="card pillar">
            <h3>
              <span className="num">3%</span> и всё
            </h3>
            <p>Одна комиссия. Ни подписок, ни скрытых процентов. 97% каждого доната — твои.</p>
          </div>
          <div className="card pillar">
            <h3>Выплат не существует</h3>
            <p>Донат идёт с кошелька зрителя сразу на твой. Нам нечего задерживать — денег у нас нет.</p>
          </div>
          <div className="card pillar">
            <h3>Не верь нам на слово</h3>
            <p>Код открыт, движение каждого доната можно проверить самому.</p>
            <a href="https://github.com/69walterwhite420-star/Crown-Core" target="_blank" rel="noreferrer">
              Открыть на GitHub →
            </a>
          </div>
        </div>

        <div className="steps">
          <div className="step">
            <div className="n num">1</div>
            <h3>Создай страницу</h3>
            <p>Имя и кошелёк. Меньше минуты.</p>
          </div>
          <div className="step">
            <div className="n num">2</div>
            <h3>Кинь ссылку зрителям</h3>
            <p>crown.tv/@ты — в описание стрима, в чат, куда угодно.</p>
          </div>
          <div className="step">
            <div className="n num">3</div>
            <h3>Донаты приходят напрямую</h3>
            <p>А каждый донат растит репутацию зрителя у тебя.</p>
          </div>
        </div>

        <div className="final">
          <p>Понадобится только кошелёк.</p>
          <Link className="btn" href="/create">
            Создать страницу
          </Link>
        </div>
      </div>

      <div className="footer">
        <span>Crown</span>
        <a href="https://github.com/69walterwhite420-star/Crown-Core" target="_blank" rel="noreferrer">
          GitHub
        </a>
        <Link href="/">Условия</Link>
        <Link href="/">Конфиденциальность</Link>
      </div>
    </main>
  );
}

# Crown App

Фронтенд и централизованный слой Crown: сайт, личный кабинет, кампании, мини-игры, OBS-оверлеи.

**Вне доверенного контура — ни денег, ни ключей.** Приложение только читает открытую книгу [Crown-Core](https://github.com/Crown-protocol/Crown-Core) и показывает её. Все расчёты идут ончейн, мимо этого кода.

## Что это

Донаты автору без посредника между кошельком донора и получателем. Платёж уходит в неизменяемый сплиттер на Solana, факт доната попадает в книгу репутации на ICP, а Crown App показывает это зрителю и стримеру — профиль, цели, оверлей в OBS.

## Стек

| Слой | Технология |
|---|---|
| Каркас | Next.js 14 (App Router), React 18, TypeScript |
| Solana | `@solana/web3.js`, `@solana/spl-token`, base58 |
| ICP | `@dfinity/agent`, `@dfinity/candid` |
| Данные | SQLite через `@libsql/client` |
| Подписи | `tweetnacl` (ed25519) |

## Запуск

```bash
npm install
npm run dev          # http://localhost:3000
```

Проверки:

```bash
npm run verify:chain   # сеть и адреса
npm run verify:db      # схема и инварианты БД
```

Телеграм-бот — отдельным процессом:

```bash
npm run bot            # читает bot/.env
```

## Структура

```
app/
  [handle]/     публичный профиль автора
  space/        кабинет: цели, кампании, конструктор страницы
  games/        мини-игры
  overlay/      OBS-оверлеи
  discover/     каталог авторов
  admin/        админка
  api/          donations, feed, reputation, profiles, telegram, indexer
lib/server/     БД, индексер, авторизация, рейт-лимит
scripts/        verify-chain, verify-db
```

## База данных

SQLite, `data/crown.db`. Таблицу `donations` пишет **только индексер** — вручную туда не пишем, иначе разъедется с ончейном.

## Проект

| Репозиторий | Роль |
|---|---|
| [Crown-Core](https://github.com/Crown-protocol/Crown-Core) | сплиттер (Solana) + книга репутации (ICP) |
| [Crown-Factory](https://github.com/Crown-protocol/Crown-Factory) | two-outcome эскроу, атрибуция через PDA |
| [Conditional-Tasks](https://github.com/Crown-protocol/Conditional-Tasks) | игра: условные задания |
| [Conditional-Funding](https://github.com/Crown-protocol/Conditional-Funding) | игра: сбор средств |
| **Crown-App** | фронтенд и централизованный слой |

Подробности фронта — [docs/front.md](docs/front.md). Читать вместе с документацией ядра и фабрики.

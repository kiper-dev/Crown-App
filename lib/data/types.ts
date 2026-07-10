export type DataMode = "mock" | "chain";

export interface Social {
  kind: "twitch" | "youtube" | "telegram" | "x" | "kick";
  url: string;
}

export interface Streamer {
  handle: string; // без "@"
  name: string;
  bio: string;
  address: `0x${string}`; // куда приходят донаты
  socials: Social[];
  levels: number[]; // пороги уровней в долларах, напр. [10, 100, 1000]
}

export interface Donation {
  id: string;
  from: string; // имя зрителя (или адрес)
  amount: number; // в долларах
  message?: string;
  time: string; // человекочитаемое «2 мин назад»
  fresh?: boolean;
}

export interface Campaign {
  handle: string;
  slug: string;
  kind: "raise" | "game" | "ask";
  title: string;
  lead: string;
  goal?: number; // цель в долларах (для kind=raise)
  raised: number;
  count: number;
}

export interface DonateInput {
  handle: string;
  amount: number;
  name?: string;
  message?: string;
}

// Профиль зарегистрированного стримера (localStorage — «мок-бэкенд»)
export interface Profile {
  handle: string;
  name: string;
  bio: string;
  address: `0x${string}` | "";
  socials: Social[];
  levels: number[];
}

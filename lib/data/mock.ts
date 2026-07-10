import type { Streamer, Donation, Campaign } from "./types";

// Единый мок-мир (тот же, что в макетах F1).
export const MOCK_STREAMERS: Record<string, Streamer> = {
  kira: {
    handle: "kira",
    name: "Кира",
    bio: "Инди-хорроры и уютные кооперативы. Стримы по вт, чт и сб в 19:00 мск.",
    address: "0x1111111111111111111111111111111111111111",
    socials: [
      { kind: "twitch", url: "https://twitch.tv/kira" },
      { kind: "youtube", url: "https://youtube.com/@kira" },
      { kind: "telegram", url: "https://t.me/kira" },
    ],
    levels: [10, 100, 1000],
  },
};

export const MOCK_FEED: Donation[] = [
  { id: "d1", from: "Макс", amount: 10, message: "За вчерашний стрим. Концовка — топ", time: "2 мин назад" },
  { id: "d2", from: "anna_k", amount: 5, message: "Привет из Питера!", time: "34 мин назад" },
  { id: "d3", from: "Аноним", amount: 1, time: "час назад" },
  { id: "d4", from: "Тимур", amount: 50, message: "На микрофон. Ждём звук без шипения", time: "3 ч назад" },
  { id: "d5", from: "lesya", amount: 5, message: "Спасибо за уютные стримы", time: "вчера" },
  { id: "d6", from: "Дэн", amount: 25, message: "GG за хоррор-марафон", time: "вчера" },
];

// Репутация зрителя (смотрящего) у стримера.
export const MOCK_REPUTATION: Record<string, number> = { kira: 42 };

export const MOCK_CAMPAIGNS: Record<string, Campaign> = {
  "kira/mikrofon": {
    handle: "kira",
    slug: "mikrofon",
    kind: "raise",
    title: "Собираем на новый микрофон",
    lead: "Старый начал шуметь — вы это слышали. Собираем на Shure MV7 и стойку.",
    goal: 500,
    raised: 327,
    count: 23,
  },
};

// Данные кабинета (за период).
export const MOCK_DASHBOARD = {
  received: 1284,
  donations: 96,
  newViewers: 12,
  peakLabel: "4 июл · 120 $",
  days: [32, 18, 44, 45, 0, 51, 38, 22, 60, 15, 34, 48, 20, 55, 28, 42, 36, 39, 64, 31, 25, 47, 58, 33, 120, 52, 46, 39, 61, 44, 17],
  peakValue: 120,
  axis: ["10 июн", "25 июн", "10 июл"],
};

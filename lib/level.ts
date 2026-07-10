// Уровень зрителя по репутации у стримера. Уровни — пороги в долларах.
export function levelInfo(reputation: number, levels: number[]) {
  const sorted = [...levels].sort((a, b) => a - b);
  let level = 0;
  for (const t of sorted) if (reputation >= t) level += 1;
  const next = sorted.find((t) => t > reputation) ?? null;
  return { level, next };
}

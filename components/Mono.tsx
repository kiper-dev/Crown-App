export function Mono({ name, size = 40 }: { name: string; size?: number }) {
  const letter = (name || "·").trim().charAt(0) || "·";
  return (
    <span className="mono" style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }} aria-hidden>
      {letter}
    </span>
  );
}

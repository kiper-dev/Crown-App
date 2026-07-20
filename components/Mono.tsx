// An identity chip. With `src` (an uploaded avatar) it shows the picture AS-IS — no circle clip and
// no backdrop — so the shape baked into the crop (circle / rounded / square / hexagon, or a cut-out
// figure on a transparent PNG) is exactly what shows. Without a picture it falls back to the first
// letter in the classic round chip, so people without an avatar still read as a consistent avatar.
export function Mono({ name, size = 40, src }: { name: string; size?: number; src?: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: "contain", flex: "none", display: "block" }}
        aria-hidden
      />
    );
  }
  const letter = (name || "·").trim().charAt(0) || "·";
  return (
    <span className="mono" style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }} aria-hidden>
      {letter}
    </span>
  );
}

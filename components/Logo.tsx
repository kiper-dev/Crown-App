import Link from "next/link";
import { CrownBadge } from "./CrownBadge";

export function Logo() {
  return (
    <Link className="logo" href="/">
      <CrownBadge size={26} />
      Crown
    </Link>
  );
}

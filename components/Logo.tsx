import Link from "next/link";
import { CrownMark } from "./icons";

export function Logo() {
  return (
    <Link className="logo" href="/">
      <CrownMark />
      Crown
    </Link>
  );
}

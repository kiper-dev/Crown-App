import { Logo } from "./Logo";
import { TopRight } from "./TopRight";

export function AppBar() {
  return (
    <header className="appbar">
      <Logo />
      <div className="right">
        <TopRight />
      </div>
    </header>
  );
}

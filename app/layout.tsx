import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { ModeSwitch } from "@/components/ModeSwitch";

export const metadata: Metadata = {
  title: "Crown",
  description: "Донаты сразу на твой кошелёк",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <Providers>
          {children}
          <ModeSwitch />
        </Providers>
      </body>
    </html>
  );
}

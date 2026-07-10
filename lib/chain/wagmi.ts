import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { ACTIVE_CHAIN } from "./config";

// Конфиг кошелька для режима chain. injected = MetaMask / Rabby / любой
// браузерный кошелёк. Без WalletConnect — не нужен projectId, работает сразу.
export const wagmiConfig = createConfig({
  chains: [ACTIVE_CHAIN],
  connectors: [injected()],
  transports: {
    [ACTIVE_CHAIN.id]: http(),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}

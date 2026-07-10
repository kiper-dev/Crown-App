import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { ACTIVE_CHAIN } from "./config";

// Wallet config for chain mode. injected = MetaMask / Rabby / any
// browser wallet. No WalletConnect — no projectId needed, works out of the box.
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

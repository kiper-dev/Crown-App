import { http, createConfig } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import { ACTIVE_CHAIN, WALLETCONNECT_PROJECT_ID } from "./config";

// Wallet config. injected() covers MetaMask/Rabby/Phantom's Ethereum mode/any browser
// extension — wagmi auto-detects each one separately via EIP-6963, so the picker
// (components/WalletButton.tsx) can list them by name instead of one generic "Injected".
// WalletConnect only joins the list once a real project ID is set (lib/chain/config.ts) —
// no projectId, no fake button.
export const wagmiConfig = createConfig({
  chains: [ACTIVE_CHAIN],
  connectors: [injected(), ...(WALLETCONNECT_PROJECT_ID ? [walletConnect({ projectId: WALLETCONNECT_PROJECT_ID, showQrModal: true })] : [])],
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

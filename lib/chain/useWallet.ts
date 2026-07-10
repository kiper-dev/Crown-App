"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useCrown } from "@/lib/data/DataProvider";

// One wallet handle for both modes.
// mock — "connected" without a real wallet; chain — a real injected wallet.
export function useWallet() {
  const { mode } = useCrown();
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (mode === "mock") {
    return {
      mode,
      connected: true,
      address: undefined as `0x${string}` | undefined,
      connect: () => {},
      disconnect: () => {},
      connecting: false,
      hasWallet: true,
    };
  }

  const injected = connectors[0];
  return {
    mode,
    connected: isConnected,
    address,
    connect: () => {
      if (injected) connect({ connector: injected });
    },
    disconnect,
    connecting: isPending,
    hasWallet: typeof window !== "undefined" && !!(window as { ethereum?: unknown }).ethereum,
  };
}

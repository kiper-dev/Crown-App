"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useCrown } from "@/lib/data/DataProvider";

// Единая ручка кошелька для обоих режимов.
// mock — «подключён» без реального кошелька; chain — настоящий injected-кошелёк.
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

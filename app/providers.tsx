"use client";

import { useState } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/chain/wagmi";
import { DataProvider } from "@/lib/data/DataProvider";
import { ProfileProvider } from "@/lib/data/ProfileProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ProfileProvider>
          <DataProvider>{children}</DataProvider>
        </ProfileProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

"use client";

import { WagmiProvider, http, createConfig } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";

const SOMNIA_ID = Number(process.env.NEXT_PUBLIC_SOMNIA_CHAIN_ID ?? 0);
const SOMNIA_RPC = process.env.NEXT_PUBLIC_SOMNIA_RPC_URL!;

const somniaTestnet = {
  id: SOMNIA_ID,
  name: "Somnia Testnet",
  nativeCurrency: { name: "Somnia", symbol: "SOM", decimals: 18 },
  rpcUrls: {
    default: { http: [SOMNIA_RPC] },
    public: { http: [SOMNIA_RPC] }
  }
} as const;

const config = getDefaultConfig({
  appName: "DCR — Dev Control Room",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [somniaTestnet],
  transports: { [somniaTestnet.id]: http(SOMNIA_RPC) },
  ssr: true
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}


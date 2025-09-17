"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { WagmiProvider, http, fallback } from "wagmi";
import { RainbowKitProvider, getDefaultConfig, darkTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

const SOMNIA_ID = Number(process.env.NEXT_PUBLIC_SOMNIA_CHAIN_ID || 1301);
const RPC_PRIMARY = process.env.NEXT_PUBLIC_SOMNIA_RPC || "https://dream-rpc.somnia.network/";
// opcional: agrega un RPC secundario si tienes (o déjalo igual que primary)
const RPC_FALLBACK = process.env.NEXT_PUBLIC_SOMNIA_RPC_FALLBACK || RPC_PRIMARY;
const EXPLORER = "https://dream-rpc.somnia.network/";

export const somniaShannon = {
  id: SOMNIA_ID,
  name: "Somnia Shannon (testnet)",
  nativeCurrency: { name: "SOM", symbol: "SOM", decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_PRIMARY, RPC_FALLBACK] },
    public: { http: [RPC_PRIMARY, RPC_FALLBACK] },
  },
  blockExplorers: {
    default: { name: "Somnia Explorer", url: EXPLORER },
  },
} as const;

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo";

// 👇 usa fallback transport con reintentos (viem)
const wagmiConfig = getDefaultConfig({
  appName: "DCR — Dev Control Room",
  projectId,
  chains: [somniaShannon],
  transports: {
    [somniaShannon.id]: fallback(
      [
        http(RPC_PRIMARY, { batch: true, retryCount: 2, timeout: 8_000 }),
        http(RPC_FALLBACK, { batch: true, retryCount: 2, timeout: 8_000 }),
      ],
      { rank: true } // intenta en orden
    ),
  },
  // SSR ayuda a que no parpadee estado de conexión
  ssr: true,
});

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            borderRadius: "medium",
            overlayBlur: "small",
            accentColor: "#000000ff",
          })}
        >
          {children}
          <Toaster
          position="bottom-right"
          toastOptions={{
            style: { background: "#0A0F1F", color: "#fff", border: "1px solid rgba(0,255,209,0.3)" },
            success: { iconTheme: { primary: "#00FFD1", secondary: "#0A0F1F" } },
            error: { iconTheme: { primary: "#FF3B6A", secondary: "#0A0F1F" } },
          }}
        />  
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

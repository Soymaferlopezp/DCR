import { defineChain } from "viem";

export const somniaTestnet = defineChain({
  id: Number(process.env.NEXT_PUBLIC_SOMNIA_CHAIN_ID ?? 0),
  name: "Somnia Testnet",
  nativeCurrency: { name: "Somnia", symbol: "SOM", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_SOMNIA_RPC_URL!] },
    public:  { http: [process.env.NEXT_PUBLIC_SOMNIA_RPC_URL!] }
  }
});

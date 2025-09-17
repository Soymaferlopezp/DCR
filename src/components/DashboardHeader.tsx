"use client";

import { useEffect } from "react";
import { useAccountEffect } from "wagmi";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function DashboardHeader({ title = "Overview" }: { title?: string }) {
  const router = useRouter();

  // 🚪 Al desconectar → volver al landing
  useAccountEffect({
    onDisconnect() {
      router.push("/");
    },
  });

  return (
    <header className="sticky top-0 z-10 bg-space/80 backdrop-blur border-b border-cyan/20">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold">{title}</h1>

        {/* Botón custom (sin verde). Address fragment abre modal para desconectar */}
        <ConnectButton.Custom>
          {({ account, chain, mounted, openAccountModal, openConnectModal }) => {
            const connected = mounted && account && chain;

            if (!connected) {
              return (
                <button
                  onClick={openConnectModal}
                  className="text-sm font-medium bg-cyan/10 px-3 py-1 rounded border border-cyan/30 hover:bg-cyan/20 transition"
                >
                  Connect
                </button>
              );
            }

            const short =
              account?.address
                ? `${account.address.slice(0, 6)}…${account.address.slice(-4)}`
                : "Account";

            return (
              <button
                onClick={openAccountModal}
                className="text-sm font-mono bg-white/5 px-3 py-1 rounded border border-cyan/30 hover:bg-white/10 transition"
                title="Account"
              >
                {short}
              </button>
            );
          }}
        </ConnectButton.Custom>
      </div>
    </header>
  );
}

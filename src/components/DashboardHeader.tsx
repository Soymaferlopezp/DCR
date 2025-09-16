"use client";

import { useEffect } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";

type Props = {
  title?: string;
};

export default function DashboardHeader({ title = "Overview" }: Props) {
  const router = useRouter();
  const { isConnected } = useAccount();

  // Guard: si no hay wallet conectada, volver al landing
  useEffect(() => {
    if (!isConnected) {
      router.push("/");
    }
  }, [isConnected, router]);

  return (
    <header className="sticky top-0 z-10 bg-space/80 backdrop-blur border-b border-cyan/20">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold">{title}</h1>

        {/* Botón de RainbowKit, muestra address abreviada y menú de desconectar */}
        <ConnectButton.Custom>
          {({ account, chain, openAccountModal, openConnectModal, mounted }) => {
            const connected = mounted && account && chain;
            const shortAddr =
              account?.address
                ? `${account.address.slice(0, 6)}…${account.address.slice(-4)}`
                : "";

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

            return (
              <button
                onClick={openAccountModal}
                className="text-sm font-mono bg-cyan/10 px-3 py-1 rounded border border-cyan/30 hover:bg-cyan/20 transition"
                title="Account"
                aria-label="Open account menu"
              >
                {shortAddr}
              </button>
            );
          }}
        </ConnectButton.Custom>
      </div>
    </header>
  );
}


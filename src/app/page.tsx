"use client";

import { useEffect } from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";

export default function Home() {
  const { openConnectModal } = useConnectModal();
  const { address, isConnected } = useAccount();
  const router = useRouter();

  // Si la wallet se conecta, entra al dashboard
  useEffect(() => {
    if (isConnected && address) {
      router.push("/dashboard");
    }
  }, [isConnected, address, router]);

  return (
    <main className="min-h-screen bg-space text-pure">
      {/* NAV */}
      <header className="sticky top-0 z-10 border-b border-cyan/20 bg-space/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md border border-cyan/40 shadow-[0_0_20px_#00FFD120] grid place-items-center">
              <span className="text-sm font-bold text-cyan">DCR</span>
            </div>
            <span className="font-medium tracking-wide">Dev Control Room</span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-pure/80">
            <a href="#features" className="hover:text-pure">Features</a>
            <a href="#how" className="hover:text-pure">How it works</a>
            <a href="#open" className="hover:text-pure">Open-source</a>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-10">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">
              DCR — Dev Control Room
            </h1>
            <p className="mt-4 text-pure/80 text-lg">
              Your command center for building on Somnia.
            </p>
            <p className="mt-1 text-pure/60">
              All systems, <span className="text-cyan">under control</span>.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                aria-label="Enter Dev Control Room"
                className="px-5 py-3 rounded-md font-medium bg-cyan text-space transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-cyan/60 shadow-[0_0_20px_rgba(0,255,209,0.25)]"
                onClick={() => openConnectModal?.()} // abre el modal de RainbowKit
              >
                Enter Control Room
              </button>
              <a
                href="#features"
                className="px-5 py-3 rounded-md font-medium border border-cyan/30 text-pure hover:bg-white/5"
              >
                Explore Features
              </a>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 rounded bg-pink/10 border border-pink/30 text-pink">
                testnet-first
              </span>
              <span className="px-2 py-1 rounded bg-cyan/10 border border-cyan/30 text-cyan">
                live insights
              </span>
              <span className="px-2 py-1 rounded bg-white/5 border border-white/20">
                open-source
              </span>
            </div>
          </div>

          {/* Card de “mission control” */}
          <div className="relative">
            <div className="rounded-xl border border-cyan/30 bg-white/-[0.02] p-5 shadow-[0_0_40px_#00FFD115]">
              <div className="flex items-center justify-between text-xs text-pure/70">
                <span>Mission Console</span>
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-cyan/80" />
                  <span className="h-2 w-2 rounded-full bg-pink/80" />
                  <span className="h-2 w-2 rounded-full bg-pure/60" />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-cyan/20 p-3">
                  <p className="text-xs text-pure/60">Registered</p>
                  <p className="text-2xl font-bold">15</p>
                </div>
                <div className="rounded-lg border border-cyan/20 p-3">
                  <p className="text-xs text-pure/60">Active (24h)</p>
                  <p className="text-2xl font-bold">73</p>
                </div>
                <div className="rounded-lg border border-cyan/20 p-3">
                  <p className="text-xs text-pure/60">Avg Gas</p>
                  <p className="text-2xl font-bold">15,9873</p>
                </div>
              </div>
              <div className="mt-4 h-28 rounded-lg border border-cyan/20 grid place-items-center text-pure/50 text-sm">
                Activity timeline (soon)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="text-xl font-semibold">What you’ll get</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          <li className="rounded-md border border-cyan/20 p-4">
            <span className="text-cyan font-semibold">Register Contracts</span>
            <p className="text-sm text-pure/70 mt-1">Track and label your Somnia testnet deployments.</p>
          </li>
          <li className="rounded-md border border-cyan/20 p-4">
            <span className="text-cyan font-semibold">Live Pings</span>
            <p className="text-sm text-pure/70 mt-1">Send owner/public pings and watch events as they happen.</p>
          </li>
          <li className="rounded-md border border-cyan/20 p-4">
            <span className="text-cyan font-semibold">Gas Insights</span>
            <p className="text-sm text-pure/70 mt-1">Estimates per function when ABI is available.</p>
          </li>
          <li className="rounded-md border border-cyan/20 p-4">
            <span className="text-cyan font-semibold">Public Analysis</span>
            <p className="text-sm text-pure/70 mt-1">Paste any address to inspect basic activity.</p>
          </li>
        </ul>
      </section>

{/* FOOTER */}
<footer id="open" className="border-t border-white/10">
  <div className="mx-auto max-w-6xl px-4 py-10 text-center text-sm text-pure/60">
    <p className="mb-4">
      DCR — Dev Control Room • Built for Somnia testnet
    </p>

    {/* contenedor que centra el bloque */}
    <div className="flex justify-center">
      <pre
        className="inline-block text-[11px] sm:text-xs leading-[1.1] text-pure/70"
        style={{
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          whiteSpace: "pre",
          letterSpacing: "0",
        }}
      >{String.raw`██████╗  ██████╗██████╗
██╔══██╗██╔════╝██╔══██╗
██║  ██║██║     ██████╔╝
██║  ██║██║     ██╔══██╗
██████╔╝╚██████╗██║  ██║
╚═════╝  ╚═════╝╚═╝  ╚═╝`}</pre>
    </div>
  </div>
</footer>


    </main>
  );
}

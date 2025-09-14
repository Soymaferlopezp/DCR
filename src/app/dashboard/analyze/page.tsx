"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function AnalyzePage() {
  const sp = useSearchParams();
  const [addr, setAddr] = useState("");

  // Si llegaron con ?address=... precarga el campo
  useEffect(() => {
    const q = sp.get("address");
    if (q) setAddr(q);
  }, [sp]);

  const isHexAddr = /^0x[a-fA-F0-9]{40}$/.test(addr.trim());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isHexAddr) return;
    // Placeholder por ahora
    alert(`Analyze (placeholder): ${addr}`);
  };

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 bg-space/80 backdrop-blur border-b border-cyan/20">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Analyze Address</h1>
          <div className="text-xs text-pure/70">public mode</div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 grid gap-6">
        <div className="rounded-lg border border-cyan/20 p-4">
          <h2 className="font-medium">Paste a Somnia contract address</h2>
          <p className="text-sm text-pure/70 mt-1">
            Later: if ABI is provided/verified, we’ll show per-function metrics.
          </p>

          <form onSubmit={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              value={addr}
              onChange={(e) => setAddr(e.target.value)}
              placeholder="0x…"
              className="bg-transparent border border-cyan/30 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-cyan/50 font-mono"
              aria-label="Contract address"
            />
            <button
              type="submit"
              disabled={!isHexAddr}
              className="px-5 py-2 rounded-md font-medium bg-cyan text-space hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Analyze"
            >
              Analyze
            </button>
          </form>
        </div>

        {/* Placeholder de resultados */}
        <div className="rounded-lg border border-cyan/20 p-4">
          <h2 className="font-medium">Results</h2>
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-cyan/20 p-3">
              <p className="text-xs text-pure/60">Tx (24h)</p>
              <p className="text-2xl font-bold">—</p>
            </div>
            <div className="rounded-lg border border-cyan/20 p-3">
              <p className="text-xs text-pure/60">Unique wallets</p>
              <p className="text-2xl font-bold">—</p>
            </div>
            <div className="rounded-lg border border-cyan/20 p-3">
              <p className="text-xs text-pure/60">Avg gas</p>
              <p className="text-2xl font-bold">—</p>
            </div>
          </div>

          <div className="mt-4 h-40 rounded-lg border border-cyan/20 grid place-items-center text-pure/50 text-sm">
            Timeline chart (soon)
          </div>
        </div>
      </div>
    </div>
  );
}

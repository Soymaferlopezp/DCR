"use client";

import { useState } from "react";

export default function MyContractsPage() {
  const [form, setForm] = useState({ name: "", address: "" });
  const [rows, setRows] = useState<
    { name: string; address: string; status: "unverified" | "verified" }[]
  >([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validación básica visual (sin bloquear al usuario en esta fase)
    const addrOk = /^0x[a-fA-F0-9]{40}$/.test(form.address.trim());
    setRows((prev) => [
      ...prev,
      { name: form.name.trim() || "Unnamed", address: form.address.trim(), status: addrOk ? "unverified" : "unverified" }
    ]);
    setForm({ name: "", address: "" });
  };

  return (
    <div className="min-h-full">
      {/* Header del panel derecho */}
      <header className="sticky top-0 z-10 bg-space/80 backdrop-blur border-b border-cyan/20">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">My Contracts</h1>
          <div className="text-xs text-pure/70">Register & manage</div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 grid gap-6">
        {/* Card: Formulario */}
        <div className="rounded-lg border border-cyan/20 p-4">
          <h2 className="font-medium">Register a contract (Somnia testnet)</h2>
          <p className="text-sm text-pure/70 mt-1">
            This is a local placeholder. Later it will call <code>registerMyContract()</code>.
          </p>

          <form onSubmit={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1">
              <label className="text-sm text-pure/80">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                placeholder="My Counter"
                className="bg-transparent border border-cyan/30 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-cyan/50"
              />
            </div>
            <div className="grid gap-1 sm:col-span-2">
              <label className="text-sm text-pure/80">Contract address (0x…)</label>
              <input
                value={form.address}
                onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
                placeholder="0x0000…"
                className="bg-transparent border border-cyan/30 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-cyan/50 font-mono"
              />
            </div>

            <div className="sm:col-span-2 flex gap-3">
              <button
                type="submit"
                className="px-5 py-2 rounded-md font-medium bg-cyan text-space hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-cyan/60"
                aria-label="Register contract"
              >
                Register
              </button>
              <a
                href="/dashboard/analyze"
                className="px-5 py-2 rounded-md font-medium border border-cyan/30 hover:bg-white/5"
              >
                Analyze a public address
              </a>
            </div>
          </form>
        </div>

        {/* Card: Tabla simple */}
        <div className="rounded-lg border border-cyan/20 p-4">
          <h2 className="font-medium">My registered contracts</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-pure/70">
                <tr className="text-left">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Address</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-pure/50">
                      No contracts yet. Register one above.
                    </td>
                  </tr>
                ) : (
                  rows.map((r, i) => (
                    <tr key={i} className="border-t border-cyan/15">
                      <td className="py-2 pr-4">{r.name}</td>
                      <td className="py-2 pr-4 font-mono">{r.address || "—"}</td>
                      <td className="py-2 pr-4">
                        <span
                          className={
                            r.status === "verified"
                              ? "px-2 py-1 rounded bg-cyan/10 border border-cyan/30 text-cyan"
                              : "px-2 py-1 rounded bg-white/5 border border-white/20"
                          }
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex gap-2">
                          <button
                            className="text-cyan hover:underline"
                            onClick={() => alert("Soon: ping(owner)")}
                          >
                            Ping
                          </button>
                          <a className="text-pure/80 hover:underline" href={`/dashboard/analyze?address=${r.address}`}>
                            Analyze
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-pure/60 mt-3">
            Later: this table will stream on-chain events (watch) and persist via indexer.
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import {
  useAccount,
  usePublicClient,
  useWriteContract,
  useReadContract,
  useWatchContractEvent
} from "wagmi";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { devlogAddress, devlogAbi } from "@/lib/devlog";
import DashboardHeader from "@/components/DashboardHeader";

export default function MyContractsPage() {
  const router = useRouter();
  const { address: me, isConnected } = useAccount();
  const pub = usePublicClient();

  // Guard: si no hay wallet conectada, volver al landing
  useEffect(() => {
    if (!isConnected) {
      router.push("/");
    }
  }, [isConnected, router]);

  const [form, setForm] = useState({ name: "", address: "" });

  // Leer mis contratos (depende de msg.sender)
  const { data: myList, refetch } = useReadContract({
    address: devlogAddress,
    abi: devlogAbi,
    functionName: "getMyContracts",
    account: me as `0x${string}`,
    query: { enabled: !!me }
  });

  const rows = useMemo(() => {
    if (!myList) return [];
    const [addrs, labels] = myList as [readonly `0x${string}`[], readonly string[]];
    return addrs.map((a, i) => ({
      name: labels[i] || "Unnamed",
      address: a,
      status: "unverified" as const
    }));
  }, [myList]);

  const { writeContractAsync, isPending } = useWriteContract();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim() || "Unnamed";
    const addr = form.address.trim() as `0x${string}`;
    if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
      alert("Address inválida");
      return;
    }
    try {
      const hash = await writeContractAsync({
        address: devlogAddress,
        abi: devlogAbi,
        functionName: "registerMyContract",
        args: [name, addr]
      });
      await pub!.waitForTransactionReceipt({ hash });
      await refetch();
      setForm({ name: "", address: "" });
      alert("Contrato registrado ✅");
    } catch (err: any) {
      console.error(err);
      alert(err?.shortMessage || "Fallo al registrar");
    }
  };

  // Refrescar lista cuando llegue el evento (polling)
  useWatchContractEvent({
    address: devlogAddress,
    abi: devlogAbi,
    eventName: "ContractRegistered",
    args: me ? { dev: me } : undefined,
    enabled: !!me,
    poll: true,
    pollingInterval: 2000,
    strict: false,
    onLogs: () => refetch()
  });

  return (
    <div className="min-h-full">
      <DashboardHeader title="My Contracts" />

      <div className="mx-auto max-w-6xl px-4 py-6 grid gap-6">
        {/* Form */}
        <div className="rounded-lg border border-cyan/20 p-4">
          <h2 className="font-medium">Register a contract (Somnia testnet)</h2>
          <p className="text-sm text-pure/70 mt-1">
            Calls <code>registerMyContract(name, address)</code> on-chain.
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
                disabled={!me || isPending}
                className="px-5 py-2 rounded-md font-medium bg-cyan text-space hover:brightness-110 disabled:opacity-50"
                aria-label="Register contract"
              >
                {isPending ? "Registering…" : "Register"}
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

        {/* Tabla */}
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
                      {me
                        ? "No contracts yet. Register one above."
                        : "Connect your wallet to view your contracts."}
                    </td>
                  </tr>
                ) : (
                  rows.map((r, i) => (
                    <tr key={i} className="border-t border-cyan/15">
                      <td className="py-2 pr-4">{r.name}</td>
                      <td className="py-2 pr-4 font-mono">{r.address}</td>
                      <td className="py-2 pr-4">
                        <span className="px-2 py-1 rounded bg-white/5 border border-white/20">
                          unverified
                        </span>
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex gap-2">
                          <button
                            className="text-cyan hover:underline"
                            onClick={async () => {
                              try {
                                const hash = await writeContractAsync({
                                  address: devlogAddress,
                                  abi: devlogAbi,
                                  functionName: "ping",
                                  args: [r.address as `0x${string}`, 0] // owner ping (uint8)
                                });
                                await pub!.waitForTransactionReceipt({ hash });

                                // persistimos el contador de sesión para Overview
                                const key = "dcr:pings";
                                const current = Number(localStorage.getItem(key) || "0");
                                localStorage.setItem(key, String(current + 1));

                                // avisar al tab actual
                                window.dispatchEvent(new CustomEvent("dcr:ping"));

                                alert("Ping sent ✅");
                              } catch (e: any) {
                                alert(e?.shortMessage || "Ping failed");
                              }
                            }}
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
            Live via events; later we’ll persist with the indexer (Plan B).
          </p>
        </div>
      </div>
    </div>
  );
}

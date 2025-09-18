"use client";

import { useMemo, useState } from "react";
import {
  useAccount,
  usePublicClient,
  useWriteContract,
  useReadContract,
  useWatchContractEvent,
  useChainId,
} from "wagmi";
import DashboardHeader from "@/components/DashboardHeader";
import { devlogAddress, devlogAbi } from "@/lib/devlog";
import toast from "react-hot-toast";
import { pushGasSample, bumpSessionPings, recordTxMeta } from "@/lib/session";


export default function MyContractsPage() {
  const { address: me } = useAccount();
  const chainId = useChainId();
  const pub = usePublicClient();
  const [form, setForm] = useState({ name: "", address: "" });
  

  // 🔑 IMPORTANTE: pasar `account: me` para que getMyContracts vea TU msg.sender
  const { data: myList, refetch } = useReadContract({
    address: devlogAddress,
    abi: devlogAbi,
    functionName: "getMyContracts",
    account: me as `0x${string}`,
    query: {
      enabled: !!me,
      staleTime: 300, // evita flicker
      refetchOnWindowFocus: true,
    },
  });

  const rows = useMemo(() => {
    if (!myList) return [];
    const [addrs, labels] = myList as [readonly `0x${string}`[], readonly string[]];
    return (addrs || []).map((a, i) => ({
      name: labels?.[i] || "Unnamed",
      address: a,
    }));
  }, [myList]);

  const { writeContractAsync, isPending } = useWriteContract();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim() || "Unnamed";
    const addr = form.address.trim() as `0x${string}`;
    if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) return alert("Invalid address");
    try {
      const hash = await writeContractAsync({
        address: devlogAddress,
        abi: devlogAbi,
        functionName: "registerMyContract",
        args: [name, addr],
      });
      // Espera confirmación y luego refresca on-chain
      const receipt = await pub!.waitForTransactionReceipt({ hash, timeout: 25_000 });
      pushGasSample(chainId, me as `0x${string}`, receipt.gasUsed);
      bumpSessionPings(chainId, me as `0x${string}`, 1);
      recordTxMeta(chainId, me as `0x${string}`, {
      txHash: hash,
      gasUsed: Number(receipt.gasUsed),
      type: "Register",
      contract: addr,
      at: Date.now(),
      });
      toast.success("Contract registered ✅");
      setForm({ name: "", address: "" });
      await refetch();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.shortMessage || "Register failed");
    }
  };

  // 👇 Watch SOLO nuevos eventos (sin backfill) para evitar rangos grandes
  useWatchContractEvent({
    address: devlogAddress,
    abi: devlogAbi,
    eventName: "ContractRegistered",
    poll: true,
    pollingInterval: 3000,
    strict: true, // <- clave: solo nuevos bloques, nada de buscar hacia atrás
    onLogs: () => refetch(),
    onError: (e) => console.warn("watch ContractRegistered error:", e),
  });

  const handlePing = async (addr: `0x${string}`) => {
    try {
      const hash = await writeContractAsync({
        address: devlogAddress,
        abi: devlogAbi,
        functionName: "ping",
        args: [addr, 0], // owner ping
      });
      await pub!.waitForTransactionReceipt({ hash, timeout: 25_000 });

      // contador de sesión para Overview (sessionStorage)
      const key = "dcr:pings";
      const current = Number(sessionStorage.getItem(key) || "0");
      sessionStorage.setItem(key, String(current + 1));
      window.dispatchEvent(new CustomEvent("dcr:ping"));

      const receipt = await pub!.waitForTransactionReceipt({ hash, timeout: 25_000 });
      pushGasSample(chainId, me as `0x${string}`, receipt.gasUsed);
      bumpSessionPings(chainId, me as `0x${string}`, 1);
      recordTxMeta(chainId, me as `0x${string}`, {
      txHash: hash,
      gasUsed: Number(receipt.gasUsed),
      type: "Ping",
      contract: addr,
      at: Date.now(),
    });

      toast.success("Ping sent ✅");
    } catch (e: any) {
      console.error(e);
      alert(e?.shortMessage || "Ping failed");
    }
  };

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

          <form onSubmit={handleRegister} className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1">
              <label className="text-sm text-pure/80">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                placeholder="My Contract"
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
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2 rounded-md font-medium bg-cyan text-space hover:brightness-110 disabled:opacity-50"
              >
                {isPending ? "Registering…" : "Register"}
              </button>
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
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-pure/50">
                      No contracts yet. Register one above.
                    </td>
                  </tr>
                ) : (
                  rows.map((r, i) => (
                    <tr key={i} className="border-t border-cyan/15">
                      <td className="py-2 pr-4">{r.name}</td>
                      <td className="py-2 pr-4 font-mono">{r.address}</td>
                      <td className="py-2 pr-4">
                        <button
                          className="px-3 py-1 rounded-md border border-cyan/30 hover:bg-white/5"
                          onClick={() => handlePing(r.address as `0x${string}`)}
                        >
                          Ping
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-pure/60 mt-3">
            Live via events; if RPC is slow, wait a few seconds or reopen the page.
          </p>
        </div>
      </div>
    </div>
  );
}

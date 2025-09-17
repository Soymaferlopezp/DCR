"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, usePublicClient, useWatchContractEvent, useWriteContract } from "wagmi";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardHeader from "@/components/DashboardHeader";
import { devlogAddress, devlogAbi } from "@/lib/devlog";

type PingRow = {
  txHash: `0x${string}`;
  dev: `0x${string}`;
  contractUsed: `0x${string}`;
  kind: number;
  blockNumber?: string;
  optimistic?: boolean;
};

export default function AnalyzePage() {
  const router = useRouter();
  const params = useSearchParams();

  const pub = usePublicClient();
  const { address: me } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();

  const [target, setTarget] = useState<string>(params.get("address") || "");
  const [listeningTo, setListeningTo] = useState<string>("");
  const [pings, setPings] = useState<PingRow[]>([]);
  const [rpcError, setRpcError] = useState<string>("");

  const isValid = /^0x[a-fA-F0-9]{40}$/.test(target.trim());

  useEffect(() => {
    const q = params.get("address") || "";
    setTarget(q);
    if (/^0x[a-fA-F0-9]{40}$/.test(q)) {
      setListeningTo(q);
      setPings([]); // limpia cuando cambia de address
    }
  }, [params]);

  // Watch en vivo (si el RPC cae, no bloquea la UI)
  useWatchContractEvent({
    address: devlogAddress,
    abi: devlogAbi,
    eventName: "DevPing",
    poll: true,
    pollingInterval: 3000,
    strict: true, // <- IMPORTANTE
    args: listeningTo ? { contractUsed: listeningTo as `0x${string}` } : undefined,
    onLogs: (logs: any[]) => {
      setRpcError("");
      if (!logs?.length) return;
      setPings((prev) => {
        const next = [...prev];
        for (const log of logs) {
          const txHash = log.transactionHash as `0x${string}`;
          if (next.find((r) => r.txHash === txHash)) continue;
          next.unshift({
            txHash,
            dev: log.args?.dev as `0x${string}`,
            contractUsed: log.args?.contractUsed as `0x${string}`,
            kind: Number(log.args?.kind ?? 0),
            blockNumber: log.blockNumber ? String(log.blockNumber) : undefined,
          });
        }
        return next.slice(0, 200);
      });
    },
    onError: () => setRpcError("RPC unavailable or slow. Retrying…"),
  });

  const handleLoad = () => {
    const t = target.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(t)) {
      alert("Invalid address. Use a 0x… (40 hex chars).");
      return;
    }
    const normalized = `0x${t.slice(2)}`;
    setListeningTo(normalized);
    setPings([]);
    setRpcError("");
    router.push(`/dashboard/analyze?address=${normalized}`);
  };

  // ✅ UI optimista: si el watcher falla por RPC, igual agregamos la fila tras la firma
  const sendPublicPing = async () => {
    try {
      setRpcError("");
      if (!listeningTo) {
        alert("Load a contract address first.");
        return;
      }
      const hash = await writeContractAsync({
        address: devlogAddress,
        abi: devlogAbi,
        functionName: "ping",
        args: [listeningTo as `0x${string}`, 1],
      });

      // Inserta optimista al instante
      setPings((prev) => [
        {
          txHash: hash,
          dev: (me || "0x") as `0x${string}`,
          contractUsed: listeningTo as `0x${string}`,
          kind: 1,
          optimistic: true,
        },
        ...prev,
      ]);

      // Espera receipt y completa blockNumber
      const receipt = await pub!.waitForTransactionReceipt({ hash, timeout: 30_000 });
      const bn = receipt.blockNumber ? String(receipt.blockNumber) : undefined;

      setPings((prev) =>
        prev.map((r) => (r.txHash === hash ? { ...r, optimistic: false, blockNumber: bn } : r))
      );

      alert("Public ping sent ✅");
    } catch (e: any) {
      const msg = String(e?.message || e?.shortMessage || "");
      if (/user denied|user rejected|rejected the request/i.test(msg)) {
        console.info("Tx cancelled by user");
        return;
      }
      if (/timed out/i.test(msg)) {
        setRpcError("Timed out waiting for confirmation. Check explorer.");
        return;
      }
      setRpcError("RPC error. Please retry.");
      console.error(e);
    }
  };

  // 🔄 Refresco manual (por si el watcher no anda)
const manualRefresh = async () => {
  try {
    if (!listeningTo) return;
    setRpcError("");

    const latest = await pub!.getBlockNumber(); // bigint
    const lookback = BigInt(300);               // <= ventana más chica (evita “range > 1000”)
    const from = latest - lookback;
    const safeFrom = from < BigInt(0) ? BigInt(0) : from;

    const logs = await pub!.getLogs({
      address: devlogAddress,
      event: {
        type: "event",
        name: "DevPing",
        inputs: [
          { name: "dev", type: "address", indexed: true },
          { name: "contractUsed", type: "address", indexed: true },
          { name: "kind", type: "uint8", indexed: false },
        ],
      } as any,
      args: { contractUsed: listeningTo as `0x${string}` },
      fromBlock: safeFrom,
      toBlock: latest,
    } as any);

    const rows: PingRow[] = logs
      .map((log: any) => ({
        txHash: log.transactionHash as `0x${string}`,
        dev: log.args?.dev as `0x${string}`,
        contractUsed: log.args?.contractUsed as `0x${string}`,
        kind: Number(log.args?.kind ?? 0),
        blockNumber: log.blockNumber ? String(log.blockNumber) : undefined,
      }))
      .reverse();

    setPings(rows);
  } catch (e: any) {
    console.error(e);
    setRpcError("RPC error on refresh. Try again later.");
  }
};

  const hint = useMemo(() => {
    if (!target) return "Paste a contract address.";
    if (!isValid) return "Invalid address. Use a 0x… (40 hex chars).";
    if (!listeningTo) return "Press Load to start listening.";
    if (pings.length === 0) return "No live pings yet. Try sending a Public Ping or press Refresh.";
    return "";
  }, [target, isValid, listeningTo, pings.length]);

  return (
    <div className="min-h-full">
      <DashboardHeader title="Analyze" />

      <div className="mx-auto max-w-6xl px-4 py-6 grid gap-6">
        {rpcError && (
          <div className="rounded-md border border-pink/40 bg-pink/10 px-3 py-2 text-sm text-pink">
            {rpcError}
          </div>
        )}

        <div className="rounded-lg border border-cyan/20 p-4">
          <h2 className="font-medium">Analyze a public contract</h2>
          <p className="text-sm text-pure/70 mt-1">
            Watch <code>DevPing</code> events for any address on Somnia testnet.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="0x0000…"
              className="bg-transparent border border-cyan/30 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-cyan/50 font-mono"
              onKeyDown={(e) => e.key === "Enter" && handleLoad()}
            />
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-md border border-cyan/30 hover:bg-white/5" onClick={handleLoad}>
                Load
              </button>
              <button
                className="px-4 py-2 rounded-md bg-cyan text-space hover:brightness-110 disabled:opacity-50"
                disabled={!listeningTo || isPending}
                onClick={sendPublicPing}
              >
                {isPending ? "Pinging…" : "Send Public Ping"}
              </button>
              <button
                className="px-4 py-2 rounded-md border border-cyan/30 hover:bg-white/5"
                onClick={manualRefresh}
                disabled={!listeningTo}
                title="Fetch last blocks"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2 text-xs">
            {listeningTo ? (
              <span className="px-2 py-1 rounded bg-white/5 border border-white/20 font-mono">
                Listening to {listeningTo.slice(0, 10)}…
              </span>
            ) : null}
            {hint && <span className="text-pure/60">{hint}</span>}
          </div>
        </div>

        <div className="rounded-lg border border-cyan/20 p-4">
          <h3 className="font-medium">Recent live pings</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-pure/70">
                <tr className="text-left">
                  <th className="py-2 pr-4">Tx</th>
                  <th className="py-2 pr-4">Dev</th>
                  <th className="py-2 pr-4">Contract</th>
                  <th className="py-2 pr-4">Kind</th>
                  <th className="py-2 pr-4">Block</th>
                </tr>
              </thead>
              <tbody>
                {pings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-pure/50">
                      No events yet.
                    </td>
                  </tr>
                ) : (
                  pings.map((r) => (
                    <tr key={r.txHash} className="border-t border-cyan/15">
                      <td className="py-2 pr-4 font-mono">
                        <a
                          className="hover:underline text-cyan"
                          href={`https://somnia-testnet.socialscan.io/tx/${r.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {r.txHash.slice(0, 10)}…
                        </a>
                        {r.optimistic && <span className="ml-2 text-xs text-pure/60">(pending)</span>}
                      </td>
                      <td className="py-2 pr-4 font-mono">{r.dev.slice(0, 8)}…</td>
                      <td className="py-2 pr-4 font-mono">{r.contractUsed.slice(0, 8)}…</td>
                      <td className="py-2 pr-4">
                        <span className="px-2 py-1 rounded bg-white/5 border border-white/20">
                          {r.kind === 0 ? "owner" : "public"}
                        </span>
                      </td>
                      <td className="py-2 pr-4">{r.blockNumber ?? "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-pure/60 mt-3">
            Live via events. If slow RPC, use Refresh.
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAccount, usePublicClient, useWatchContractEvent } from "wagmi";
import DashboardHeader from "@/components/DashboardHeader";
import { devlogAddress, devlogAbi } from "@/lib/devlog";
import toast from "react-hot-toast";
import {
  parseAbiItem,
  type AbiEvent,
  decodeEventLog,
  getEventSelector,
} from "viem";

type AlertRow = {
  txHash: `0x${string}`;
  event: "ContractRegistered" | "DevPing";
  dev: `0x${string}`;
  contract: `0x${string}`;
  blockNumber?: string;
};

// 1) Tomamos eventos del ABI real si están presentes (más fiable)
const ABI_EVT_CONTRACT_REGISTERED =
  (Array.isArray(devlogAbi)
    ? (devlogAbi as any[]).find(
        (x) => x?.type === "event" && x?.name === "ContractRegistered"
      )
    : null) as AbiEvent | null;

const ABI_EVT_DEV_PING =
  (Array.isArray(devlogAbi)
    ? (devlogAbi as any[]).find(
        (x) => x?.type === "event" && x?.name === "DevPing"
      )
    : null) as AbiEvent | null;

// 2) Fallbacks tipados (por si el ABI importado difiere en nombres)
const EVT_CONTRACT_REGISTERED_FALLBACK = parseAbiItem(
  "event ContractRegistered(address indexed dev, string name, address indexed contractAddress)"
);
const EVT_DEV_PING_FALLBACK = parseAbiItem(
  "event DevPing(address indexed dev, address indexed contractUsed, uint8 kind)"
);

const EVT_CONTRACT_REGISTERED =
  (ABI_EVT_CONTRACT_REGISTERED as AbiEvent) || EVT_CONTRACT_REGISTERED_FALLBACK;
const EVT_DEV_PING = (ABI_EVT_DEV_PING as AbiEvent) || EVT_DEV_PING_FALLBACK;

// 3) Precomputamos topic0 (hash) de ambos eventos para OR-filter
const TOPIC_CONTRACT_REGISTERED = getEventSelector(EVT_CONTRACT_REGISTERED);
const TOPIC_DEV_PING = getEventSelector(EVT_DEV_PING);

// Parámetros de refresco
const DEFAULT_LOOKBACK = 1536; // amplio para no perder registros recientes
const CHUNK_SIZE = 256;
const AUTO_REFRESH_MS = 12000;

export default function AlertsPage() {
  const { address: me } = useAccount();
  const pub = usePublicClient();

  const [rows, setRows] = useState<AlertRow[]>([]);
  const [rpcError, setRpcError] = useState("");
  const [auto, setAuto] = useState(true);
  const isRefreshing = useRef(false);

  // ─────────────────────────────────────────────────────────────────────────────
  // WATCHERS en vivo (solo NUEVOS bloques). Silenciosos (sin toast spam).
  useWatchContractEvent({
    address: devlogAddress,
    abi: devlogAbi,
    eventName: "ContractRegistered",
    poll: true,
    pollingInterval: 2500,
    strict: true,
    onLogs: (logs: any[]) => {
      if (!logs?.length) return;
      setRpcError("");
      setRows((prev) => {
        const next = [...prev];
        for (const log of logs) {
          const txHash = log.transactionHash as `0x${string}`;
          if (next.find((r) => r.txHash === txHash && r.event === "ContractRegistered")) continue;
          const a: any = log.args;
          next.unshift({
            txHash,
            event: "ContractRegistered",
            dev: (a?.dev ?? a?.[0]) as `0x${string}`,
            contract: (a?.contractAddress ?? a?.[2]) as `0x${string}`,
            blockNumber: log.blockNumber ? String(log.blockNumber) : undefined,
          });
        }
        return next.slice(0, 500);
      });
    },
    onError: () => setRpcError("RPC unavailable or slow. Retrying…"),
  });

  useWatchContractEvent({
    address: devlogAddress,
    abi: devlogAbi,
    eventName: "DevPing",
    poll: true,
    pollingInterval: 2500,
    strict: true,
    onLogs: (logs: any[]) => {
      if (!logs?.length) return;
      setRpcError("");
      setRows((prev) => {
        const next = [...prev];
        for (const log of logs) {
          const txHash = log.transactionHash as `0x${string}`;
          if (next.find((r) => r.txHash === txHash && r.event === "DevPing")) continue;
          const a: any = log.args;
          next.unshift({
            txHash,
            event: "DevPing",
            dev: (a?.dev ?? a?.[0]) as `0x${string}`,
            contract: (a?.contractUsed ?? a?.[1]) as `0x${string}`,
            blockNumber: log.blockNumber ? String(log.blockNumber) : undefined,
          });
        }
        return next.slice(0, 500);
      });
    },
    onError: () => setRpcError("RPC unavailable or slow. Retrying…"),
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // REFRESH por chunks, filtrando por topics (OR) y decodificando cada log
  const refresh = async (lookbackBlocks = DEFAULT_LOOKBACK, silent = true) => {
    if (isRefreshing.current) return;
    isRefreshing.current = true;
    try {
      setRpcError("");
      const latest = await pub!.getBlockNumber();
      const to = latest;
      const from = to - BigInt(lookbackBlocks);
      const safeFrom = from < BigInt(0) ? BigInt(0) : from;

      const CHUNK = BigInt(CHUNK_SIZE);
      const batches: Array<{ from: bigint; to: bigint }> = [];
      for (let start = safeFrom; start <= to; start += CHUNK) {
        const end = start + CHUNK - BigInt(1);
        batches.push({ from: start, to: end > to ? to : end });
      }

      const aggregated: AlertRow[] = [];
      for (const batch of batches) {
        // Traemos logs crudos de ambos eventos (topic0 OR)
        const logs = await pub!.getLogs({
          address: devlogAddress,
          fromBlock: batch.from,
          toBlock: batch.to,
          // topic0: cualquiera de los dos
          topics: [[TOPIC_CONTRACT_REGISTERED, TOPIC_DEV_PING]],
        } as any);

        for (const l of logs) {
          try {
            // Asegura que haya topic0
            const topic0 = (l.topics?.[0] ?? null) as `0x${string}` | null;
            if (!topic0) continue;

            // Convierte topics a la tupla que decodeEventLog espera:
            const topicsTuple = l.topics as unknown as [
              signature: `0x${string}`,
              ...args: `0x${string}`[]
            ];

            if (topic0 === TOPIC_CONTRACT_REGISTERED) {
              // Decodifica SOLO con el evento correspondiente (evita unions raros)
              const { args } = decodeEventLog({
                abi: [EVT_CONTRACT_REGISTERED] as any,
                data: l.data as `0x${string}`,
                topics: topicsTuple,
              }) as { args: any };

              aggregated.push({
                txHash: l.transactionHash as `0x${string}`,
                event: "ContractRegistered",
                dev: (args?.dev ?? args?.[0]) as `0x${string}`,
                contract: (args?.contractAddress ?? args?.[2]) as `0x${string}`,
                blockNumber: l.blockNumber ? String(l.blockNumber) : undefined,
              });
            } else if (topic0 === TOPIC_DEV_PING) {
              const { args } = decodeEventLog({
                abi: [EVT_DEV_PING] as any,
                data: l.data as `0x${string}`,
                topics: topicsTuple,
              }) as { args: any };

              aggregated.push({
                txHash: l.transactionHash as `0x${string}`,
                event: "DevPing",
                dev: (args?.dev ?? args?.[0]) as `0x${string}`,
                contract: (args?.contractUsed ?? args?.[1]) as `0x${string}`,
                blockNumber: l.blockNumber ? String(l.blockNumber) : undefined,
              });
            }
          } catch {
            // Si no decodifica, lo ignoramos (puede ser otro evento del contrato)
          }
        }

      }

      // Ordena y deduplica
      aggregated.sort((a, b) => Number(b.blockNumber || 0) - Number(a.blockNumber || 0));
      const uniq = new Map<string, AlertRow>();
      for (const r of aggregated) uniq.set(`${r.txHash}-${r.event}`, r);

      setRows((prev) => {
        const merged = [...Array.from(uniq.values()), ...prev];
        const uniq2 = new Map<string, AlertRow>();
        for (const r of merged) uniq2.set(`${r.txHash}-${r.event}`, r);
        return Array.from(uniq2.values()).slice(0, 600);
      });

      if (!silent) toast.success("Alerts refreshed");
    } catch (e) {
      console.error(e);
      setRpcError("RPC error on refresh. Try again later.");
      if (!silent) toast.error("RPC error on refresh");
    } finally {
      isRefreshing.current = false;
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Seed inicial + auto-refresh (silencioso). Sin toasts repetitivos.
  useEffect(() => {
    // Seed silencioso (no toast): carga histórico al abrir
    refresh(1024, true);
    const onFocus = () => refresh(640, true);
    const onVis = () => document.visibilityState === "visible" && refresh(640, true);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    const id = setInterval(() => auto && refresh(512, true), AUTO_REFRESH_MS);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto]);

  const subtitle = useMemo(() => {
    if (!me) return "Live events across Somnia DevLog. Connect wallet for owner context.";
    return "Live events across Somnia DevLog.";
  }, [me]);

  return (
    <div className="min-h-full">
      <DashboardHeader title="Alerts" />
      <div className="mx-auto max-w-6xl px-4 py-6 grid gap-6">
        {rpcError && (
          <div className="rounded-md border border-pink/40 bg-pink/10 px-3 py-2 text-sm text-pink">
            {rpcError}
          </div>
        )}

        <div className="rounded-lg border border-cyan/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-medium">On-chain alerts</h2>
              <p className="text-sm text-pure/70">{subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-2 rounded-md border border-cyan/30 hover:bg-white/5"
                onClick={() => refresh(DEFAULT_LOOKBACK, false)}
                title={`Fetch last ~${DEFAULT_LOOKBACK} blocks in chunks`}
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-pure/70">
                <tr className="text-left">
                  <th className="py-2 pr-4">Tx</th>
                  <th className="py-2 pr-4">Event</th>
                  <th className="py-2 pr-4">Dev</th>
                  <th className="py-2 pr-4">Contract</th>
                  <th className="py-2 pr-4">Block</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-pure/50">
                      No alerts yet. Try Refresh.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.txHash + r.event} className="border-t border-cyan/15">
                      <td className="py-2 pr-4 font-mono">
                        <a
                          className="hover:underline text-cyan"
                          href={`https://dream-rpc.somnia.network/tx/${r.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {r.txHash.slice(0, 10)}…
                        </a>
                      </td>
                      <td className="py-2 pr-4">
                        <span
                          className={`px-2 py-1 rounded border ${
                            r.event === "DevPing"
                              ? "border-cyan/40 bg-cyan/10"
                              : "border-white/20 bg-white/5"
                          }`}
                        >
                          {r.event}
                        </span>
                      </td>
                      <td className="py-2 pr-4 font-mono">{r.dev.slice(0, 10)}…</td>
                      <td className="py-2 pr-4 font-mono">{r.contract.slice(0, 10)}…</td>
                      <td className="py-2 pr-4">{r.blockNumber ?? "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-pure/60 mt-3">
            Live watch + chunked refresh (silent). Use Refresh for a manual update.
          </p>
        </div>
      </div>
    </div>
  );
}

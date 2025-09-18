"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useReadContract,
} from "wagmi";
import DashboardHeader from "@/components/DashboardHeader";
import { loadSession, getSessionAvgGas, getRecentTxMeta, TxMeta } from "@/lib/session";

import dynamic from "next/dynamic";
const OverviewChart = dynamic(() => import("@/components/OverviewChart"), { ssr: false });
const GasChart = dynamic(() => import("@/components/GasChart"), { ssr: false });

import { devlogAddress, devlogAbi } from "@/lib/devlog";
import {
  getEventSelector,
  parseAbiItem,
  decodeEventLog,
  type Log,
} from "viem";

// ───────────────────────────────────────────────────────────────────────────────
type Row = {
  txHash: `0x${string}`;
  type: "Ping" | "Register";
  dev: `0x${string}`;
  contract: `0x${string}`;
  kind?: number;
  blockNumber?: number;
};

type OverviewPoint = {
  block: number;
  pings: number;
  registers: number;
  total: number;
};

const EVT_PING = parseAbiItem(
  "event DevPing(address indexed dev, address indexed contractUsed, uint8 kind)"
);
const EVT_REGISTER = parseAbiItem(
  "event ContractRegistered(address indexed dev, string name, address indexed contractAddress)"
);
const TOPIC_PING = getEventSelector(EVT_PING);
const TOPIC_REGISTER = getEventSelector(EVT_REGISTER);

// ───────────────────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const { address: me } = useAccount();
  const chainId = useChainId();
  const pub = usePublicClient();

  // KPIs sesión
  const [pingsSession, setPingsSession] = useState(0);
  const [avgGas, setAvgGas] = useState<number | null>(null);

  // Histórico
  const [points, setPoints] = useState<OverviewPoint[]>([]);
  const [feed, setFeed] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  // Gas por tx (sesión)
  const [txGas, setTxGas] = useState<TxMeta[]>([]);

  // Registered (total) del usuario actual
  const { data: myList } = useReadContract({
    address: devlogAddress,
    abi: devlogAbi,
    functionName: "getMyContracts",
    account: me as `0x${string}` | undefined,
    query: { enabled: !!me, staleTime: 5_000, refetchOnWindowFocus: true },
  });

  const registeredTotal = useMemo(() => {
    if (!myList) return 0;
    const [addrs] = myList as [readonly `0x${string}`[], readonly string[]];
    return (addrs?.length ?? 0);
  }, [myList]);

  // KPIs de sesión
  useEffect(() => {
    const s = loadSession(chainId, me as `0x${string}` | undefined);
    setPingsSession(s.pings);
    setAvgGas(getSessionAvgGas(chainId, me as `0x${string}` | undefined));
    setTxGas(getRecentTxMeta(chainId, me as `0x${string}` | undefined, 50));
  }, [me, chainId]);

  useEffect(() => {
    const onChange = () => {
      const s = loadSession(chainId, me as `0x${string}` | undefined);
      setPingsSession(s.pings);
      setAvgGas(getSessionAvgGas(chainId, me as `0x${string}` | undefined));
      setTxGas(getRecentTxMeta(chainId, me as `0x${string}` | undefined, 50));
    };
    window.addEventListener("dcr:session:changed", onChange);
    window.addEventListener("dcr:ping", onChange);
    window.addEventListener("dcr:txmeta", onChange);
    return () => {
      window.removeEventListener("dcr:session:changed", onChange);
      window.removeEventListener("dcr:ping", onChange);
      window.removeEventListener("dcr:txmeta", onChange);
    };
  }, [me, chainId]);

  // Logs recientes para actividad (pings + registros)
  const refreshHistory = async (lookbackBlocks = 640, chunkSize = 160) => {
    if (!pub) return;
    setLoading(true);
    try {
      const latest = await pub.getBlockNumber();

      const ZERO = BigInt(0);
      const ONE = BigInt(1);
      const from =
        latest > BigInt(lookbackBlocks) ? latest - BigInt(lookbackBlocks) : ZERO;
      const CHUNK = BigInt(chunkSize);

      const batches: Array<{ from: bigint; to: bigint }> = [];
      for (let start = from; start <= latest; start += CHUNK) {
        const end = start + CHUNK - ONE;
        batches.push({ from: start, to: end > latest ? latest : end });
      }

      const rows: Row[] = [];

      for (const b of batches) {
        const logs = await pub.getLogs({
          address: devlogAddress,
          fromBlock: b.from,
          toBlock: b.to,
          topics: [[TOPIC_PING, TOPIC_REGISTER]],
        } as any);

        for (const l of logs as Log[]) {
          const topic0 = l.topics?.[0] as `0x${string}` | undefined;
          if (!topic0) continue;

          if (topic0 === TOPIC_PING) {
            try {
              const { args } = decodeEventLog({
                abi: [EVT_PING] as any,
                data: l.data as `0x${string}`,
                topics: l.topics as [`0x${string}`, ...`0x${string}`[]],
              }) as { args: any };

              rows.push({
                txHash: l.transactionHash as `0x${string}`,
                type: "Ping",
                dev: (args?.dev ?? args?.[0]) as `0x${string}`,
                contract: (args?.contractUsed ?? args?.[1]) as `0x${string}`,
                kind: Number(args?.kind ?? 0),
                blockNumber: l.blockNumber ? Number(l.blockNumber) : undefined,
              });
            } catch {
              // ignore
            }
          } else if (topic0 === TOPIC_REGISTER) {
            // Solo indexados: dev y contract
            rows.push({
              txHash: l.transactionHash as `0x${string}`,
              type: "Register",
              dev: (l.topics?.[1] as `0x${string}`) || "0x",
              contract: (l.topics?.[2] as `0x${string}`) || "0x",
              blockNumber: l.blockNumber ? Number(l.blockNumber) : undefined,
            });
          }
        }
      }

      // Gráfica por bloque
      const byBlock = new Map<number, { pings: number; registers: number }>();
      for (const r of rows) {
        const b = r.blockNumber ?? 0;
        const slot = byBlock.get(b) ?? { pings: 0, registers: 0 };
        if (r.type === "Ping") slot.pings += 1;
        else slot.registers += 1;
        byBlock.set(b, slot);
      }

      const pointsSorted: OverviewPoint[] = Array.from(byBlock.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([block, v]) => ({
          block,
          pings: v.pings,
          registers: v.registers,
          total: v.pings + v.registers,
        }));

      const feedSorted = rows
        .sort((a, b) => (b.blockNumber ?? 0) - (a.blockNumber ?? 0))
        .slice(0, 30);

      setPoints(pointsSorted);
      setFeed(feedSorted);
    } catch (e) {
      console.error("[DCR][Overview] history error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshHistory();
    const onFocus = () => refreshHistory(480, 160);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pub]);

  const activeLabel = useMemo(() => "Active (session)", []);

  // Gas chart data (orden cronológico, antiguo → reciente)
  const gasSeries = useMemo(
    () =>
      [...txGas]
        .reverse()
        .map((m, i) => ({ i, gas: m.gasUsed }))
        .slice(-50),
    [txGas]
  );

  // Mapa para lookup rápido de gas por tx en la tabla
  const gasByTx = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of txGas) map.set(m.txHash.toLowerCase(), m.gasUsed);
    return map;
  }, [txGas]);

  return (
    <div className="min-h-full">
      <DashboardHeader title="Overview" />
      <div className="mx-auto max-w-6xl px-4 py-6 grid gap-6">

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border border-cyan/20 p-4">
            <p className="text-sm text-pure/70">Registered (total)</p>
            <p className="text-3xl font-bold">{registeredTotal}</p>
          </div>
          <div className="rounded-lg border border-cyan/20 p-4">
            <p className="text-sm text-pure/70">{activeLabel}</p>
            <p className="text-3xl font-bold">{pingsSession}</p>
          </div>
          <div className="rounded-lg border border-cyan/20 p-4">
            <p className="text-sm text-pure/70">Avg Gas (session)</p>
            <p className="text-3xl font-bold">
              {avgGas == null ? "—" : avgGas.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Gráfica de actividad */}
        <div className="rounded-lg border border-cyan/20 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Activity (by block)</h2>
            <button
              className="px-3 py-2 rounded-md border border-cyan/30 hover:bg-white/5 text-sm"
              onClick={() => refreshHistory()}
              disabled={loading}
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          {points.length === 0 ? (
            <div className="mt-3 h-64 grid place-items-center text-sm text-pure/60">
              No data in the current window.
            </div>
          ) : (
            <div className="mt-3">
              <OverviewChart data={points} />
            </div>
          )}
        </div>

        {/* Gráfica de gas por tx (sesión) */}
        <div className="rounded-lg border border-cyan/20 p-4">
          <h3 className="font-medium">Gas per tx (session)</h3>
          <div className="mt-2">
            <GasChart data={gasSeries} />
          </div>
          <p className="text-xs text-pure/60 mt-2">
            Shows last ~50 confirmed transactions you sent (Register / Ping). Values are local to your session.
          </p>
        </div>

        {/* Feed mixto con columna Gas (si disponible) */}
        <div className="rounded-lg border border-cyan/20 p-4">
          <h3 className="font-medium">Activity feed (recent)</h3>
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-sm">
              <thead className="text-pure/70">
                <tr className="text-left">
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Tx</th>
                  <th className="py-2 pr-4">Dev</th>
                  <th className="py-2 pr-4">Contract</th>
                  <th className="py-2 pr-4">Block</th>
                  <th className="py-2 pr-4">Gas</th>
                  <th className="py-2 pr-4">Kind</th>
                </tr>
              </thead>
              <tbody>
                {feed.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-pure/50">
                      No recent activity in the selected window.
                    </td>
                  </tr>
                ) : (
                  feed.map((r) => {
                    const gas = gasByTx.get(r.txHash.toLowerCase());
                    return (
                      <tr key={r.txHash + r.type} className="border-t border-cyan/15">
                        <td className="py-2 pr-4">
                          <span
                            className={`px-2 py-1 rounded border ${
                              r.type === "Ping"
                                ? "border-cyan/40 bg-cyan/10"
                                : "border-white/20 bg-white/5"
                            }`}
                          >
                            {r.type}
                          </span>
                        </td>
                        <td className="py-2 pr-4 font-mono">
                          <a
                            className="hover:underline text-cyan"
                            href={`https://somnia-testnet.socialscan.io/tx/${r.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {r.txHash.slice(0, 10)}…
                          </a>
                        </td>
                        <td className="py-2 pr-4 font-mono">{r.dev.slice(0, 10)}…</td>
                        <td className="py-2 pr-4 font-mono">{r.contract.slice(0, 10)}…</td>
                        <td className="py-2 pr-4">{r.blockNumber ?? "—"}</td>
                        <td className="py-2 pr-4">{gas == null ? "—" : gas.toLocaleString()}</td>
                        <td className="py-2 pr-4">{r.type === "Ping" ? (r.kind === 0 ? "owner" : "public") : "—"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-pure/60 mt-2">
            Feed shows recent on-chain activity (Pings & Registers). “Gas” appears for your own recent transactions.
          </p>
        </div>
      </div>
    </div>
  );
}




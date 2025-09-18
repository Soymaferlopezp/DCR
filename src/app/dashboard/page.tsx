"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useReadContract, useWatchContractEvent } from "wagmi";
import { devlogAddress, devlogAbi } from "@/lib/devlog";
import DashboardHeader from "@/components/DashboardHeader";
import { readGasSamples } from "@/lib/session";

export default function DashboardHome() {
  const { address: me, isConnected } = useAccount();

  const [gasSamples, setGasSamples] = useState<number[]>([]);

  useEffect(() => {
    const load = () => setGasSamples(readGasSamples());
    load(); // inicial
    window.addEventListener("dcr:ping", load);
    return () => window.removeEventListener("dcr:ping", load);
  }, []);

  const avgGas = useMemo(() => {
    if (!gasSamples.length) return null;
    const sum = gasSamples.reduce((a, b) => a + b, 0);
    return Math.round(sum / gasSamples.length);
  }, [gasSamples]);


  const { data: myList } = useReadContract({
    address: devlogAddress,
    abi: devlogAbi,
    functionName: "getMyContracts",
    account: me as `0x${string}`,
    query: { enabled: !!me, staleTime: 1_000, refetchOnWindowFocus: true },
  });
  const registeredCount = isConnected && myList ? ((myList[0] as string[]) || []).length : 0;

  const KEY = "dcr:pings";
  const [sessionPings, setSessionPings] = useState(0);

  useEffect(() => {
    setSessionPings(Number(sessionStorage.getItem(KEY) || "0"));
  }, []);

  useWatchContractEvent({
    address: devlogAddress,
    abi: devlogAbi,
    eventName: "DevPing",
    poll: true,
    pollingInterval: 2000,
    strict: false,
    onLogs: (logs: any[]) => {
      if (!logs?.length) return;
      setSessionPings((n) => {
        const next = n + logs.length;
        sessionStorage.setItem(KEY, String(next));
        return next;
      });
    },
  });

  useEffect(() => {
    const bump = () => setSessionPings(Number(sessionStorage.getItem(KEY) || "0"));
    window.addEventListener("dcr:ping", bump);
    return () => window.removeEventListener("dcr:ping", bump);
  }, []);

  return (
    <div className="min-h-full">
      <DashboardHeader title="Overview" />
      <div className="mx-auto max-w-6xl px-4 py-6 grid gap-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-cyan/20 p-4">
            <p className="text-xs text-pure/60">Registered</p>
            <p className="text-2xl font-bold">{isConnected ? registeredCount : "-"}</p>
          </div>
          <div className="rounded-lg border border-cyan/20 p-4">
            <p className="text-xs text-pure/60">Active (session)</p>
            <p className="text-2xl font-bold">{sessionPings}</p>
          </div>
          <div className="rounded-lg border border-cyan/20 p-4">
            <p className="text-xs text-pure/60">Avg Gas</p>
            <p className="text-2xl font-bold">{avgGas ? avgGas.toLocaleString() : "—"}</p>
          </div>
        </div>
        <div className="h-64 rounded-lg border border-cyan/20 grid place-items-center text-pure/50 text-sm">
          Activity timeline (soon)
        </div>
      </div>
    </div>
  );
}



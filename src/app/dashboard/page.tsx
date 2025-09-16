"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWatchContractEvent } from "wagmi";
import { useRouter } from "next/navigation";
import { devlogAddress, devlogAbi } from "@/lib/devlog";
import DashboardHeader from "@/components/DashboardHeader";

export default function DashboardHome() {
  const router = useRouter();
  const { address: me, isConnected } = useAccount();

  // Guard: si no hay wallet conectada, volver al landing
  useEffect(() => {
    if (!isConnected) {
      router.push("/");
    }
  }, [isConnected, router]);

  // Registered (getMyContracts depende de msg.sender)
  const { data: myList } = useReadContract({
    address: devlogAddress,
    abi: devlogAbi,
    functionName: "getMyContracts",
    account: me as `0x${string}`,
    query: { enabled: !!me }
  });
  const registeredCount = myList ? (myList[0] as string[]).length : 0;

  // Active (session)
  const [sessionPings, setSessionPings] = useState(0);

  // 1) Al montar, lee contador persistido en la sesión
  useEffect(() => {
    const key = "dcr:pings";
    const current = Number(localStorage.getItem(key) || "0");
    setSessionPings(current);
  }, []);

  // 2) Watcher on-chain para sumar en vivo si te quedas en Overview
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
        localStorage.setItem("dcr:pings", String(next));
        return next;
      });
    },
    onError: (e) => console.error("watch DevPing error:", e)
  });

  // 3) Evento local (mismo tab) para refrescar al volver desde Contracts
  useEffect(() => {
    const bump = () => {
      const v = Number(localStorage.getItem("dcr:pings") || "0");
      setSessionPings(v);
    };
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
            <p className="text-2xl font-bold">{isConnected ? registeredCount : "—"}</p>
          </div>
          <div className="rounded-lg border border-cyan/20 p-4">
            <p className="text-xs text-pure/60">Active (session)</p>
            <p className="text-2xl font-bold">{sessionPings}</p>
          </div>
          <div className="rounded-lg border border-cyan/20 p-4">
            <p className="text-xs text-pure/60">Avg Gas</p>
            <p className="text-2xl font-bold">—</p>
            <p className="text-xs text-pure/50 mt-1">(Plan B)</p>
          </div>
        </div>

        <div className="h-64 rounded-lg border border-cyan/20 grid place-items-center text-pure/50 text-sm">
          Activity timeline (soon)
        </div>
      </div>
    </div>
  );
}


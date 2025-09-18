"use client";

import { useEffect, useState } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import toast from "react-hot-toast";
import { usePublicClient } from "wagmi";

type Prefs = {
  toasts: boolean;
  sound: boolean;
  autoRefreshAlerts: boolean;
};

const PREFS_KEY = "dcr:prefs";

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { toasts: true, sound: false, autoRefreshAlerts: true };
    const p = JSON.parse(raw);
    return {
      toasts: p.toasts ?? true,
      sound: p.sound ?? false,
      autoRefreshAlerts: p.autoRefreshAlerts ?? true,
    };
  } catch {
    return { toasts: true, sound: false, autoRefreshAlerts: true };
  }
}

export default function SettingsPage() {
  const pub = usePublicClient();
  const [prefs, setPrefs] = useState<Prefs>({ toasts: true, sound: false, autoRefreshAlerts: true });

  useEffect(() => {
    setPrefs(loadPrefs());
  }, []);

  const save = (next: Partial<Prefs>) => {
    const merged = { ...prefs, ...next };
    setPrefs(merged);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(merged));
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    }
  };

  const clearSession = () => {
    try {
      sessionStorage.removeItem("dcr:gas");
      sessionStorage.removeItem("dcr:pings");
      window.dispatchEvent(new CustomEvent("dcr:ping"));
      toast.success("Session metrics cleared");
    } catch {
      toast.error("Failed to clear session");
    }
  };

  const copyRPC = async () => {
    try {
      const rpc =
        process.env.NEXT_PUBLIC_SOMNIA_RPC_URL ||
        "https://dream-rpc.somnia.network/";
      await navigator.clipboard.writeText(rpc);
      toast.success("RPC copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  const checkRPC = async () => {
    try {
      const block = await pub!.getBlockNumber();
      toast.success(`RPC OK. Latest block: ${block.toString()}`);
    } catch (e) {
      console.error(e);
      toast.error("RPC error");
    }
  };

  return (
    <div className="min-h-full">
      <DashboardHeader title="Settings" />
      <div className="mx-auto max-w-4xl px-4 py-6 grid gap-6">
        <div className="rounded-lg border border-cyan/20 p-4">
          <h2 className="font-medium">Preferences</h2>
          <p className="text-sm text-pure/70 mt-1">These are stored locally on this device.</p>

          <div className="mt-4 grid gap-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={prefs.toasts}
                onChange={(e) => save({ toasts: e.target.checked })}
              />
              <span>Enable toasts</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={prefs.sound}
                onChange={(e) => save({ sound: e.target.checked })}
              />
              <span>Sound on alerts (coming soon)</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={prefs.autoRefreshAlerts}
                onChange={(e) => save({ autoRefreshAlerts: e.target.checked })}
              />
              <span>Auto-refresh alerts (live)</span>
            </label>
          </div>
        </div>

        <div className="rounded-lg border border-cyan/20 p-4">
          <h2 className="font-medium">Session tools</h2>
          <p className="text-sm text-pure/70 mt-1">Manage temporary metrics and connection.</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="px-4 py-2 rounded-md border border-cyan/30 hover:bg-white/5"
              onClick={clearSession}
            >
              Clear session metrics
            </button>

            <button
              className="px-4 py-2 rounded-md border border-cyan/30 hover:bg-white/5"
              onClick={copyRPC}
            >
              Copy current RPC
            </button>

            <button
              className="px-4 py-2 rounded-md bg-cyan text-space hover:brightness-110"
              onClick={checkRPC}
            >
              Check RPC status
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-cyan/20 p-4">
          <h2 className="font-medium">About</h2>
          <p className="text-sm text-pure/70 mt-1">
            DCR — Dev Control Room • Somnia testnet. Preferences are stored via localStorage; session metrics (gas, ping count) via sessionStorage.
          </p>
        </div>
      </div>
    </div>
  );
}

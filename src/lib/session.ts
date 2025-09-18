export type SessionState = {
  startedAt: number;     // ms epoch
  pings: number;         // contador de pings en la sesión
  gasSamples: number[];  // gas usados (number) para promedio
};

const LEGACY_KEY = "dcr:session"; // compat viejo (sin scope)

function scopedKey(chainId?: number, address?: `0x${string}`) {
  const a = (address || "0x").toLowerCase();
  const c = chainId ?? 0;
  return `dcr:session:${c}:${a}`;
}

function readJSON<T>(k: string): T | null {
  try {
    const raw = typeof window !== "undefined" ? sessionStorage.getItem(k) : null;
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJSON<T>(k: string, v: T | null) {
  try {
    if (typeof window === "undefined") return;
    if (v == null) sessionStorage.removeItem(k);
    else sessionStorage.setItem(k, JSON.stringify(v));
  } catch {
    // noop
  }
}

function fresh(): SessionState {
  return { startedAt: Date.now(), pings: 0, gasSamples: [] };
}

// MIGRACIÓN: si no hay scoped o está “vacío”, pero hay legacy con datos → copia
function migrateFromLegacyIfNeeded(chainId?: number, address?: `0x${string}`) {
  const sk = scopedKey(chainId, address);
  const scoped = readJSON<SessionState>(sk);
  const legacy = readJSON<SessionState>(LEGACY_KEY);

  const scopedEmpty =
    !scoped || (scoped.pings === 0 && (!scoped.gasSamples || scoped.gasSamples.length === 0));

  if (scopedEmpty && legacy) {
    writeJSON(sk, legacy);
    // NO borramos legacy para que otras páginas viejas sigan funcionando
  }
}

export function loadSession(chainId?: number, address?: `0x${string}`): SessionState {
  migrateFromLegacyIfNeeded(chainId, address);
  const sk = scopedKey(chainId, address);
  const s = readJSON<SessionState>(sk);
  if (!s) {
    const f = fresh();
    writeJSON(sk, f);
    return f;
  }
  return {
    startedAt: typeof s.startedAt === "number" ? s.startedAt : Date.now(),
    pings: typeof s.pings === "number" ? s.pings : 0,
    gasSamples: Array.isArray(s.gasSamples) ? s.gasSamples.map((n) => Number(n) || 0) : [],
  };
}

export function saveSession(
  chainId?: number,
  address?: `0x${string}`,
  state?: SessionState | null
) {
  const sk = scopedKey(chainId, address);
  writeJSON(sk, state ?? null);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("dcr:session:changed"));
  }
}

export function resetSession(chainId?: number, address?: `0x${string}`) {
  saveSession(chainId, address, fresh());
}

export function bumpSessionPings(
  chainId?: number,
  address?: `0x${string}`,
  delta = 1
) {
  // SCOPED
  const s = loadSession(chainId, address);
  s.pings = Math.max(0, s.pings + delta);
  saveSession(chainId, address, s);

  // LEGACY (compat)
  const legacy = readJSON<SessionState>(LEGACY_KEY) ?? fresh();
  legacy.pings = Math.max(0, legacy.pings + delta);
  writeJSON(LEGACY_KEY, legacy);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("dcr:session:changed"));
    window.dispatchEvent(new CustomEvent("dcr:ping"));
  }
}

export function pushGasSample(
  chainId?: number,
  address?: `0x${string}`,
  gasUsed?: bigint
) {
  if (gasUsed == null) return;

  const asNumber = Number(gasUsed);
  if (!Number.isFinite(asNumber)) return;

  // SCOPED
  const s = loadSession(chainId, address);
  s.gasSamples.push(asNumber);
  if (s.gasSamples.length > 200) s.gasSamples = s.gasSamples.slice(-200);
  saveSession(chainId, address, s);

  // LEGACY (compat)
  const legacy = readJSON<SessionState>(LEGACY_KEY) ?? fresh();
  legacy.gasSamples.push(asNumber);
  if (legacy.gasSamples.length > 200) legacy.gasSamples = legacy.gasSamples.slice(-200);
  writeJSON(LEGACY_KEY, legacy);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("dcr:session:changed"));
  }
}

export function getSessionAvgGas(
  chainId?: number,
  address?: `0x${string}`
): number | null {
  migrateFromLegacyIfNeeded(chainId, address);
  const s = loadSession(chainId, address);
  if (s.gasSamples.length === 0) return null;
  const sum = s.gasSamples.reduce((acc, n) => acc + n, 0);
  return Math.round(sum / s.gasSamples.length);
}

// ─────────────────────────────────────────────────────────────────────────────
// TX META (gas por tx) scoped por chainId+address (sesión del dev)
// Guardamos un feed ligero: máx 200 entradas recientes

export type TxMeta = {
  txHash: `0x${string}`;
  gasUsed: number; // en unidades de gas (Number para UI)
  type: "Ping" | "Register";
  contract?: `0x${string}`;
  at: number; // ms epoch
};

function gasKey(chainId?: number, address?: `0x${string}`) {
  const a = (address || "0x").toLowerCase();
  const c = chainId ?? 0;
  return `dcr:txmeta:${c}:${a}`;
}

export function recordTxMeta(
  chainId?: number,
  address?: `0x${string}`,
  meta?: TxMeta
) {
  if (!meta) return;
  try {
    const k = gasKey(chainId, address);
    const raw = typeof window !== "undefined" ? sessionStorage.getItem(k) : null;
    const arr: TxMeta[] = raw ? (JSON.parse(raw) as TxMeta[]) : [];
    // dedupe por txHash (keep newest first)
    const filtered = arr.filter((m) => m.txHash !== meta.txHash);
    const next = [meta, ...filtered].slice(0, 200);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(k, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent("dcr:session:changed"));
      window.dispatchEvent(new CustomEvent("dcr:txmeta"));
    }
  } catch {
    // noop
  }
}

export function getRecentTxMeta(
  chainId?: number,
  address?: `0x${string}`,
  limit = 50
): TxMeta[] {
  try {
    const k = gasKey(chainId, address);
    const raw = typeof window !== "undefined" ? sessionStorage.getItem(k) : null;
    const arr: TxMeta[] = raw ? (JSON.parse(raw) as TxMeta[]) : [];
    return arr.slice(0, limit);
  } catch {
    return [];
  }
}
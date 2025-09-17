export function pushGasSample(gasUsed?: bigint) {
  if (gasUsed == null) return;
  try {
    const key = "dcr:gas";
    const prev = JSON.parse(sessionStorage.getItem(key) || "[]");
    const next = [Number(gasUsed), ...prev].slice(0, 50);
    sessionStorage.setItem(key, JSON.stringify(next));
    // notifica a Overview
    window.dispatchEvent(new CustomEvent("dcr:ping"));
  } catch {}
}

export function bumpSessionPings(delta = 1) {
  const key = "dcr:pings";
  const current = Number(sessionStorage.getItem(key) || "0");
  sessionStorage.setItem(key, String(current + delta));
  window.dispatchEvent(new CustomEvent("dcr:ping"));
}

export function readGasSamples(): number[] {
  try {
    const arr = JSON.parse(sessionStorage.getItem("dcr:gas") || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

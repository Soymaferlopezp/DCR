export default function DashboardHome() {
  return (
    <div className="min-h-full">
      {/* Header superior del panel derecho */}
      <header className="sticky top-0 z-10 bg-space/80 backdrop-blur border-b border-cyan/20">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Overview</h1>
          {/* Aquí luego va el estado de conexión / address */}
          <div className="text-xs text-pure/70">Session: connected</div>
        </div>
      </header>

      {/* Contenido scrolleable */}
      <div className="mx-auto max-w-6xl px-4 py-6 grid gap-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-cyan/20 p-4">
            <p className="text-xs text-pure/60">Registered</p>
            <p className="text-2xl font-bold">—</p>
          </div>
          <div className="rounded-lg border border-cyan/20 p-4">
            <p className="text-xs text-pure/60">Active (24h)</p>
            <p className="text-2xl font-bold">—</p>
          </div>
          <div className="rounded-lg border border-cyan/20 p-4">
            <p className="text-xs text-pure/60">Avg Gas</p>
            <p className="text-2xl font-bold">—</p>
          </div>
        </div>

        <div className="h-64 rounded-lg border border-cyan/20 grid place-items-center text-pure/50 text-sm">
          Activity timeline (soon)
        </div>

        <div className="rounded-lg border border-cyan/20 p-4">
          <p className="text-sm text-pure/70">
            Tip: la barra izquierda queda fija; este panel es quien scrollea. Prueba
            añadiendo contenido extra para ver el comportamiento.
          </p>
        </div>
      </div>
    </div>
  );
}

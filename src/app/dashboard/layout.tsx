export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen bg-space text-pure grid grid-cols-[240px_1fr]">
      {/* SIDEBAR fija */}
      <aside className="h-full border-r border-cyan/20 bg-space/95">
        <div className="p-4 border-b border-cyan/20">
          <div className="h-9 w-9 grid place-items-center rounded-md border border-cyan/40 shadow-[0_0_20px_#00FFD120]">
            <span className="text-xs font-bold text-cyan">DCR</span>
          </div>
          <p className="mt-2 text-sm text-pure/70">Dev Control Room</p>
        </div>

        <nav className="p-2 text-sm">
          <a href="/dashboard" className="block px-3 py-2 rounded hover:bg-white/5">Overview</a>
          <a href="/dashboard/contracts" className="block px-3 py-2 rounded hover:bg-white/5">My Contracts</a>
          <a href="/dashboard/analyze" className="block px-3 py-2 rounded hover:bg-white/5">Analyze Address</a>
          <a href="/dashboard/alerts" className="block px-3 py-2 rounded hover:bg-white/5">Alerts</a>
          <a href="/dashboard/settings" className="block px-3 py-2 rounded hover:bg-white/5">Settings</a>
        </nav>
      </aside>

      {/* PANEL derecho con scroll propio */}
      <section className="h-full overflow-y-auto">
        {children}
      </section>
    </div>
  );
}

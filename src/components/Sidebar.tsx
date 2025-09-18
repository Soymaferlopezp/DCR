"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/contracts", label: "My Contracts" },
  { href: "/dashboard/analyze", label: "Analyze" },
  { href: "/dashboard/alerts", label: "Pings Alerts" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-60 shrink-0 border-r border-cyan/20 sticky top-0 h-screen overflow-y-auto">
      <div className="px-4 py-4 text-sm font-semibold">DCR</div>
      <nav className="grid gap-1 px-2 pb-6">
        {links.map((l) => {
          const active = pathname === l.href || pathname.startsWith(l.href + "/");
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-2 rounded-md hover:bg-white/5 ${
                active ? "bg-white/10 border border-cyan/30" : "border border-transparent"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}


import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useActiveData, useStore } from "@/lib/store";

const NAV = [
  { to: "/", label: "Dashboard", icon: "🏠" },
  { to: "/kamar", label: "Kamar", icon: "🚪" },
  { to: "/keuangan", label: "Keuangan", icon: "💰" },
  { to: "/aset", label: "Aset", icon: "📦" },
  { to: "/lainnya", label: "Lainnya", icon: "⚙️" },
] as const;

export function AppShell({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const { ready } = useStore();
  const { property } = useActiveData();

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold">{title}</h1>
            <p className="truncate text-xs text-muted-foreground">
              {property ? property.name : "Belum ada properti"}
            </p>
          </div>
          {action}
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-4">
        {ready ? children : <p className="py-10 text-center text-muted-foreground">Memuat…</p>}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/98 backdrop-blur">
        <div className="mx-auto flex max-w-md items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium text-muted-foreground data-[status=active]:text-primary"
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

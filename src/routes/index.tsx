import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { MiniChart, type ChartRow } from "@/components/MiniChart";
import { Badge, EmptyState } from "@/components/ui";
import { formatDate, formatMoney, lastMonths, monthKey } from "@/lib/format";
import { useActiveData, useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Kelola Kost" },
      { name: "description", content: "Ringkasan hunian, pemasukan, pengeluaran, dan laba kost bulan ini." },
      { property: "og:title", content: "Dashboard — Kelola Kost" },
      { property: "og:description", content: "Ringkasan hunian dan keuangan kost Anda." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "danger" | "primary";
}) {
  const color =
    tone === "success"
      ? "text-success"
      : tone === "danger"
        ? "text-destructive"
        : tone === "primary"
          ? "text-primary"
          : "text-foreground";
  return (
    <div className="card-surface p-3.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 truncate text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

function Dashboard() {
  const { db } = useStore();
  const { rooms, tenants, payments, expenses, property } = useActiveData();
  const currency = db.settings.currency;
  const thisMonth = monthKey();

  const stats = useMemo(() => {
    const occupied = rooms.filter((r) => r.status === "Terisi").length;
    const vacant = rooms.filter((r) => r.status === "Kosong").length;
    const maintenance = rooms.filter((r) => r.status === "Maintenance").length;
    const income = payments
      .filter((p) => p.month === thisMonth)
      .reduce((s, p) => s + p.amount, 0);
    const expense = expenses
      .filter((e) => e.date.slice(0, 7) === thisMonth)
      .reduce((s, e) => s + e.amount, 0);
    const expectedRent = rooms
      .filter((r) => r.status === "Terisi")
      .reduce((s, r) => s + r.rent, 0);
    const unpaid = Math.max(0, expectedRent - income);
    return {
      total: rooms.length,
      occupied,
      vacant,
      maintenance,
      occupancy: rooms.length ? Math.round((occupied / rooms.length) * 100) : 0,
      income,
      expense,
      profit: income - expense,
      unpaid,
    };
  }, [rooms, payments, expenses, thisMonth]);

  const chartRows: ChartRow[] = useMemo(
    () =>
      lastMonths(6).map((m) => {
        const income = payments.filter((p) => p.month === m).reduce((s, p) => s + p.amount, 0);
        const expense = expenses
          .filter((e) => e.date.slice(0, 7) === m)
          .reduce((s, e) => s + e.amount, 0);
        return { month: m, income, expense, profit: income - expense };
      }),
    [payments, expenses],
  );

  const recent = useMemo(() => {
    const items = [
      ...payments.map((p) => ({
        id: p.id,
        date: p.date,
        label: tenants.find((t) => t.id === p.tenantId)?.name ?? "Pemasukan",
        sub: rooms.find((r) => r.id === p.roomId)?.name ?? p.month,
        amount: p.amount,
        kind: "in" as const,
      })),
      ...expenses.map((e) => ({
        id: e.id,
        date: e.date,
        label: e.category,
        sub: e.notes ?? "Pengeluaran",
        amount: e.amount,
        kind: "out" as const,
      })),
    ];
    return items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  }, [payments, expenses, tenants, rooms]);

  if (!property) {
    return (
      <AppShell title="Dashboard">
        <EmptyState
          icon="🏘️"
          title="Belum ada properti"
          hint="Tambahkan kost Anda di menu Lainnya untuk mulai mencatat data."
        />
        <Link
          to="/lainnya"
          className="mt-4 flex min-h-12 items-center justify-center rounded-xl bg-primary font-semibold text-primary-foreground"
        >
          Tambah Properti
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell title="Dashboard">
      <div className="space-y-4">
        <div className="rounded-2xl bg-primary p-4 text-primary-foreground">
          <p className="text-sm opacity-90">Laba bersih bulan ini</p>
          <p className="mt-1 text-2xl font-bold">{formatMoney(stats.profit, currency)}</p>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span>Masuk {formatMoney(stats.income, currency)}</span>
            <span>Keluar {formatMoney(stats.expense, currency)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Total kamar" value={String(stats.total)} />
          <StatCard label="Hunian" value={`${stats.occupancy}%`} tone="primary" />
          <StatCard label="Terisi" value={String(stats.occupied)} tone="success" />
          <StatCard label="Kosong" value={String(stats.vacant)} />
          <StatCard label="Maintenance" value={String(stats.maintenance)} tone="danger" />
          <StatCard label="Belum dibayar" value={formatMoney(stats.unpaid, currency)} tone="danger" />
        </div>

        <MiniChart rows={chartRows} currency={currency} />

        <div>
          <h3 className="mb-2 font-semibold">Transaksi Terbaru</h3>
          {recent.length === 0 ? (
            <EmptyState icon="🧾" title="Belum ada transaksi" hint="Catat pemasukan atau pengeluaran di menu Keuangan." />
          ) : (
            <div className="card-surface divide-y divide-border">
              {recent.map((r) => (
                <div key={r.kind + r.id} className="flex items-center justify-between gap-3 p-3.5">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.label}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.sub} · {formatDate(r.date)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={`text-sm font-bold ${r.kind === "in" ? "text-success" : "text-destructive"}`}
                    >
                      {r.kind === "in" ? "+" : "−"}
                      {formatMoney(r.amount, currency)}
                    </p>
                    <Badge tone={r.kind === "in" ? "success" : "danger"}>
                      {r.kind === "in" ? "Masuk" : "Keluar"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

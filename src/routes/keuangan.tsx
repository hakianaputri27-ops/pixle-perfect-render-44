import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { MiniChart, type ChartRow } from "@/components/MiniChart";
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  SegmentedTabs,
  Select,
  Sheet,
  Textarea,
} from "@/components/ui";
import { formatDate, formatMoney, lastMonths, monthKey, monthLabel, today } from "@/lib/format";
import { useActiveData, useStore } from "@/lib/store";
import { EXPENSE_CATEGORIES, type Expense, type Payment, type PaymentStatus } from "@/lib/types";

export const Route = createFileRoute("/keuangan")({
  head: () => ({
    meta: [
      { title: "Keuangan — Kelola Kost" },
      { name: "description", content: "Catat pemasukan sewa, pengeluaran, dan lihat laporan laba bulanan." },
      { property: "og:title", content: "Keuangan — Kelola Kost" },
      { property: "og:description", content: "Pemasukan, pengeluaran, dan laporan kost." },
    ],
  }),
  component: KeuanganPage,
});

const PAY_STATUS: PaymentStatus[] = ["Lunas", "Sebagian", "Belum Bayar"];

function KeuanganPage() {
  const { db, activePropertyId, add, update, remove } = useStore();
  const { rooms, tenants, payments, expenses, property } = useActiveData();
  const currency = db.settings.currency;
  const [tab, setTab] = useState<"masuk" | "keluar" | "laporan">("masuk");
  const [paySheet, setPaySheet] = useState<Partial<Payment> | null>(null);
  const [expSheet, setExpSheet] = useState<Partial<Expense> | null>(null);
  const [confirm, setConfirm] = useState<{ coll: "payments" | "expenses"; id: string } | null>(null);

  const sortedPayments = useMemo(
    () => [...payments].sort((a, b) => b.date.localeCompare(a.date)),
    [payments],
  );
  const sortedExpenses = useMemo(
    () => [...expenses].sort((a, b) => b.date.localeCompare(a.date)),
    [expenses],
  );

  const rows: ChartRow[] = useMemo(
    () =>
      lastMonths(6).map((m) => {
        const income = payments.filter((p) => p.month === m).reduce((s, p) => s + p.amount, 0);
        const expense = expenses.filter((e) => e.date.slice(0, 7) === m).reduce((s, e) => s + e.amount, 0);
        return { month: m, income, expense, profit: income - expense };
      }),
    [payments, expenses],
  );

  if (!property) {
    return (
      <AppShell title="Keuangan">
        <EmptyState icon="🏘️" title="Belum ada properti" hint="Tambahkan properti dulu di menu Lainnya." />
      </AppShell>
    );
  }

  const savePayment = () => {
    if (!paySheet || !activePropertyId) return;
    const tenant = tenants.find((t) => t.id === paySheet.tenantId);
    const data = {
      propertyId: activePropertyId,
      tenantId: paySheet.tenantId || undefined,
      roomId: paySheet.roomId || tenant?.roomId || undefined,
      amount: Number(paySheet.amount) || 0,
      date: paySheet.date || today(),
      month: paySheet.month || monthKey(),
      status: (paySheet.status ?? "Lunas") as PaymentStatus,
      notes: paySheet.notes ?? "",
    };
    if (paySheet.id) update("payments", paySheet.id, data);
    else add("payments", data);
    setPaySheet(null);
  };

  const saveExpense = () => {
    if (!expSheet || !activePropertyId) return;
    const data = {
      propertyId: activePropertyId,
      date: expSheet.date || today(),
      category: expSheet.category || "Lainnya",
      amount: Number(expSheet.amount) || 0,
      notes: expSheet.notes ?? "",
    };
    if (expSheet.id) update("expenses", expSheet.id, data);
    else add("expenses", data);
    setExpSheet(null);
  };

  const thisMonth = monthKey();
  const monthIncome = payments.filter((p) => p.month === thisMonth).reduce((s, p) => s + p.amount, 0);
  const monthExpense = expenses
    .filter((e) => e.date.slice(0, 7) === thisMonth)
    .reduce((s, e) => s + e.amount, 0);

  return (
    <AppShell
      title="Keuangan"
      action={
        tab === "laporan" ? undefined : (
          <Button
            size="sm"
            onClick={() =>
              tab === "masuk"
                ? setPaySheet({ date: today(), month: monthKey(), status: "Lunas" })
                : setExpSheet({ date: today(), category: "Listrik" })
            }
          >
            + Catat
          </Button>
        )
      }
    >
      <div className="space-y-4">
        <SegmentedTabs
          value={tab}
          onChange={setTab}
          options={[
            { value: "masuk", label: "Pemasukan" },
            { value: "keluar", label: "Pengeluaran" },
            { value: "laporan", label: "Laporan" },
          ]}
        />

        {tab === "masuk" && (
          <>
            <div className="card-surface p-4">
              <p className="text-sm text-muted-foreground">Pemasukan {monthLabel(thisMonth)}</p>
              <p className="text-xl font-bold text-success">{formatMoney(monthIncome, currency)}</p>
            </div>
            {sortedPayments.length === 0 ? (
              <EmptyState icon="💵" title="Belum ada pemasukan" hint="Catat pembayaran sewa penghuni." />
            ) : (
              <div className="space-y-3">
                {sortedPayments.map((p) => (
                  <div key={p.id} className="card-surface p-4">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-bold">
                          {tenants.find((t) => t.id === p.tenantId)?.name ?? "Tanpa penghuni"}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {rooms.find((r) => r.id === p.roomId)?.name ?? "-"} · {monthLabel(p.month)} ·{" "}
                          {formatDate(p.date)}
                        </p>
                        {p.notes ? (
                          <p className="truncate text-xs text-muted-foreground">{p.notes}</p>
                        ) : null}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-bold text-success">{formatMoney(p.amount, currency)}</p>
                        <Badge
                          tone={p.status === "Lunas" ? "success" : p.status === "Sebagian" ? "warning" : "danger"}
                        >
                          {p.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="ghost" className="flex-1" onClick={() => setPaySheet(p)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        className="flex-1"
                        onClick={() => setConfirm({ coll: "payments", id: p.id })}
                      >
                        Hapus
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "keluar" && (
          <>
            <div className="card-surface p-4">
              <p className="text-sm text-muted-foreground">Pengeluaran {monthLabel(thisMonth)}</p>
              <p className="text-xl font-bold text-destructive">{formatMoney(monthExpense, currency)}</p>
            </div>
            {sortedExpenses.length === 0 ? (
              <EmptyState icon="🧾" title="Belum ada pengeluaran" hint="Catat listrik, air, perbaikan, dan lainnya." />
            ) : (
              <div className="space-y-3">
                {sortedExpenses.map((e) => (
                  <div key={e.id} className="card-surface p-4">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-bold">{e.category}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {formatDate(e.date)}
                          {e.notes ? ` · ${e.notes}` : ""}
                        </p>
                      </div>
                      <p className="shrink-0 font-bold text-destructive">{formatMoney(e.amount, currency)}</p>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="ghost" className="flex-1" onClick={() => setExpSheet(e)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        className="flex-1"
                        onClick={() => setConfirm({ coll: "expenses", id: e.id })}
                      >
                        Hapus
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "laporan" && (
          <>
            <div className="grid grid-cols-1 gap-3">
              <div className="rounded-2xl bg-primary p-4 text-primary-foreground">
                <p className="text-sm opacity-90">Laba bersih {monthLabel(thisMonth)}</p>
                <p className="text-2xl font-bold">{formatMoney(monthIncome - monthExpense, currency)}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="card-surface p-3.5">
                  <p className="text-xs text-muted-foreground">Pemasukan</p>
                  <p className="font-bold text-success">{formatMoney(monthIncome, currency)}</p>
                </div>
                <div className="card-surface p-3.5">
                  <p className="text-xs text-muted-foreground">Pengeluaran</p>
                  <p className="font-bold text-destructive">{formatMoney(monthExpense, currency)}</p>
                </div>
              </div>
            </div>
            <MiniChart rows={rows} currency={currency} />
            <div className="card-surface divide-y divide-border">
              {rows.map((r) => (
                <div key={r.month} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 p-3.5 text-sm">
                  <span className="truncate font-medium">{monthLabel(r.month)}</span>
                  <span className="shrink-0 text-right">
                    <span className="text-success">{formatMoney(r.income, currency)}</span>
                    {" / "}
                    <span className="text-destructive">{formatMoney(r.expense, currency)}</span>
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Sheet
        open={!!paySheet}
        title={paySheet?.id ? "Edit Pemasukan" : "Catat Pemasukan"}
        onClose={() => setPaySheet(null)}
      >
        <div className="space-y-3">
          <Field label="Penghuni">
            <Select
              value={paySheet?.tenantId ?? ""}
              onChange={(e) => {
                const t = tenants.find((x) => x.id === e.target.value);
                setPaySheet({
                  ...paySheet,
                  tenantId: e.target.value,
                  roomId: t?.roomId ?? paySheet?.roomId,
                  amount: paySheet?.amount || t?.rent || 0,
                });
              }}
            >
              <option value="">Pilih penghuni</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Kamar">
            <Select
              value={paySheet?.roomId ?? ""}
              onChange={(e) => setPaySheet({ ...paySheet, roomId: e.target.value })}
            >
              <option value="">Pilih kamar</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Jumlah">
            <Input
              type="number"
              inputMode="numeric"
              value={paySheet?.amount ?? ""}
              onChange={(e) => setPaySheet({ ...paySheet, amount: Number(e.target.value) })}
            />
          </Field>
          <Field label="Tanggal bayar">
            <Input
              type="date"
              value={paySheet?.date ?? today()}
              onChange={(e) => setPaySheet({ ...paySheet, date: e.target.value })}
            />
          </Field>
          <Field label="Bulan sewa">
            <Select
              value={paySheet?.month ?? monthKey()}
              onChange={(e) => setPaySheet({ ...paySheet, month: e.target.value })}
            >
              {lastMonths(12)
                .slice()
                .reverse()
                .map((m) => (
                  <option key={m} value={m}>
                    {monthLabel(m)}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select
              value={paySheet?.status ?? "Lunas"}
              onChange={(e) => setPaySheet({ ...paySheet, status: e.target.value as PaymentStatus })}
            >
              {PAY_STATUS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Catatan">
            <Textarea
              value={paySheet?.notes ?? ""}
              onChange={(e) => setPaySheet({ ...paySheet, notes: e.target.value })}
            />
          </Field>
          <Button className="w-full" onClick={savePayment}>
            Simpan
          </Button>
        </div>
      </Sheet>

      <Sheet
        open={!!expSheet}
        title={expSheet?.id ? "Edit Pengeluaran" : "Catat Pengeluaran"}
        onClose={() => setExpSheet(null)}
      >
        <div className="space-y-3">
          <Field label="Tanggal">
            <Input
              type="date"
              value={expSheet?.date ?? today()}
              onChange={(e) => setExpSheet({ ...expSheet, date: e.target.value })}
            />
          </Field>
          <Field label="Kategori">
            <Select
              value={expSheet?.category ?? "Listrik"}
              onChange={(e) => setExpSheet({ ...expSheet, category: e.target.value })}
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Jumlah">
            <Input
              type="number"
              inputMode="numeric"
              value={expSheet?.amount ?? ""}
              onChange={(e) => setExpSheet({ ...expSheet, amount: Number(e.target.value) })}
            />
          </Field>
          <Field label="Catatan">
            <Textarea
              value={expSheet?.notes ?? ""}
              onChange={(e) => setExpSheet({ ...expSheet, notes: e.target.value })}
            />
          </Field>
          <Button className="w-full" onClick={saveExpense}>
            Simpan
          </Button>
        </div>
      </Sheet>

      <ConfirmDialog
        open={!!confirm}
        title="Hapus catatan ini?"
        message="Catatan yang dihapus tidak bisa dikembalikan."
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) remove(confirm.coll, confirm.id);
          setConfirm(null);
        }}
      />
    </AppShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  SegmentedTabs,
  Select,
  Sheet,
  Textarea,
} from "@/components/ui";
import { formatDate, formatMoney, today } from "@/lib/format";
import { useActiveData, useStore } from "@/lib/store";
import type { Asset, Maintenance, MaintenanceStatus } from "@/lib/types";

export const Route = createFileRoute("/aset")({
  head: () => ({
    meta: [
      { title: "Aset & Maintenance — Kelola Kost" },
      { name: "description", content: "Catat aset kost, hitung penyusutan, dan pantau perbaikan." },
      { property: "og:title", content: "Aset & Maintenance — Kelola Kost" },
      { property: "og:description", content: "Nilai aset, penyusutan garis lurus, dan daftar maintenance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AsetPage,
});

export function depreciation(a: Asset) {
  const years = Math.max(a.usefulLife || 1, 1);
  const perYear = a.price / years;
  const start = new Date(a.purchaseDate);
  const ageYears = Number.isNaN(start.getTime())
    ? 0
    : Math.max(0, (Date.now() - start.getTime()) / (365.25 * 24 * 3600 * 1000));
  const accumulated = Math.min(a.price, perYear * ageYears);
  return { perYear, perMonth: perYear / 12, accumulated, bookValue: a.price - accumulated, ageYears };
}

function AsetPage() {
  const [tab, setTab] = useState<"aset" | "mt">("aset");
  return (
    <AppShell title={tab === "aset" ? "Aset" : "Maintenance"}>
      <div className="space-y-4">
        <SegmentedTabs
          value={tab}
          onChange={setTab}
          options={[
            { value: "aset", label: "Aset" },
            { value: "mt", label: "Maintenance" },
          ]}
        />
        {tab === "aset" ? <AssetTab /> : <MaintenanceTab />}
      </div>
    </AppShell>
  );
}

type AssetForm = { name: string; category: string; price: string; purchaseDate: string; usefulLife: string; notes: string };
const emptyAsset: AssetForm = { name: "", category: "", price: "", purchaseDate: today(), usefulLife: "5", notes: "" };

function AssetTab() {
  const { db, activePropertyId, add, update, remove } = useStore();
  const { assets } = useActiveData();
  const cur = db.settings.currency;
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string>();
  const [form, setForm] = useState<AssetForm>(emptyAsset);
  const [del, setDel] = useState<string>();

  const totals = assets.reduce(
    (acc, a) => {
      const d = depreciation(a);
      acc.price += a.price;
      acc.book += d.bookValue;
      acc.monthly += d.bookValue > 0 ? d.perMonth : 0;
      return acc;
    },
    { price: 0, book: 0, monthly: 0 },
  );

  const openNew = () => { setEditId(undefined); setForm(emptyAsset); setOpen(true); };
  const openEdit = (a: Asset) => {
    setEditId(a.id);
    setForm({ name: a.name, category: a.category ?? "", price: String(a.price), purchaseDate: a.purchaseDate, usefulLife: String(a.usefulLife), notes: a.notes ?? "" });
    setOpen(true);
  };
  const save = () => {
    if (!form.name.trim() || !activePropertyId) return;
    const data = {
      propertyId: activePropertyId,
      name: form.name.trim(),
      category: form.category || undefined,
      price: Number(form.price) || 0,
      purchaseDate: form.purchaseDate,
      usefulLife: Math.max(Number(form.usefulLife) || 1, 1),
      notes: form.notes || undefined,
    };
    if (editId) update("assets", editId, data); else add("assets", data);
    setOpen(false);
  };

  if (!activePropertyId) return <EmptyState icon="🏘️" title="Belum ada properti" hint="Tambahkan properti di menu Lainnya." />;

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Card><p className="text-xs text-muted-foreground">Harga beli</p><p className="mt-1 font-bold">{formatMoney(totals.price, cur)}</p></Card>
        <Card><p className="text-xs text-muted-foreground">Nilai buku</p><p className="mt-1 font-bold text-primary">{formatMoney(totals.book, cur)}</p></Card>
        <Card className="col-span-2"><p className="text-xs text-muted-foreground">Penyusutan per bulan</p><p className="mt-1 font-bold">{formatMoney(totals.monthly, cur)}</p></Card>
      </div>
      <Button className="w-full" onClick={openNew}>+ Tambah Aset</Button>
      {assets.length === 0 ? (
        <EmptyState icon="📦" title="Belum ada aset" hint="Catat kasur, AC, lemari, dan lainnya." />
      ) : (
        <div className="space-y-3">
          {assets.map((a) => {
            const d = depreciation(a);
            const pct = a.price ? (d.accumulated / a.price) * 100 : 0;
            return (
              <Card key={a.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{a.category || "Tanpa kategori"} · dibeli {formatDate(a.purchaseDate)} · {a.usefulLife} th</p>
                  </div>
                  <Badge tone={d.bookValue <= 0 ? "danger" : "primary"}>{d.bookValue <= 0 ? "Habis" : `${Math.round(100 - pct)}%`}</Badge>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${100 - pct}%` }} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Harga</span><span className="text-right">{formatMoney(a.price, cur)}</span>
                  <span className="text-muted-foreground">Susut/tahun</span><span className="text-right">{formatMoney(d.perYear, cur)}</span>
                  <span className="text-muted-foreground">Akumulasi</span><span className="text-right">{formatMoney(d.accumulated, cur)}</span>
                  <span className="text-muted-foreground">Nilai buku</span><span className="text-right font-semibold">{formatMoney(d.bookValue, cur)}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="ghost" className="flex-1" onClick={() => openEdit(a)}>Ubah</Button>
                  <Button size="sm" variant="ghost" className="flex-1 text-destructive" onClick={() => setDel(a.id)}>Hapus</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <Sheet open={open} title={editId ? "Ubah Aset" : "Tambah Aset"} onClose={() => setOpen(false)}>
        <div className="space-y-3">
          <Field label="Nama aset"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="AC kamar 1" /></Field>
          <Field label="Kategori"><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Elektronik" /></Field>
          <Field label="Harga beli"><Input inputMode="numeric" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Field>
          <Field label="Tanggal beli"><Input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} /></Field>
          <Field label="Umur ekonomis (tahun)"><Input type="number" min={1} value={form.usefulLife} onChange={(e) => setForm({ ...form, usefulLife: e.target.value })} /></Field>
          <Field label="Catatan"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
          <Button className="w-full" onClick={save}>Simpan</Button>
        </div>
      </Sheet>
      <ConfirmDialog open={!!del} title="Hapus aset?" message="Data aset ini akan dihapus permanen." onCancel={() => setDel(undefined)} onConfirm={() => { if (del) remove("assets", del); setDel(undefined); }} />
    </>
  );
}

const MT_STATUS: MaintenanceStatus[] = ["Open", "In Progress", "Completed"];
const mtLabel: Record<MaintenanceStatus, string> = { Open: "Baru", "In Progress": "Dikerjakan", Completed: "Selesai" };
const mtTone = (s: MaintenanceStatus) => (s === "Completed" ? "success" : s === "Open" ? "danger" : "warning");

type MtForm = { roomId: string; problem: string; date: string; estimatedCost: string; actualCost: string; status: MaintenanceStatus; notes: string };
const emptyMt: MtForm = { roomId: "", problem: "", date: today(), estimatedCost: "", actualCost: "", status: "Open", notes: "" };

function MaintenanceTab() {
  const { db, activePropertyId, add, update, remove } = useStore();
  const { maintenance, rooms } = useActiveData();
  const cur = db.settings.currency;
  const [filter, setFilter] = useState<"all" | MaintenanceStatus>("all");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string>();
  const [form, setForm] = useState<MtForm>(emptyMt);
  const [del, setDel] = useState<string>();

  const list = [...maintenance]
    .filter((m) => filter === "all" || m.status === filter)
    .sort((a, b) => b.date.localeCompare(a.date));
  const openCount = maintenance.filter((m) => m.status !== "Completed").length;
  const spent = maintenance.reduce((s, m) => s + (m.actualCost ?? 0), 0);

  const openEdit = (m: Maintenance) => {
    setEditId(m.id);
    setForm({ roomId: m.roomId ?? "", problem: m.problem, date: m.date, estimatedCost: m.estimatedCost?.toString() ?? "", actualCost: m.actualCost?.toString() ?? "", status: m.status, notes: m.notes ?? "" });
    setOpen(true);
  };
  const save = () => {
    if (!form.problem.trim() || !activePropertyId) return;
    const data = {
      propertyId: activePropertyId,
      roomId: form.roomId || undefined,
      problem: form.problem.trim(),
      date: form.date,
      estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : undefined,
      actualCost: form.actualCost ? Number(form.actualCost) : undefined,
      status: form.status,
      notes: form.notes || undefined,
    };
    if (editId) update("maintenance", editId, data); else add("maintenance", data);
    setOpen(false);
  };

  if (!activePropertyId) return <EmptyState icon="🏘️" title="Belum ada properti" hint="Tambahkan properti di menu Lainnya." />;

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Card><p className="text-xs text-muted-foreground">Belum selesai</p><p className="mt-1 text-xl font-bold">{openCount}</p></Card>
        <Card><p className="text-xs text-muted-foreground">Total biaya</p><p className="mt-1 font-bold">{formatMoney(spent, cur)}</p></Card>
      </div>
      <Button className="w-full" onClick={() => { setEditId(undefined); setForm(emptyMt); setOpen(true); }}>+ Catat Perbaikan</Button>
      <Select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
        <option value="all">Semua status</option>
        {MT_STATUS.map((s) => <option key={s} value={s}>{mtLabel[s]}</option>)}
      </Select>
      {list.length === 0 ? (
        <EmptyState icon="🛠️" title="Tidak ada data maintenance" />
      ) : (
        <div className="space-y-3">
          {list.map((m) => (
            <Card key={m.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{m.problem}</p>
                  <p className="text-xs text-muted-foreground">{rooms.find((r) => r.id === m.roomId)?.name ?? "Umum"} · {formatDate(m.date)}</p>
                </div>
                <Badge tone={mtTone(m.status)}>{mtLabel[m.status]}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Estimasi {formatMoney(m.estimatedCost ?? 0, cur)} · Aktual {formatMoney(m.actualCost ?? 0, cur)}
              </p>
              <div className="mt-3 flex gap-2">
                {m.status !== "Completed" ? (
                  <Button size="sm" variant="secondary" className="flex-1" onClick={() => update("maintenance", m.id, { status: m.status === "Open" ? "In Progress" : "Completed" })}>
                    {m.status === "Open" ? "Mulai" : "Selesai"}
                  </Button>
                ) : null}
                <Button size="sm" variant="ghost" className="flex-1" onClick={() => openEdit(m)}>Ubah</Button>
                <Button size="sm" variant="ghost" className="flex-1 text-destructive" onClick={() => setDel(m.id)}>Hapus</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Sheet open={open} title={editId ? "Ubah Maintenance" : "Catat Perbaikan"} onClose={() => setOpen(false)}>
        <div className="space-y-3">
          <Field label="Kamar">
            <Select value={form.roomId} onChange={(e) => setForm({ ...form, roomId: e.target.value })}>
              <option value="">Umum / area bersama</option>
              {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
          </Field>
          <Field label="Masalah"><Input value={form.problem} onChange={(e) => setForm({ ...form, problem: e.target.value })} placeholder="Keran bocor" /></Field>
          <Field label="Tanggal"><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="Estimasi biaya"><Input type="number" value={form.estimatedCost} onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })} /></Field>
          <Field label="Biaya aktual"><Input type="number" value={form.actualCost} onChange={(e) => setForm({ ...form, actualCost: e.target.value })} /></Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as MaintenanceStatus })}>
              {MT_STATUS.map((s) => <option key={s} value={s}>{mtLabel[s]}</option>)}
            </Select>
          </Field>
          <Field label="Catatan"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
          <Button className="w-full" onClick={save}>Simpan</Button>
        </div>
      </Sheet>
      <ConfirmDialog open={!!del} title="Hapus catatan?" message="Catatan maintenance ini akan dihapus." onCancel={() => setDel(undefined)} onConfirm={() => { if (del) remove("maintenance", del); setDel(undefined); }} />
    </>
  );
}

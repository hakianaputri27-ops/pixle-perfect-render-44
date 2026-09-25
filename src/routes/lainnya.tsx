import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, Card, ConfirmDialog, Field, Input, Select, Sheet } from "@/components/ui";
import { useStore } from "@/lib/store";
import type { DB } from "@/lib/types";

export const Route = createFileRoute("/lainnya")({
  head: () => ({
    meta: [
      { title: "Pengaturan — Kelola Kost" },
      { name: "description", content: "Kelola properti, mata uang, tema, dan cadangan data kost." },
      { property: "og:title", content: "Pengaturan — Kelola Kost" },
      { property: "og:description", content: "Pilih properti, mode gelap, ekspor & impor cadangan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LainnyaPage,
});

const CURRENCIES = ["IDR", "USD", "SGD", "MYR", "EUR"];

function LainnyaPage() {
  const { db, activePropertyId, add, update, remove, setSettings, replaceAll, reset } = useStore();
  const [sheet, setSheet] = useState(false);
  const [editId, setEditId] = useState<string>();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [delProp, setDelProp] = useState<string>();
  const [confirmReset, setConfirmReset] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const openProp = (id?: string) => {
    const p = db.properties.find((x) => x.id === id);
    setEditId(id);
    setName(p?.name ?? "");
    setAddress(p?.address ?? "");
    setSheet(true);
  };
  const saveProp = () => {
    if (!name.trim()) return;
    if (editId) update("properties", editId, { name: name.trim(), address: address || undefined });
    else {
      const p = add("properties", { name: name.trim(), address: address || undefined });
      setSettings({ activePropertyId: p.id });
    }
    setSheet(false);
  };
  const deleteProp = (id: string) => {
    for (const k of ["rooms", "tenants", "payments", "expenses", "assets", "maintenance"] as const) {
      (db[k] as { id: string; propertyId: string }[]).filter((x) => x.propertyId === id).forEach((x) => remove(k, x.id));
    }
    remove("properties", id);
    if (activePropertyId === id) setSettings({ activePropertyId: db.properties.find((p) => p.id !== id)?.id });
  };

  const exportData = async () => {
    const json = JSON.stringify({ app: "kelola-kost", version: 1, exportedAt: new Date().toISOString(), data: db }, null, 2);
    const fileName = `kelola-kost-${new Date().toISOString().slice(0, 10)}.json`;
    const file = new File([json], fileName, { type: "application/json" });
    const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
    try {
      if (nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: "Cadangan Kelola Kost" });
        setMsg("Cadangan dibagikan.");
        return;
      }
    } catch { /* fallback to download */ }
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    setMsg("Cadangan diunduh.");
  };

  const importData = async (f?: File) => {
    if (!f) return;
    try {
      const parsed = JSON.parse(await f.text());
      const data: Partial<DB> = parsed.data ?? parsed;
      if (!Array.isArray(data.properties)) throw new Error("format");
      replaceAll(data);
      setMsg("Data berhasil dipulihkan.");
    } catch {
      setMsg("File cadangan tidak valid.");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <AppShell title="Lainnya">
      <div className="space-y-4">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">Properti</h2>
            <Button size="sm" onClick={() => openProp()}>+ Tambah</Button>
          </div>
          {db.properties.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada properti. Tambahkan kost pertama Anda.</p>
          ) : (
            <div className="space-y-2">
              {db.properties.map((p) => {
                const active = p.id === activePropertyId;
                return (
                  <div key={p.id} className={`rounded-xl border p-3 ${active ? "border-primary bg-primary-soft" : "border-border"}`}>
                    <button className="w-full text-left" onClick={() => setSettings({ activePropertyId: p.id })}>
                      <p className="font-semibold">{p.name} {active ? <span className="text-xs text-primary">· aktif</span> : null}</p>
                      {p.address ? <p className="text-xs text-muted-foreground">{p.address}</p> : null}
                    </button>
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" variant="ghost" className="flex-1" onClick={() => openProp(p.id)}>Ubah</Button>
                      <Button size="sm" variant="ghost" className="flex-1 text-destructive" onClick={() => setDelProp(p.id)}>Hapus</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="space-y-3">
          <h2 className="font-bold">Tampilan</h2>
          <Field label="Mata uang">
            <Select value={db.settings.currency} onChange={(e) => setSettings({ currency: e.target.value })}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <div className="flex items-center justify-between">
            <span className="font-medium">Mode gelap</span>
            <button
              role="switch"
              aria-checked={db.settings.theme === "dark"}
              onClick={() => setSettings({ theme: db.settings.theme === "dark" ? "light" : "dark" })}
              className={`relative h-8 w-14 rounded-full transition-colors ${db.settings.theme === "dark" ? "bg-primary" : "bg-muted"}`}
            >
              <span className={`absolute top-1 h-6 w-6 rounded-full bg-card shadow transition-all ${db.settings.theme === "dark" ? "left-7" : "left-1"}`} />
            </button>
          </div>
        </Card>

        <Card className="space-y-3">
          <h2 className="font-bold">Cadangan data</h2>
          <p className="text-sm text-muted-foreground">Data tersimpan di perangkat ini. Ekspor secara rutin agar aman.</p>
          <Button className="w-full" variant="secondary" onClick={exportData}>Ekspor cadangan (JSON)</Button>
          <Button className="w-full" variant="ghost" onClick={() => fileRef.current?.click()}>Impor cadangan</Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => importData(e.target.files?.[0])} />
          {msg ? <p className="text-sm text-primary">{msg}</p> : null}
        </Card>

        <Card className="space-y-3">
          <h2 className="font-bold text-destructive">Zona bahaya</h2>
          <Button className="w-full" variant="danger" onClick={() => setConfirmReset(true)}>Reset semua data</Button>
        </Card>

        <p className="pb-4 text-center text-xs text-muted-foreground">Kelola Kost v1.0</p>
      </div>

      <Sheet open={sheet} title={editId ? "Ubah Properti" : "Tambah Properti"} onClose={() => setSheet(false)}>
        <div className="space-y-3">
          <Field label="Nama kost"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Kost Melati" /></Field>
          <Field label="Alamat"><Input value={address} onChange={(e) => setAddress(e.target.value)} /></Field>
          <Button className="w-full" onClick={saveProp}>Simpan</Button>
        </div>
      </Sheet>
      <ConfirmDialog open={!!delProp} title="Hapus properti?" message="Semua kamar, penghuni, keuangan, aset, dan maintenance properti ini ikut terhapus." onCancel={() => setDelProp(undefined)} onConfirm={() => { if (delProp) deleteProp(delProp); setDelProp(undefined); }} />
      <ConfirmDialog open={confirmReset} title="Reset semua data?" message="Seluruh data akan dihapus dari perangkat ini. Ekspor cadangan dulu jika perlu." confirmLabel="Reset" onCancel={() => setConfirmReset(false)} onConfirm={() => { reset(); setConfirmReset(false); setMsg("Semua data telah direset."); }} />
    </AppShell>
  );
}

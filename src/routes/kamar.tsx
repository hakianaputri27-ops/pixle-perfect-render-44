import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
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
import { formatDate, formatMoney, monthKey, today } from "@/lib/format";
import { useActiveData, useStore } from "@/lib/store";
import type { Room, RoomStatus, Tenant } from "@/lib/types";

export const Route = createFileRoute("/kamar")({
  head: () => ({
    meta: [
      { title: "Kamar & Penghuni — Kelola Kost" },
      { name: "description", content: "Kelola data kamar, status hunian, dan penghuni kost Anda." },
      { property: "og:title", content: "Kamar & Penghuni — Kelola Kost" },
      { property: "og:description", content: "Tambah, ubah, dan hapus kamar serta penghuni." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: KamarPage,
});

const STATUSES: RoomStatus[] = ["Terisi", "Kosong", "Maintenance"];

function statusTone(s: RoomStatus) {
  return s === "Terisi" ? "success" : s === "Kosong" ? "muted" : "warning";
}

function KamarPage() {
  const { db, activePropertyId, add, update, remove } = useStore();
  const { rooms, tenants, payments, property } = useActiveData();
  const currency = db.settings.currency;
  const [tab, setTab] = useState<"kamar" | "penghuni">("kamar");

  const [roomSheet, setRoomSheet] = useState<Partial<Room> | null>(null);
  const [tenantSheet, setTenantSheet] = useState<Partial<Tenant> | null>(null);
  const [confirm, setConfirm] = useState<{ coll: "rooms" | "tenants"; id: string } | null>(null);
  const [openRoom, setOpenRoom] = useState<string | null>(null);

  const paidThisMonth = useMemo(() => {
    const m = monthKey();
    const map = new Map<string, number>();
    payments
      .filter((p) => p.month === m && p.roomId)
      .forEach((p) => map.set(p.roomId!, (map.get(p.roomId!) ?? 0) + p.amount));
    return map;
  }, [payments]);

  if (!property) {
    return (
      <AppShell title="Kamar">
        <EmptyState icon="🏘️" title="Belum ada properti" hint="Tambahkan properti dulu di menu Lainnya." />
      </AppShell>
    );
  }

  const saveRoom = () => {
    if (!roomSheet || !activePropertyId) return;
    const data = {
      propertyId: activePropertyId,
      name: (roomSheet.name ?? "").trim() || "Kamar",
      rent: Number(roomSheet.rent) || 0,
      status: (roomSheet.status ?? "Kosong") as RoomStatus,
      tenantId: roomSheet.tenantId || undefined,
      notes: roomSheet.notes ?? "",
    };
    if (roomSheet.id) update("rooms", roomSheet.id, data);
    else {
      const created = add("rooms", data);
      if (data.tenantId) update("tenants", data.tenantId, { roomId: created.id });
    }
    if (roomSheet.id && data.tenantId) update("tenants", data.tenantId, { roomId: roomSheet.id });
    setRoomSheet(null);
  };

  const saveTenant = () => {
    if (!tenantSheet || !activePropertyId) return;
    const data = {
      propertyId: activePropertyId,
      name: (tenantSheet.name ?? "").trim() || "Penghuni",
      phone: tenantSheet.phone ?? "",
      roomId: tenantSheet.roomId || undefined,
      rent: Number(tenantSheet.rent) || 0,
      moveInDate: tenantSheet.moveInDate || today(),
      dueDate: tenantSheet.dueDate || "",
      deposit: Number(tenantSheet.deposit) || 0,
      notes: tenantSheet.notes ?? "",
    };
    let tenantId = tenantSheet.id;
    if (tenantId) update("tenants", tenantId, data);
    else tenantId = add("tenants", data).id;
    if (data.roomId) update("rooms", data.roomId, { tenantId, status: "Terisi" });
    setTenantSheet(null);
  };

  const doDelete = () => {
    if (!confirm) return;
    if (confirm.coll === "rooms") {
      const t = tenants.find((x) => x.roomId === confirm.id);
      if (t) update("tenants", t.id, { roomId: undefined });
    } else {
      const r = rooms.find((x) => x.tenantId === confirm.id);
      if (r) update("rooms", r.id, { tenantId: undefined, status: "Kosong" });
    }
    remove(confirm.coll, confirm.id);
    setConfirm(null);
  };

  return (
    <AppShell
      title="Kamar & Penghuni"
      action={
        <Button
          size="sm"
          onClick={() =>
            tab === "kamar" ? setRoomSheet({ status: "Kosong" }) : setTenantSheet({})
          }
        >
          + Tambah
        </Button>
      }
    >
      <div className="space-y-4">
        <SegmentedTabs
          value={tab}
          onChange={setTab}
          options={[
            { value: "kamar", label: `Kamar (${rooms.length})` },
            { value: "penghuni", label: `Penghuni (${tenants.length})` },
          ]}
        />

        {tab === "kamar" ? (
          rooms.length === 0 ? (
            <EmptyState icon="🚪" title="Belum ada kamar" hint="Tekan Tambah untuk membuat kamar pertama." />
          ) : (
            <div className="space-y-3">
              {rooms.map((room) => {
                const tenant = tenants.find((t) => t.id === room.tenantId);
                const paid = paidThisMonth.get(room.id) ?? 0;
                const payTone = paid >= room.rent && room.rent > 0 ? "success" : paid > 0 ? "warning" : "danger";
                const payLabel = paid >= room.rent && room.rent > 0 ? "Lunas" : paid > 0 ? "Sebagian" : "Belum Bayar";
                const open = openRoom === room.id;
                return (
                  <div key={room.id} className="card-surface overflow-hidden">
                    <button
                      onClick={() => setOpenRoom(open ? null : room.id)}
                      className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4 text-left"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-bold">{room.name}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {tenant ? tenant.name : "Tanpa penghuni"} · {formatMoney(room.rent, currency)}/bln
                        </p>
                      </div>
                      <Badge tone={statusTone(room.status)}>{room.status}</Badge>
                    </button>
                    {open ? (
                      <div className="space-y-2 border-t border-border p-4 text-sm">
                        <Row label="Status bayar bulan ini" value={<Badge tone={payTone}>{payLabel}</Badge>} />
                        <Row label="Terbayar" value={formatMoney(paid, currency)} />
                        <Row label="Masuk" value={formatDate(tenant?.moveInDate)} />
                        <Row label="Jatuh tempo" value={tenant?.dueDate ? formatDate(tenant.dueDate) : "-"} />
                        <Row label="Catatan" value={room.notes || "-"} />
                        <div className="flex gap-2 pt-2">
                          <Button size="sm" variant="ghost" className="flex-1" onClick={() => setRoomSheet(room)}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            className="flex-1"
                            onClick={() => setConfirm({ coll: "rooms", id: room.id })}
                          >
                            Hapus
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )
        ) : tenants.length === 0 ? (
          <EmptyState icon="👤" title="Belum ada penghuni" hint="Tekan Tambah untuk mendata penghuni." />
        ) : (
          <div className="space-y-3">
            {tenants.map((t) => (
              <div key={t.id} className="card-surface p-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{t.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {rooms.find((r) => r.id === t.roomId)?.name ?? "Belum ada kamar"} ·{" "}
                      {t.phone || "tanpa telepon"}
                    </p>
                  </div>
                  <Badge tone="primary">{formatMoney(t.rent, currency)}</Badge>
                </div>
                <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
                  <Row label="Masuk" value={formatDate(t.moveInDate)} />
                  <Row label="Jatuh tempo" value={t.dueDate ? formatDate(t.dueDate) : "-"} />
                  <Row label="Deposit" value={formatMoney(t.deposit ?? 0, currency)} />
                  <Row label="Catatan" value={t.notes || "-"} />
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="ghost" className="flex-1" onClick={() => setTenantSheet(t)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    className="flex-1"
                    onClick={() => setConfirm({ coll: "tenants", id: t.id })}
                  >
                    Hapus
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Sheet
        open={!!roomSheet}
        title={roomSheet?.id ? "Edit Kamar" : "Tambah Kamar"}
        onClose={() => setRoomSheet(null)}
      >
        <div className="space-y-3">
          <Field label="Nomor / nama kamar">
            <Input
              value={roomSheet?.name ?? ""}
              onChange={(e) => setRoomSheet({ ...roomSheet, name: e.target.value })}
              placeholder="Kamar A1"
            />
          </Field>
          <Field label="Sewa per bulan">
            <Input
              type="number"
              inputMode="numeric"
              value={roomSheet?.rent ?? ""}
              onChange={(e) => setRoomSheet({ ...roomSheet, rent: Number(e.target.value) })}
              placeholder="800000"
            />
          </Field>
          <Field label="Status">
            <Select
              value={roomSheet?.status ?? "Kosong"}
              onChange={(e) => setRoomSheet({ ...roomSheet, status: e.target.value as RoomStatus })}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Penghuni">
            <Select
              value={roomSheet?.tenantId ?? ""}
              onChange={(e) => setRoomSheet({ ...roomSheet, tenantId: e.target.value })}
            >
              <option value="">Tanpa penghuni</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Catatan">
            <Textarea
              value={roomSheet?.notes ?? ""}
              onChange={(e) => setRoomSheet({ ...roomSheet, notes: e.target.value })}
            />
          </Field>
          <Button className="w-full" onClick={saveRoom}>
            Simpan
          </Button>
        </div>
      </Sheet>

      <Sheet
        open={!!tenantSheet}
        title={tenantSheet?.id ? "Edit Penghuni" : "Tambah Penghuni"}
        onClose={() => setTenantSheet(null)}
      >
        <div className="space-y-3">
          <Field label="Nama">
            <Input
              value={tenantSheet?.name ?? ""}
              onChange={(e) => setTenantSheet({ ...tenantSheet, name: e.target.value })}
            />
          </Field>
          <Field label="Nomor telepon">
            <Input
              inputMode="tel"
              value={tenantSheet?.phone ?? ""}
              onChange={(e) => setTenantSheet({ ...tenantSheet, phone: e.target.value })}
            />
          </Field>
          <Field label="Kamar">
            <Select
              value={tenantSheet?.roomId ?? ""}
              onChange={(e) => {
                const roomId = e.target.value;
                const room = rooms.find((r) => r.id === roomId);
                setTenantSheet({
                  ...tenantSheet,
                  roomId,
                  rent: tenantSheet?.rent || room?.rent || 0,
                });
              }}
            >
              <option value="">Belum ditentukan</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Sewa per bulan">
            <Input
              type="number"
              inputMode="numeric"
              value={tenantSheet?.rent ?? ""}
              onChange={(e) => setTenantSheet({ ...tenantSheet, rent: Number(e.target.value) })}
            />
          </Field>
          <Field label="Tanggal masuk">
            <Input
              type="date"
              value={tenantSheet?.moveInDate ?? ""}
              onChange={(e) => setTenantSheet({ ...tenantSheet, moveInDate: e.target.value })}
            />
          </Field>
          <Field label="Jatuh tempo">
            <Input
              type="date"
              value={tenantSheet?.dueDate ?? ""}
              onChange={(e) => setTenantSheet({ ...tenantSheet, dueDate: e.target.value })}
            />
          </Field>
          <Field label="Deposit">
            <Input
              type="number"
              inputMode="numeric"
              value={tenantSheet?.deposit ?? ""}
              onChange={(e) => setTenantSheet({ ...tenantSheet, deposit: Number(e.target.value) })}
            />
          </Field>
          <Field label="Catatan">
            <Textarea
              value={tenantSheet?.notes ?? ""}
              onChange={(e) => setTenantSheet({ ...tenantSheet, notes: e.target.value })}
            />
          </Field>
          <Button className="w-full" onClick={saveTenant}>
            Simpan
          </Button>
        </div>
      </Sheet>

      <ConfirmDialog
        open={!!confirm}
        title="Hapus data ini?"
        message="Data yang dihapus tidak bisa dikembalikan."
        onCancel={() => setConfirm(null)}
        onConfirm={doDelete}
      />
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right font-medium">{value}</span>
    </div>
  );
}

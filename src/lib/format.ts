export function formatMoney(value: number, currency = "IDR") {
  const n = Number.isFinite(value) ? value : 0;
  if (currency === "IDR") return "Rp " + Math.round(n).toLocaleString("id-ID");
  return currency + " " + Math.round(n).toLocaleString("id-ID");
}

export function formatDate(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  if (!y || !m) return key;
  return new Date(y, m - 1, 1).toLocaleDateString("id-ID", { month: "short", year: "numeric" });
}

export function lastMonths(count: number) {
  const out: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    out.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  }
  return out;
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

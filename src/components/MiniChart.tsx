import { formatMoney, monthLabel } from "@/lib/format";

export interface ChartRow {
  month: string;
  income: number;
  expense: number;
  profit: number;
}

export function MiniChart({ rows, currency }: { rows: ChartRow[]; currency: string }) {
  const max = Math.max(1, ...rows.flatMap((r) => [r.income, r.expense]));

  return (
    <div className="card-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-semibold">Grafik Bulanan</h3>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <i className="h-2.5 w-2.5 rounded-sm bg-primary" /> Masuk
          </span>
          <span className="flex items-center gap-1">
            <i className="h-2.5 w-2.5 rounded-sm bg-destructive" /> Keluar
          </span>
        </div>
      </div>
      <div className="flex items-end justify-between gap-2">
        {rows.map((r) => (
          <div key={r.month} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div className="flex h-28 w-full items-end justify-center gap-1">
              <div
                className="w-1/3 rounded-t bg-primary"
                style={{ height: `${Math.max(2, (r.income / max) * 100)}%` }}
              />
              <div
                className="w-1/3 rounded-t bg-destructive"
                style={{ height: `${Math.max(2, (r.expense / max) * 100)}%` }}
              />
            </div>
            <span className="truncate text-[10px] text-muted-foreground">
              {monthLabel(r.month).split(" ")[0]}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
        {rows.slice(-3).map((r) => (
          <div key={r.month} className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">{monthLabel(r.month)}</span>
            <span className={r.profit >= 0 ? "font-semibold text-success" : "font-semibold text-destructive"}>
              {formatMoney(r.profit, currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

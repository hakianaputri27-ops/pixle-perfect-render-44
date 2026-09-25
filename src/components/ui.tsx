import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("card-surface p-4", className)}>{children}</div>;
}

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground active:opacity-90",
  secondary: "bg-secondary text-secondary-foreground active:opacity-90",
  ghost: "bg-transparent text-foreground border border-border active:bg-muted",
  danger: "bg-destructive text-destructive-foreground active:opacity-90",
};

export function Button({
  variant = "primary",
  className,
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "md" | "sm" }) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-opacity disabled:opacity-50",
        size === "md" ? "min-h-12 px-5 text-[15px]" : "min-h-9 px-3 text-sm",
        variants[variant],
        className,
      )}
    />
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

const controlClass =
  "w-full rounded-xl border border-input bg-card px-3.5 py-3 text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(controlClass, className)} />;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...props} className={cn(controlClass, className)} />;
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn(controlClass, "appearance-none", className)}>
      {children}
    </select>
  );
}

export function Sheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <button
        aria-label="Tutup"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div className="relative z-10 max-h-[88vh] w-full overflow-y-auto rounded-t-3xl bg-card p-5 pb-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="truncate text-lg font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  onCancel,
  onConfirm,
  confirmLabel = "Hapus",
}: {
  open: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center px-6">
      <button aria-label="Batal" onClick={onCancel} className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-card p-5">
        <h3 className="text-base font-bold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <div className="mt-5 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onCancel}>
            Batal
          </Button>
          <Button variant="danger" className="flex-1" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Badge({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "success" | "warning" | "danger" | "primary";
}) {
  const tones = {
    muted: "bg-muted text-muted-foreground",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning-foreground dark:text-warning",
    danger: "bg-destructive/15 text-destructive",
    primary: "bg-primary-soft text-primary",
  } as const;
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone])}>
      {children}
    </span>
  );
}

export function EmptyState({
  icon = "📭",
  title,
  hint,
}: {
  icon?: string;
  title: string;
  hint?: string;
}) {
  return (
    <div className="card-surface flex flex-col items-center px-6 py-10 text-center">
      <span className="text-3xl">{icon}</span>
      <p className="mt-3 font-semibold">{title}</p>
      {hint ? <p className="mt-1 text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function SegmentedTabs<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-muted p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "min-w-0 flex-1 truncate rounded-lg px-2 py-2.5 text-sm font-semibold transition-colors",
            value === o.value
              ? "bg-card text-primary shadow-sm"
              : "text-muted-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

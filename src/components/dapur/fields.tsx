"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { MinusIcon, PlusIcon } from "@/components/ui/Icons";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

export const inputClass =
  "h-11 w-full rounded-xl border border-sand bg-white px-3.5 text-[0.95rem] text-espresso transition-colors " +
  "placeholder:text-ink-muted/60 hover:border-caramel-300 focus:border-caramel-500 focus-visible:outline-offset-1";

type FieldProps = {
  label: string;
  /** Petunjuk singkat di bawah isian */
  hint?: ReactNode;
  optional?: boolean;
  className?: string;
  children: ReactNode;
};

/** Label + isian. Isian cukup ditaruh sebagai anak: <label> membungkusnya, jadi tidak perlu id. */
export function Field({ label, hint, optional, className, children }: FieldProps) {
  return (
    <label className={cn("grid content-start gap-1.5", className)}>
      <span className="text-sm font-bold text-espresso">
        {label}
        {optional ? <span className="ml-1.5 font-medium text-ink-muted">(opsional)</span> : null}
      </span>
      {children}
      {hint ? <span className="text-xs leading-snug text-ink-muted">{hint}</span> : null}
    </label>
  );
}

export function TextInput({ className, ...props }: ComponentPropsWithoutRef<"input">) {
  return <input className={cn(inputClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentPropsWithoutRef<"textarea">) {
  return <textarea rows={2} className={cn(inputClass, "h-auto min-h-[4.5rem] resize-y py-2.5", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentPropsWithoutRef<"select">) {
  return <select className={cn(inputClass, "pr-8", className)} {...props} />;
}

type MoneyInputProps = Omit<ComponentPropsWithoutRef<"input">, "value" | "onChange" | "type"> & {
  value: number;
  onChange: (value: number) => void;
};

/** Isian rupiah: mengetik "15000" tampil "15.000". Nilainya selalu angka bulat. */
export function MoneyInput({ value, onChange, className, ...props }: MoneyInputProps) {
  return (
    <span className="relative block">
      <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm font-semibold text-ink-muted">
        Rp
      </span>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="0"
        value={value ? formatNumber(value) : ""}
        onChange={(event) => onChange(Number(event.target.value.replace(/\D/g, "").slice(0, 10)))}
        className={cn(inputClass, "pl-10 tabular-nums", className)}
        {...props}
      />
    </span>
  );
}

/** "0,5" / "0.5" / "1.5" → angka. Tulisan yang bukan angka → NaN. */
export function parseQty(text: string): number {
  const normalized = text.trim().replace(",", ".");
  return normalized === "" ? 0 : Number(normalized);
}

type QtyInputProps = Omit<ComponentPropsWithoutRef<"input">, "value" | "onChange" | "type"> & {
  /** Teks apa adanya: pecahan ditulis dengan koma atau titik */
  value: string;
  onChange: (value: string) => void;
  unit?: string;
};

/** Isian jumlah bahan (boleh pecahan), dengan satuan di kanan. */
export function QtyInput({ value, onChange, unit, className, ...props }: QtyInputProps) {
  return (
    <span className="relative block">
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder="0"
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/[^\d.,]/g, "").slice(0, 10))}
        className={cn(inputClass, "tabular-nums", unit && "pr-24", className)}
        {...props}
      />
      {unit ? (
        <span aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3.5 max-w-[4.5rem] -translate-y-1/2 truncate text-sm text-ink-muted">
          {unit}
        </span>
      ) : null}
    </span>
  );
}

type StepperProps = {
  value: number;
  onChange: (value: number) => void;
  /** Nama barang, untuk pembaca layar: "Kurangi Puding Karamel" */
  label: string;
};

/** Tombol − angka + untuk jumlah porsi. */
export function Stepper({ value, onChange, label }: StepperProps) {
  const button =
    "grid size-10 shrink-0 place-items-center rounded-full border border-sand bg-white text-espresso transition-colors hover:border-caramel-300 hover:bg-caramel-50 disabled:opacity-40";
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" className={button} disabled={value <= 0} onClick={() => onChange(Math.max(0, value - 1))} aria-label={`Kurangi ${label}`}>
        <MinusIcon className="size-4" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        aria-label={`Jumlah ${label}`}
        value={value}
        onChange={(event) => onChange(Math.min(9999, Number(event.target.value.replace(/\D/g, ""))))}
        onFocus={(event) => event.target.select()}
        className="h-10 w-12 rounded-xl border border-transparent bg-transparent text-center text-base font-bold tabular-nums hover:border-sand focus:border-caramel-500 focus:bg-white"
      />
      <button type="button" className={button} onClick={() => onChange(Math.min(9999, value + 1))} aria-label={`Tambah ${label}`}>
        <PlusIcon className="size-4" />
      </button>
    </div>
  );
}

/** Pilihan dua-tiga opsi berdampingan (mis. Ambil sendiri / Diantar). */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ReadonlyArray<{ id: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex gap-1 rounded-full bg-custard p-1">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={option.id === value}
          onClick={() => onChange(option.id)}
          className={cn(
            "h-9 flex-1 rounded-full px-3 text-sm font-bold whitespace-nowrap transition-colors",
            option.id === value ? "bg-white text-espresso shadow-soft" : "text-ink-muted hover:text-espresso",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

type FormFooterProps = {
  pending: boolean;
  error: string | null;
  onCancel: () => void;
  submitLabel: string;
  /** Ringkasan di kiri tombol, mis. total pesanan */
  children?: ReactNode;
};

/** Baris bawah form: pesan error, ringkasan, tombol Batal & Simpan. */
export function FormFooter({ pending, error, onCancel, submitLabel, children }: FormFooterProps) {
  return (
    <div className="mt-6 grid gap-4">
      <p role="alert" className={cn("rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-800", !error && "hidden")}>
        {error}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">{children}</div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={pending}>
            Batal
          </Button>
          <Button type="submit" size="sm" disabled={pending} className="sm:min-w-32">
            {pending ? "Menyimpan…" : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

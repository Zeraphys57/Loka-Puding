import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  orderStatusLabels,
  paymentStatusLabels,
  stockStatusLabels,
  type OrderStatus,
  type PaymentStatus,
  type StockStatus,
} from "@/lib/dapur/types";
import { formatRupiah } from "@/lib/format";

/* Potongan tampilan Dapur yang dipakai di semua halaman (tanpa interaksi, aman untuk Server Component). */

export function PageHeader({ title, lead, children }: { title: string; lead?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl leading-[1.05] font-bold tracking-[-0.02em] text-espresso sm:text-4xl">{title}</h1>
        {lead ? <p className="mt-2 max-w-2xl text-ink-muted">{lead}</p> : null}
      </div>
      {children ? <div className="flex shrink-0 flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn("rounded-3xl border border-sand/80 bg-milk-50 p-5 sm:p-6", className)}>{children}</section>;
}

export function CardTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3">
      <h2 className="text-xl leading-tight font-bold tracking-[-0.01em] text-espresso">{children}</h2>
      {aside ? <div className="shrink-0 text-sm text-ink-muted">{aside}</div> : null}
    </div>
  );
}

/**
 * Satu angka utama: label, nilai, dan keterangan kecil.
 * Nilainya sengaja memakai font teks (bukan Fraunces) supaya angka cepat terbaca.
 */
export function StatTile({
  label,
  value,
  note,
  tone = "plain",
}: {
  label: string;
  value: string;
  note?: ReactNode;
  tone?: "plain" | "accent";
}) {
  return (
    <div
      className={cn(
        "@container rounded-3xl border p-4 sm:p-5",
        tone === "accent" ? "border-transparent bg-espresso text-milk-50" : "border-sand/80 bg-milk-50 text-espresso",
      )}
    >
      <p className={cn("text-sm font-semibold", tone === "accent" ? "text-caramel-200" : "text-ink-muted")}>{label}</p>
      {/* Ukuran angka mengikuti lebar kotak (cqi), supaya "Rp 1.350.000" tidak terpotong di HP */}
      <p className="mt-1.5 font-sans text-[clamp(1.05rem,13cqi,1.7rem)] leading-none font-semibold tracking-[-0.02em] whitespace-nowrap">
        {value}
      </p>
      {note ? <p className={cn("mt-2 text-sm", tone === "accent" ? "text-milk-50/75" : "text-ink-muted")}>{note}</p> : null}
    </div>
  );
}

/** "+ Rp 50.000" / "− Rp 20.000": tanda di depan angka, warna hanya penguat. */
export function SignedAmount({ kind, amount }: { kind: "in" | "out"; amount: number }) {
  return (
    <span className={cn("font-semibold whitespace-nowrap tabular-nums", kind === "in" ? "text-emerald-800" : "text-espresso")}>
      {kind === "in" ? "+" : "−"} {formatRupiah(amount)}
    </span>
  );
}

/* Warna status: hijau = beres, kuning = perlu perhatian, merah = bermasalah. Selalu disertai tulisan. */

type Tone = "info" | "progress" | "good" | "warn" | "bad" | "muted";

const pillTones: Record<Tone, string> = {
  info: "bg-sky-50 text-sky-900 ring-sky-200",
  progress: "bg-caramel-100 text-caramel-800 ring-caramel-200",
  good: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  warn: "bg-amber-50 text-amber-900 ring-amber-300",
  bad: "bg-red-50 text-red-800 ring-red-200",
  muted: "bg-espresso/5 text-ink-muted ring-espresso/10",
};

const dotTones: Record<Tone, string> = {
  info: "bg-sky-600",
  progress: "bg-caramel-500",
  good: "bg-emerald-600",
  warn: "bg-amber-500",
  bad: "bg-red-600",
  muted: "bg-ink-muted/60",
};

export function Pill({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap ring-1 ring-inset",
        pillTones[tone],
        className,
      )}
    >
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", dotTones[tone])} />
      {children}
    </span>
  );
}

export const orderStatusTones: Record<OrderStatus, Tone> = {
  new: "info",
  making: "progress",
  ready: "good",
  done: "muted",
  cancelled: "bad",
};

export function OrderStatusPill({ status }: { status: OrderStatus }) {
  return <Pill tone={orderStatusTones[status]}>{orderStatusLabels[status]}</Pill>;
}

const paymentTones: Record<PaymentStatus, Tone> = { unpaid: "bad", partial: "warn", paid: "good" };

export function PaymentPill({ status }: { status: PaymentStatus }) {
  return <Pill tone={paymentTones[status]}>{paymentStatusLabels[status]}</Pill>;
}

const stockTones: Record<StockStatus, Tone> = { ok: "good", low: "warn", empty: "bad" };

export function StockPill({ status }: { status: StockStatus }) {
  return <Pill tone={stockTones[status]}>{stockStatusLabels[status]}</Pill>;
}

const meterTones: Record<StockStatus, { track: string; fill: string }> = {
  ok: { track: "bg-emerald-100", fill: "bg-emerald-600" },
  low: { track: "bg-amber-100", fill: "bg-amber-500" },
  empty: { track: "bg-red-100", fill: "bg-red-600" },
};

/**
 * Batang isi stok. Penuh = dua kali stok minimum, jadi batas "menipis" jatuh tepat di tengah (garis kecil).
 * Hanya pelengkap: angka stok & statusnya selalu tertulis di sebelahnya.
 */
export function StockMeter({ stock, minStock, status }: { stock: number; minStock: number; status: StockStatus }) {
  const ratio = minStock > 0 ? Math.min(1, Math.max(0, stock / (minStock * 2))) : stock > 0 ? 1 : 0;
  const tone = meterTones[status];
  return (
    <span aria-hidden="true" className={cn("relative block h-2 w-full overflow-hidden rounded-full", tone.track)}>
      <span className={cn("absolute inset-y-0 left-0 rounded-full", tone.fill)} style={{ width: `${ratio * 100}%` }} />
      {minStock > 0 ? <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-milk-50" /> : null}
    </span>
  );
}

/** Tampilan saat belum ada catatan: menjelaskan apa yang bisa dicatat di sini, plus tombol pertama. */
export function EmptyState({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-caramel-300 bg-caramel-50/60 px-6 py-12 text-center">
      <h2 className="text-2xl leading-tight font-bold tracking-[-0.01em] text-espresso">{title}</h2>
      <p className="mt-2 max-w-md text-ink-muted">{children}</p>
      {action ? <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}

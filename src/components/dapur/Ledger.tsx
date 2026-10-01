"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/dapur/Dialog";
import { TransactionDialog } from "@/components/dapur/TransactionDialog";
import { SignedAmount } from "@/components/dapur/ui";
import { PencilIcon, TrashIcon } from "@/components/ui/Icons";
import { cn } from "@/lib/cn";
import { deleteTransaction } from "@/lib/dapur/actions";
import type { LedgerRow } from "@/lib/dapur/calc";
import { formatDueDate } from "@/lib/dapur/dates";
import type { MenuOption } from "@/lib/dapur/types";
import { formatRupiah } from "@/lib/format";

const iconButton =
  "grid size-9 shrink-0 place-items-center rounded-full text-ink-muted transition-colors hover:bg-caramel-50 hover:text-espresso";

const DELETE_NOTES: Record<LedgerRow["source"], string> = {
  manual: "Catatan ini akan dihapus permanen dari pembukuan.",
  order: "Pembayaran ini juga dihapus dari pre-order-nya, jadi sisa tagihan pesanan itu bertambah lagi.",
  stock: "Catatan belanja ini juga dihapus dari stok bahan, jadi stoknya berkurang lagi.",
};

type LedgerProps = {
  /** Transaksi yang ditampilkan, terbaru dulu */
  rows: LedgerRow[];
  menu: MenuOption[];
  today: string;
};

/** Buku kas: transaksi per hari, dengan ubah (catatan manual) dan hapus. */
export function Ledger({ rows, menu, today }: LedgerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const editing = rows.find((row) => row.id === editingId);
  const deleting = rows.find((row) => row.id === deletingId);

  const days = new Map<string, LedgerRow[]>();
  for (const row of rows) days.set(row.date, [...(days.get(row.date) ?? []), row]);

  return (
    <div className="grid gap-5">
      {[...days].map(([date, dayRows]) => {
        const income = dayRows.reduce((sum, row) => sum + (row.kind === "in" ? row.amount : 0), 0);
        const expense = dayRows.reduce((sum, row) => sum + (row.kind === "out" ? row.amount : 0), 0);
        return (
          <section key={date} aria-label={formatDueDate(date, today)}>
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-1">
              <h3 className="font-sans text-sm font-bold text-espresso">{formatDueDate(date, today)}</h3>
              <p className="text-xs text-ink-muted tabular-nums">
                {income > 0 ? `Masuk ${formatRupiah(income)}` : ""}
                {income > 0 && expense > 0 ? " · " : ""}
                {expense > 0 ? `Keluar ${formatRupiah(expense)}` : ""}
              </p>
            </div>
            <ul className="divide-y divide-sand/70 rounded-2xl border border-sand/80 bg-white">
              {dayRows.map((row) => (
                <li key={row.id} className="flex items-center gap-2 py-2.5 pr-2 pl-4">
                  <div className="min-w-0 flex-1">
                    <p className="leading-snug font-semibold break-words text-espresso">{row.title}</p>
                    {row.subtitle ? <p className="text-sm break-words text-ink-muted">{row.subtitle}</p> : null}
                  </div>
                  <SignedAmount kind={row.kind} amount={row.amount} />
                  <div className="flex w-[4.5rem] shrink-0 justify-end">
                    {row.source === "manual" ? (
                      <button type="button" onClick={() => setEditingId(row.id)} aria-label={`Ubah catatan ${row.title}`} className={iconButton}>
                        <PencilIcon className="size-[1.05rem]" />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setDeletingId(row.id)}
                      aria-label={`Hapus catatan ${row.title}`}
                      className={cn(iconButton, "hover:bg-red-50 hover:text-red-700")}
                    >
                      <TrashIcon className="size-[1.05rem]" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <TransactionDialog open={editing !== undefined} onClose={() => setEditingId(null)} menu={menu} today={today} transaction={editing} />
      <ConfirmDialog
        open={deleting !== undefined}
        onClose={() => setDeletingId(null)}
        action={() => deleteTransaction(deletingId ?? "")}
        title="Hapus catatan ini?"
        confirmLabel="Hapus catatan"
      >
        {deleting ? (
          <>
            <p className="font-semibold text-espresso">
              {deleting.title} · {deleting.kind === "in" ? "+" : "−"} {formatRupiah(deleting.amount)}
            </p>
            <p className="mt-1">{DELETE_NOTES[deleting.source]}</p>
          </>
        ) : null}
      </ConfirmDialog>
    </div>
  );
}

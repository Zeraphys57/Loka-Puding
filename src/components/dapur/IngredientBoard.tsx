"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/dapur/Dialog";
import { AdjustDialog, IngredientDialog, StockDialog } from "@/components/dapur/StockDialogs";
import { EmptyState, StockMeter, StockPill } from "@/components/dapur/ui";
import { Button } from "@/components/ui/Button";
import { BagIcon, MinusIcon, PencilIcon, PlusIcon, TrashIcon } from "@/components/ui/Icons";
import { cn } from "@/lib/cn";
import { deleteIngredient, deleteMovement } from "@/lib/dapur/actions";
import type { IngredientView, MovementView } from "@/lib/dapur/calc";
import { formatDueDate } from "@/lib/dapur/dates";
import { stockMovementLabels } from "@/lib/dapur/types";
import { formatNumber, formatRupiah } from "@/lib/format";

const iconButton =
  "grid size-9 shrink-0 place-items-center rounded-full text-ink-muted transition-colors hover:bg-caramel-50 hover:text-espresso";

type IngredientBoardProps = {
  ingredients: IngredientView[];
  /** Riwayat stok terbaru (belanja, pemakaian, koreksi), terbaru dulu */
  movements: MovementView[];
  today: string;
};

/** Stok bahan: daftar bahan + statusnya, catat belanja/pemakaian, koreksi, dan riwayat. */
export function IngredientBoard({ ingredients, movements, today }: IngredientBoardProps) {
  // Hanya id yang disimpan: datanya selalu diambil dari props terbaru setelah disimpan
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [stockKind, setStockKind] = useState<"purchase" | "usage" | null>(null);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingMovementId, setDeletingMovementId] = useState<string | null>(null);

  const find = (id: string | null) => ingredients.find((ingredient) => ingredient.id === id) ?? null;
  const deleting = find(deletingId);
  const deletingMovement = movements.find((movement) => movement.id === deletingMovementId) ?? null;

  const ingredientDialog = (
    <IngredientDialog
      open={editing !== null}
      onClose={() => setEditing(null)}
      ingredient={editing && editing !== "new" ? (find(editing) ?? undefined) : undefined}
    />
  );

  if (ingredients.length === 0) {
    return (
      <>
        <EmptyState
          title="Belum ada bahan"
          action={
            <Button onClick={() => setEditing("new")}>
              <PlusIcon />
              Tambah bahan pertama
            </Button>
          }
        >
          Daftarkan bahan yang ingin dipantau (susu, gula, biskuit Regal, popcorn, cup…). Setelah itu tinggal catat
          belanja dan pemakaiannya, dan Dapur memberi tahu kalau ada yang menipis.
        </EmptyState>
        {ingredientDialog}
      </>
    );
  }

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => setStockKind("purchase")}>
          <BagIcon />
          Catat belanja
        </Button>
        <Button size="sm" variant="soft" onClick={() => setStockKind("usage")}>
          <MinusIcon />
          Catat pemakaian
        </Button>
        <Button size="sm" variant="outline" onClick={() => setEditing("new")}>
          <PlusIcon />
          Tambah bahan
        </Button>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {ingredients.map((ingredient) => (
          <li key={ingredient.id} className="flex flex-col gap-3 rounded-3xl border border-sand/80 bg-milk-50 p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="min-w-0 text-xl leading-tight font-bold break-words text-espresso">{ingredient.name}</h2>
              <StockPill status={ingredient.status} />
            </div>

            <p className="font-sans text-[1.7rem] leading-none font-semibold tracking-[-0.02em] text-espresso">
              {formatNumber(ingredient.stock)} <span className="text-base font-medium text-ink-muted">{ingredient.unit}</span>
            </p>

            {ingredient.minStock > 0 ? (
              <div className="grid gap-1.5">
                <StockMeter stock={ingredient.stock} minStock={ingredient.minStock} status={ingredient.status} />
                <p className="text-sm text-ink-muted">
                  Batas menipis: {formatNumber(ingredient.minStock)} {ingredient.unit}
                </p>
              </div>
            ) : (
              <p className="text-sm text-ink-muted">Belum ada batas menipis.</p>
            )}

            <div className="mt-auto flex items-center gap-1 border-t border-sand/70 pt-3">
              <p className="min-w-0 flex-1 text-sm text-ink-muted">
                {ingredient.unitPrice === null ? (
                  "Belum pernah belanja"
                ) : (
                  <>
                    Terakhir{" "}
                    <span className="font-semibold text-espresso">
                      {formatRupiah(Math.round(ingredient.unitPrice))}/{ingredient.unit}
                    </span>
                  </>
                )}
              </p>
              <Button size="sm" variant="soft" onClick={() => setAdjustingId(ingredient.id)}>
                Koreksi
              </Button>
              <button type="button" onClick={() => setEditing(ingredient.id)} aria-label={`Ubah ${ingredient.name}`} className={iconButton}>
                <PencilIcon className="size-[1.05rem]" />
              </button>
              <button
                type="button"
                onClick={() => setDeletingId(ingredient.id)}
                aria-label={`Hapus ${ingredient.name}`}
                className={cn(iconButton, "hover:bg-red-50 hover:text-red-700")}
              >
                <TrashIcon className="size-[1.05rem]" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <section aria-labelledby="stock-history-title">
        <h2 id="stock-history-title" className="mb-3 text-xl leading-tight font-bold tracking-[-0.01em] text-espresso">
          Riwayat stok
        </h2>
        {movements.length === 0 ? (
          <p className="rounded-2xl border border-sand/80 bg-milk-50 px-5 py-6 text-ink-muted">
            Belum ada catatan. Mulai dari &ldquo;Catat belanja&rdquo; setiap pulang dari pasar.
          </p>
        ) : (
          <ul className="divide-y divide-sand/70 rounded-2xl border border-sand/80 bg-white">
            {movements.map((movement) => (
              <li key={movement.id} className="flex items-center gap-2 py-2.5 pr-2 pl-4">
                <div className="min-w-0 flex-1">
                  <p className="leading-snug font-semibold break-words text-espresso">
                    {movement.ingredientName}{" "}
                    <span className="font-medium text-ink-muted">· {stockMovementLabels[movement.kind]}</span>
                  </p>
                  <p className="text-sm break-words text-ink-muted">
                    {formatDueDate(movement.date, today)}
                    {movement.cost ? ` · ${formatRupiah(movement.cost)}` : ""}
                    {movement.note ? ` · ${movement.note}` : ""}
                  </p>
                </div>
                <span className="font-semibold whitespace-nowrap text-espresso tabular-nums">
                  {movement.qty > 0 ? "+" : "−"} {formatNumber(Math.abs(movement.qty))} {movement.unit}
                </span>
                <button
                  type="button"
                  onClick={() => setDeletingMovementId(movement.id)}
                  aria-label={`Hapus catatan ${stockMovementLabels[movement.kind]} ${movement.ingredientName}`}
                  className={cn(iconButton, "hover:bg-red-50 hover:text-red-700")}
                >
                  <TrashIcon className="size-[1.05rem]" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {ingredientDialog}
      <StockDialog kind={stockKind} onClose={() => setStockKind(null)} ingredients={ingredients} today={today} />
      <AdjustDialog ingredient={find(adjustingId)} onClose={() => setAdjustingId(null)} today={today} />

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeletingId(null)}
        action={() => deleteIngredient(deletingId ?? "")}
        title={deleting ? `Hapus ${deleting.name}?` : "Hapus bahan?"}
        confirmLabel="Hapus bahan"
      >
        <p>Bahan ini dan seluruh riwayat stoknya akan dihapus. Pengeluaran belanjanya tetap tercatat di pembukuan.</p>
      </ConfirmDialog>

      <ConfirmDialog
        open={deletingMovement !== null}
        onClose={() => setDeletingMovementId(null)}
        action={() => deleteMovement(deletingMovementId ?? "")}
        title="Hapus catatan stok ini?"
        confirmLabel="Hapus catatan"
      >
        {deletingMovement ? (
          <>
            <p className="font-semibold text-espresso">
              {deletingMovement.ingredientName} · {stockMovementLabels[deletingMovement.kind]} {deletingMovement.qty > 0 ? "+" : "−"}{" "}
              {formatNumber(Math.abs(deletingMovement.qty))} {deletingMovement.unit}
            </p>
            <p className="mt-1">
              Stok dihitung ulang tanpa catatan ini.
              {deletingMovement.cost ? ` Pengeluaran ${formatRupiah(deletingMovement.cost)} di pembukuan ikut dihapus.` : ""}
            </p>
          </>
        ) : null}
      </ConfirmDialog>
    </div>
  );
}

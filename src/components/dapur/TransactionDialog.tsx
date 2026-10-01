"use client";

import { useState, type FormEvent } from "react";
import { Dialog } from "@/components/dapur/Dialog";
import { Field, FormFooter, MoneyInput, Segmented, Select, Stepper, TextInput } from "@/components/dapur/fields";
import { useSave } from "@/components/dapur/useSave";
import { saveTransaction } from "@/lib/dapur/actions";
import { itemsCount, itemsTotal } from "@/lib/dapur/calc";
import { transactionCategories, type MenuOption, type Transaction, type TransactionCategory } from "@/lib/dapur/types";
import { formatRupiah } from "@/lib/format";

/** Tiga jenis catatan pembukuan yang diisi manual. */
export type TransactionMode = "sale" | "in" | "out";

const MODES = [
  { id: "sale", label: "Penjualan" },
  { id: "in", label: "Uang masuk lain" },
  { id: "out", label: "Pengeluaran" },
] as const;

// Kategori yang bisa dipilih per jenis. Penjualan punya tab sendiri; pembayaran pre-order dicatat otomatis.
const manualCategories = (transactionCategories as readonly TransactionCategory[]).filter(
  (category) => !category.automatic && category.id !== "sales",
);
const CATEGORY_OPTIONS = {
  in: manualCategories.filter((category) => category.kind === "in"),
  out: manualCategories.filter((category) => category.kind === "out"),
};

function modeOf(transaction: Transaction): TransactionMode {
  if (transaction.category === "sales") return "sale";
  return transaction.kind;
}

type TransactionDialogProps = {
  open: boolean;
  onClose: () => void;
  menu: MenuOption[];
  today: string;
  /** Jenis yang terpilih saat dibuka (catatan baru) */
  mode?: TransactionMode;
  /** Diisi = mengubah transaksi ini */
  transaction?: Transaction;
};

export function TransactionDialog({ open, onClose, menu, today, mode = "sale", transaction }: TransactionDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={transaction ? "Ubah catatan" : "Catat uang masuk / keluar"}>
      <TransactionForm onClose={onClose} menu={menu} today={today} mode={mode} transaction={transaction} />
    </Dialog>
  );
}

function TransactionForm({
  onClose,
  menu,
  today,
  mode: initialMode,
  transaction,
}: Omit<TransactionDialogProps, "open"> & { mode: TransactionMode }) {
  // Menu yang sudah dihapus dari katalog tetap muncul kalau ada di catatan lama, dengan harga saat dijual
  const soldItems = transaction?.items ?? [];
  const rows: MenuOption[] = [
    ...menu.map((item) => {
      const sold = soldItems.find((line) => line.menuId === item.id);
      return sold ? { ...item, name: sold.name, price: sold.price } : item;
    }),
    ...soldItems
      .filter((line) => !menu.some((item) => item.id === line.menuId))
      .map((line) => ({ id: line.menuId, name: line.name, price: line.price })),
  ];

  const [mode, setMode] = useState<TransactionMode>(transaction ? modeOf(transaction) : initialMode);
  const [qty, setQty] = useState<Record<string, number>>(() => Object.fromEntries(soldItems.map((line) => [line.menuId, line.qty])));
  // null = ikut total menu. Angka = uang yang benar-benar diterima (mis. setelah diskon).
  const [received, setReceived] = useState<number | null>(
    transaction && transaction.amount !== itemsTotal(soldItems) ? transaction.amount : null,
  );
  const [amount, setAmount] = useState(transaction?.amount ?? 0);
  const [categories, setCategories] = useState<{ in: string; out: string }>({
    in: transaction?.kind === "in" && transaction.category !== "sales" ? transaction.category : "other-in",
    out: transaction?.kind === "out" ? transaction.category : "",
  });
  const [date, setDate] = useState(transaction?.date ?? today);
  const [note, setNote] = useState(transaction?.note ?? "");
  const { pending, error, save } = useSave(onClose);

  const lines = rows.map((row) => ({ ...row, qty: qty[row.id] ?? 0 }));
  const menuTotal = itemsTotal(lines);
  const saleAmount = received ?? menuTotal;

  function submit(event: FormEvent) {
    event.preventDefault();
    save(() =>
      mode === "sale"
        ? saveTransaction({
            id: transaction?.id,
            kind: "in",
            category: "sales",
            amount: saleAmount,
            date,
            note,
            lines: lines.map((line) => ({ menuId: line.id, qty: line.qty })),
          })
        : saveTransaction({ id: transaction?.id, kind: mode, category: categories[mode], amount, date, note }),
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-5">
      <Segmented label="Jenis catatan" options={MODES} value={mode} onChange={setMode} />

      {mode === "sale" ? (
        <>
          <div role="group" aria-labelledby="sale-items-label" className="grid gap-2">
            <p id="sale-items-label" className="text-sm font-bold text-espresso">
              Yang terjual
            </p>
            {lines.map((line) => (
              <div key={line.id} className="flex items-center gap-3 rounded-2xl border border-sand/80 bg-white px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="leading-snug font-semibold text-espresso">{line.name}</p>
                  <p className="text-sm text-ink-muted">{formatRupiah(line.price)}</p>
                </div>
                <Stepper value={line.qty} onChange={(value) => setQty((current) => ({ ...current, [line.id]: value }))} label={line.name} />
              </div>
            ))}
          </div>
          <div className="grid gap-1.5">
            <Field
              label="Uang diterima"
              hint={
                received === null
                  ? `Mengikuti jumlah menu: ${itemsCount(lines)} pcs = ${formatRupiah(menuTotal)}. Ubah kalau ada diskon atau harga khusus.`
                  : `Diisi sendiri. Total menu: ${itemsCount(lines)} pcs = ${formatRupiah(menuTotal)}.`
              }
            >
              <MoneyInput value={saleAmount} onChange={setReceived} />
            </Field>
            {received !== null ? (
              <button
                type="button"
                onClick={() => setReceived(null)}
                className="justify-self-start rounded text-sm font-semibold text-caramel-700 underline decoration-caramel-300 decoration-2 underline-offset-4"
              >
                Samakan lagi dengan total menu
              </button>
            ) : null}
          </div>
        </>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kategori">
            <Select
              value={categories[mode]}
              onChange={(event) => setCategories((current) => ({ ...current, [mode]: event.target.value }))}
              required
            >
              {mode === "out" ? <option value="">Pilih kategori…</option> : null}
              {CATEGORY_OPTIONS[mode].map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Jumlah uang">
            <MoneyInput value={amount} onChange={setAmount} data-autofocus />
          </Field>
          {mode === "out" && categories.out === "ingredients" ? (
            <p className="rounded-xl bg-caramel-50 px-3.5 py-2.5 text-sm text-espresso sm:col-span-2">
              Bahan yang stoknya dipantau lebih baik dicatat lewat <strong>Bahan → Catat belanja</strong>: stoknya ikut
              bertambah dan pengeluarannya otomatis masuk ke sini.
            </p>
          ) : null}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tanggal">
          <TextInput type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
        </Field>
        <Field label="Keterangan" optional>
          <TextInput
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={200}
            placeholder={mode === "sale" ? "Mis. bazar sekolah, titip warung" : mode === "out" ? "Mis. gas 3 kg, cup 100 pcs" : ""}
          />
        </Field>
      </div>

      <FormFooter pending={pending} error={error} onCancel={onClose} submitLabel={transaction ? "Simpan perubahan" : "Simpan"} />
    </form>
  );
}

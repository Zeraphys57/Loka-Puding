"use client";

import { useState, type FormEvent } from "react";
import { Dialog } from "@/components/dapur/Dialog";
import { Field, FormFooter, MoneyInput, parseQty, QtyInput, TextInput } from "@/components/dapur/fields";
import { useSave } from "@/components/dapur/useSave";
import { cn } from "@/lib/cn";
import { adjustStock, recordStock, saveIngredient } from "@/lib/dapur/actions";
import { roundQty, type IngredientView } from "@/lib/dapur/calc";
import { formatNumber, formatRupiah } from "@/lib/format";

const UNITS = ["gram", "kg", "ml", "liter", "butir", "pcs", "bungkus", "kaleng", "sachet", "lembar"];

/* ------------------------------ Tambah / ubah bahan ------------------------------ */

type IngredientDialogProps = {
  open: boolean;
  onClose: () => void;
  /** Diisi = mengubah bahan ini */
  ingredient?: IngredientView;
};

export function IngredientDialog({ open, onClose, ingredient }: IngredientDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={ingredient ? `Ubah ${ingredient.name}` : "Tambah bahan"}
      description={ingredient ? undefined : "Bahan baku, topping, atau kemasan yang stoknya ingin dipantau."}
    >
      <IngredientForm onClose={onClose} ingredient={ingredient} />
    </Dialog>
  );
}

function IngredientForm({ onClose, ingredient }: Omit<IngredientDialogProps, "open">) {
  const [name, setName] = useState(ingredient?.name ?? "");
  const [unit, setUnit] = useState(ingredient?.unit ?? "");
  const [minStock, setMinStock] = useState(ingredient?.minStock ? formatNumber(ingredient.minStock) : "");
  const [initialStock, setInitialStock] = useState("");
  const { pending, error, save, setError } = useSave(onClose);

  function submit(event: FormEvent) {
    event.preventDefault();
    const min = parseQty(minStock);
    const initial = parseQty(initialStock);
    if (Number.isNaN(min) || Number.isNaN(initial)) {
      setError("Jumlah stok harus berupa angka, mis. 2 atau 0,5.");
      return;
    }
    save(() => saveIngredient({ id: ingredient?.id, name, unit, minStock: min, initialStock: ingredient ? undefined : initial }));
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
        <Field label="Nama bahan">
          <TextInput value={name} onChange={(event) => setName(event.target.value)} required maxLength={60} placeholder="Mis. Susu UHT" autoComplete="off" data-autofocus />
        </Field>
        <Field label="Satuan">
          <TextInput value={unit} onChange={(event) => setUnit(event.target.value)} required maxLength={20} placeholder="liter" list="dapur-units" autoComplete="off" />
          <datalist id="dapur-units">
            {UNITS.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {ingredient ? null : (
          <Field label="Stok sekarang" optional hint="Yang ada di dapur saat ini.">
            <QtyInput value={initialStock} onChange={setInitialStock} unit={unit} />
          </Field>
        )}
        <Field label="Stok minimum" optional hint="Kalau stok tinggal segini atau kurang, bahan ditandai menipis.">
          <QtyInput value={minStock} onChange={setMinStock} unit={unit} />
        </Field>
      </div>
      <FormFooter pending={pending} error={error} onCancel={onClose} submitLabel={ingredient ? "Simpan perubahan" : "Tambah bahan"} />
    </form>
  );
}

/* ------------------------------ Belanja / pemakaian (banyak bahan sekaligus) ------------------------------ */

type StockDialogProps = {
  /** `null` = tertutup */
  kind: "purchase" | "usage" | null;
  onClose: () => void;
  ingredients: IngredientView[];
  today: string;
};

const STOCK_COPY = {
  purchase: {
    title: "Catat belanja bahan",
    description: "Isi bahan yang dibeli saja. Stok bertambah dan pengeluarannya otomatis masuk pembukuan.",
    note: "Mis. Pasar Baru, Toko Sumber Rejeki",
    submit: "Simpan belanja",
  },
  usage: {
    title: "Catat pemakaian bahan",
    description: "Isi bahan yang terpakai saja, mis. setelah selesai produksi hari ini.",
    note: "Mis. produksi 40 cup",
    submit: "Simpan pemakaian",
  },
};

export function StockDialog({ kind, onClose, ingredients, today }: StockDialogProps) {
  const copy = kind ? STOCK_COPY[kind] : STOCK_COPY.purchase;
  return (
    <Dialog open={kind !== null} onClose={onClose} title={copy.title} description={copy.description} size="lg">
      {kind ? <StockForm kind={kind} onClose={onClose} ingredients={ingredients} today={today} /> : null}
    </Dialog>
  );
}

function StockForm({ kind, onClose, ingredients, today }: Omit<StockDialogProps, "kind"> & { kind: "purchase" | "usage" }) {
  const [qty, setQty] = useState<Record<string, string>>({});
  const [cost, setCost] = useState<Record<string, number>>({});
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const { pending, error, save, setError } = useSave(onClose);

  const copy = STOCK_COPY[kind];
  const isPurchase = kind === "purchase";
  const totalCost = Object.values(cost).reduce((sum, value) => sum + value, 0);
  // Urut nama, supaya posisi bahan tetap sama setiap kali form dibuka
  const rows = [...ingredients].sort((a, b) => a.name.localeCompare(b.name, "id"));
  const columns = cn("gap-x-3", isPurchase ? "sm:grid-cols-[minmax(0,1fr)_11rem_11rem]" : "sm:grid-cols-[minmax(0,1fr)_12rem]");

  function submit(event: FormEvent) {
    event.preventDefault();
    const lines = rows.map((ingredient) => ({
      ingredientId: ingredient.id,
      qty: parseQty(qty[ingredient.id] ?? ""),
      cost: isPurchase ? (cost[ingredient.id] ?? 0) : undefined,
      name: ingredient.name,
    }));
    const invalid = lines.find((line) => Number.isNaN(line.qty));
    if (invalid) {
      setError(`Jumlah ${invalid.name} harus berupa angka, mis. 2 atau 0,5.`);
      return;
    }
    save(() =>
      recordStock({
        kind,
        date,
        note,
        lines: lines.filter((line) => line.qty > 0 || line.cost).map(({ ingredientId, qty: amount, cost: price }) => ({ ingredientId, qty: amount, cost: price })),
      }),
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-5">
      <div className="grid gap-2">
        {/* Judul kolom (layar lebar). Di HP tiap isian punya petunjuk sendiri. */}
        <div aria-hidden="true" className={cn(columns, "hidden px-4 text-sm font-bold text-espresso sm:grid")}>
          <span>Bahan</span>
          <span>{isPurchase ? "Jumlah dibeli" : "Jumlah dipakai"}</span>
          {isPurchase ? <span>Total harga</span> : null}
        </div>
        {rows.map((ingredient, index) => (
          <div
            key={ingredient.id}
            className={cn(columns, "grid items-center gap-y-2 rounded-2xl border border-sand/80 bg-white px-4 py-3")}
          >
            <div className="min-w-0">
              <p className="leading-snug font-semibold break-words text-espresso">{ingredient.name}</p>
              <p className="text-sm text-ink-muted">
                Stok {formatNumber(ingredient.stock)} {ingredient.unit}
              </p>
            </div>
            <QtyInput
              value={qty[ingredient.id] ?? ""}
              onChange={(value) => setQty((current) => ({ ...current, [ingredient.id]: value }))}
              unit={ingredient.unit}
              aria-label={`Jumlah ${ingredient.name} (${ingredient.unit})`}
              data-autofocus={index === 0 ? "" : undefined}
            />
            {isPurchase ? (
              <MoneyInput
                value={cost[ingredient.id] ?? 0}
                onChange={(value) => setCost((current) => ({ ...current, [ingredient.id]: value }))}
                aria-label={`Total harga ${ingredient.name}`}
                placeholder="Total harga"
              />
            ) : null}
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tanggal">
          <TextInput type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
        </Field>
        <Field label="Keterangan" optional>
          <TextInput value={note} onChange={(event) => setNote(event.target.value)} maxLength={200} placeholder={copy.note} />
        </Field>
      </div>

      <FormFooter pending={pending} error={error} onCancel={onClose} submitLabel={copy.submit}>
        {isPurchase ? (
          <p className="text-sm text-ink-muted">
            Total belanja <strong className="text-lg font-semibold text-espresso">{formatRupiah(totalCost)}</strong>
          </p>
        ) : null}
      </FormFooter>
    </form>
  );
}

/* ------------------------------ Koreksi stok ------------------------------ */

type AdjustDialogProps = {
  /** Bahan yang dikoreksi; `null` = tertutup */
  ingredient: IngredientView | null;
  onClose: () => void;
  today: string;
};

export function AdjustDialog({ ingredient, onClose, today }: AdjustDialogProps) {
  return (
    <Dialog
      open={ingredient !== null}
      onClose={onClose}
      size="sm"
      title={ingredient ? `Koreksi stok ${ingredient.name}` : "Koreksi stok"}
      description="Hitung yang benar-benar ada di dapur, lalu isi jumlahnya. Selisihnya dicatat otomatis."
    >
      {ingredient ? <AdjustForm ingredient={ingredient} onClose={onClose} today={today} /> : null}
    </Dialog>
  );
}

function AdjustForm({ ingredient, onClose, today }: { ingredient: IngredientView; onClose: () => void; today: string }) {
  const [actual, setActual] = useState("");
  const [note, setNote] = useState("");
  const { pending, error, save, setError } = useSave(onClose);

  const parsed = parseQty(actual);
  const difference = actual.trim() === "" || Number.isNaN(parsed) ? null : roundQty(parsed - ingredient.stock);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (actual.trim() === "" || Number.isNaN(parsed)) {
      setError("Isi jumlah yang ada sekarang, mis. 2 atau 0,5.");
      return;
    }
    save(() => adjustStock({ ingredientId: ingredient.id, actual: parsed, date: today, note }));
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <p className="rounded-2xl bg-custard/70 px-4 py-3 text-sm text-ink-muted">
        Tercatat sekarang:{" "}
        <strong className="font-semibold text-espresso">
          {formatNumber(ingredient.stock)} {ingredient.unit}
        </strong>
      </p>
      <Field
        label="Jumlah sebenarnya"
        hint={
          difference === null
            ? undefined
            : difference === 0
              ? "Sama dengan yang tercatat."
              : `Selisih ${difference > 0 ? "+" : "−"}${formatNumber(Math.abs(difference))} ${ingredient.unit} dari yang tercatat.`
        }
      >
        <QtyInput value={actual} onChange={setActual} unit={ingredient.unit} data-autofocus />
      </Field>
      <Field label="Keterangan" optional>
        <TextInput value={note} onChange={(event) => setNote(event.target.value)} maxLength={200} placeholder="Mis. ada yang basi, tumpah" />
      </Field>
      <FormFooter pending={pending} error={error} onCancel={onClose} submitLabel="Simpan koreksi" />
    </form>
  );
}

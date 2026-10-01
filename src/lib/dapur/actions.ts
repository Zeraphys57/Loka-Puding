"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { menuItems } from "@/data/menu";
import { forgetDevice } from "@/lib/dapur/access";
import { itemsTotal, orderTotal, paidByOrder, roundQty, stockByIngredient } from "@/lib/dapur/calc";
import { isISODate, todayISO } from "@/lib/dapur/dates";
import { DapurError } from "@/lib/dapur/errors";
import { updateDb } from "@/lib/dapur/store";
import {
  getCategory,
  ORDER_STATUSES,
  type ActionResult,
  type Db,
  type Fulfillment,
  type OrderItem,
  type OrderStatus,
  type TransactionCategoryId,
  type TransactionKind,
} from "@/lib/dapur/types";
import { formatNumber, formatRupiah } from "@/lib/format";

/*
 * Semua perubahan catatan Dapur lewat file ini. Action di file ini bisa dipanggil siapa saja di internet
 * (bukan hanya lewat tombol di halaman), jadi setiap action:
 * 1. menolak kalau perangkatnya tidak terdaftar (dicek di dalam `updateDb`),
 * 2. memeriksa ulang semua isian (jangan percaya data dari browser),
 * 3. menyimpan, lalu menyegarkan semua halaman Dapur.
 */

/** Kesalahan isian: pesannya aman & berguna untuk ditampilkan di form. */
class InputError extends DapurError {}

async function run(change: (db: Db) => void): Promise<ActionResult> {
  try {
    await updateDb(change);
  } catch (error) {
    if (error instanceof DapurError) return { ok: false, error: error.message };
    // Rincian teknis (mis. database putus) hanya masuk log server
    console.error("[dapur]", error);
    return { ok: false, error: "Gagal menyimpan. Periksa koneksi internet, lalu coba lagi." };
  }
  revalidatePath("/dapur", "layout");
  return { ok: true };
}

/** Melupakan perangkat ini: Dapur baru bisa dibuka lagi di sini lewat link rahasia. */
export async function lockDevice(): Promise<void> {
  await forgetDevice();
  redirect("/");
}

/* ------------------------------ Pemeriksa isian ------------------------------ */

const MAX_MONEY = 1_000_000_000;
const MAX_QTY = 1_000_000;

function text(value: unknown, label: string, options: { max?: number; required?: boolean } = {}): string {
  const { max = 120, required = false } = options;
  const result = typeof value === "string" ? value.trim() : "";
  if (required && !result) throw new InputError(`${label} belum diisi.`);
  if (result.length > max) throw new InputError(`${label} terlalu panjang (maksimal ${max} huruf).`);
  return result;
}

/** Rupiah bulat, 0 atau lebih. */
function money(value: unknown, label: string, options: { positive?: boolean } = {}): number {
  const result = value === undefined || value === null || value === "" ? 0 : Number(value);
  if (!Number.isInteger(result) || result < 0 || result > MAX_MONEY) {
    throw new InputError(`${label} harus berupa angka rupiah yang benar.`);
  }
  if (options.positive && result === 0) throw new InputError(`${label} belum diisi.`);
  return result;
}

/** Jumlah bahan: boleh pecahan (0,5 kg), 0 atau lebih. */
function quantity(value: unknown, label: string): number {
  const result = value === undefined || value === null || value === "" ? 0 : Number(value);
  if (!Number.isFinite(result) || result < 0 || result > MAX_QTY) {
    throw new InputError(`${label} harus berupa angka yang benar.`);
  }
  return roundQty(result);
}

function date(value: unknown, label: string): string {
  if (typeof value !== "string" || !isISODate(value)) throw new InputError(`${label} belum diisi dengan benar.`);
  return value;
}

function list(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value) || value.length > 200) throw new InputError(`${label} tidak valid.`);
  return value;
}

type MenuLine = { menuId: string; qty: number };

/**
 * Baris menu dari form → item dengan nama & harga.
 * Harga diambil dari `snapshot` (pesanan lama) atau data menu di server, tidak pernah dari browser.
 */
function menuLines(value: unknown, snapshot: readonly OrderItem[] = []): OrderItem[] {
  const items: OrderItem[] = [];
  for (const raw of list(value, "Daftar menu")) {
    const line = raw as Partial<MenuLine> | null;
    const qty = Number(line?.qty);
    if (!Number.isInteger(qty) || qty < 0 || qty > 9999) throw new InputError("Jumlah menu harus berupa angka bulat.");
    if (qty === 0) continue;

    const source = snapshot.find((item) => item.menuId === line?.menuId) ?? menuItems.find((item) => item.id === line?.menuId);
    if (!source) throw new InputError("Ada menu yang tidak dikenal. Muat ulang halaman lalu coba lagi.");
    if (items.some((item) => item.menuId === line?.menuId)) throw new InputError("Ada menu yang tertulis dua kali.");
    items.push({ menuId: String(line?.menuId), name: source.name, price: source.price, qty });
  }
  return items;
}

/* ------------------------------ Pre-order ------------------------------ */

export type OrderInput = {
  /** Kosong = pesanan baru */
  id?: string;
  customer: string;
  phone: string;
  lines: MenuLine[];
  deliveryFee: number;
  discount: number;
  dueDate: string;
  dueTime: string;
  fulfillment: Fulfillment;
  address: string;
  note: string;
  /** Uang muka yang diterima saat pesanan dibuat (hanya pesanan baru) */
  downPayment?: number;
};

export async function saveOrder(input: OrderInput): Promise<ActionResult> {
  return run((db) => {
    const existing = input.id ? db.orders.find((order) => order.id === input.id) : undefined;
    if (input.id && !existing) throw new InputError("Pesanan ini sudah tidak ada. Muat ulang halaman.");

    const items = menuLines(input.lines, existing?.items);
    if (items.length === 0) throw new InputError("Pilih minimal satu menu.");

    const dueTime = text(input.dueTime, "Jam");
    if (dueTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(dueTime)) throw new InputError("Jam belum diisi dengan benar.");
    const fulfillment: Fulfillment = input.fulfillment === "delivery" ? "delivery" : "pickup";

    const fields = {
      customer: text(input.customer, "Nama pemesan", { required: true, max: 80 }),
      phone: text(input.phone, "Nomor WhatsApp", { max: 30 }),
      items,
      deliveryFee: fulfillment === "delivery" ? money(input.deliveryFee, "Ongkir") : 0,
      discount: money(input.discount, "Potongan"),
      dueDate: date(input.dueDate, "Tanggal ambil"),
      dueTime,
      fulfillment,
      address: fulfillment === "delivery" ? text(input.address, "Alamat", { max: 300 }) : "",
      note: text(input.note, "Catatan", { max: 500 }),
    };
    if (fields.discount > itemsTotal(items) + fields.deliveryFee) {
      throw new InputError("Potongan lebih besar daripada total pesanan.");
    }

    if (existing) {
      const paid = paidByOrder(db.transactions).get(existing.id) ?? 0;
      if (paid > orderTotal(fields)) {
        throw new InputError(
          `Total baru (${formatRupiah(orderTotal(fields))}) lebih kecil dari yang sudah dibayar (${formatRupiah(paid)}). Hapus dulu pembayarannya.`,
        );
      }
      Object.assign(existing, fields);
      return;
    }

    const downPayment = money(input.downPayment, "Uang muka");
    if (downPayment > orderTotal(fields)) throw new InputError("Uang muka lebih besar daripada total pesanan.");

    const now = new Date();
    const id = randomUUID();
    db.lastOrderNumber += 1;
    db.orders.push({ id, number: db.lastOrderNumber, createdAt: now.toISOString(), status: "new", ...fields });

    if (downPayment > 0) {
      db.transactions.push({
        id: randomUUID(),
        createdAt: now.toISOString(),
        date: todayISO(now),
        kind: "in",
        category: "preorder",
        amount: downPayment,
        note: downPayment === orderTotal(fields) ? "Lunas saat pesan" : "Uang muka",
        orderId: id,
      });
    }
  });
}

export async function setOrderStatus(id: string, status: OrderStatus): Promise<ActionResult> {
  return run((db) => {
    if (!ORDER_STATUSES.includes(status)) throw new InputError("Status tidak dikenal.");
    const order = db.orders.find((candidate) => candidate.id === id);
    if (!order) throw new InputError("Pesanan ini sudah tidak ada. Muat ulang halaman.");
    order.status = status;
  });
}

/** Menghapus pesanan beserta catatan pembayarannya. */
export async function deleteOrder(id: string): Promise<ActionResult> {
  return run((db) => {
    if (!db.orders.some((order) => order.id === id)) throw new InputError("Pesanan ini sudah tidak ada.");
    db.orders = db.orders.filter((order) => order.id !== id);
    db.transactions = db.transactions.filter((transaction) => transaction.orderId !== id);
  });
}

export type PaymentInput = { orderId: string; amount: number; date: string; note: string };

export async function addPayment(input: PaymentInput): Promise<ActionResult> {
  return run((db) => {
    const order = db.orders.find((candidate) => candidate.id === input.orderId);
    if (!order) throw new InputError("Pesanan ini sudah tidak ada. Muat ulang halaman.");

    const amount = money(input.amount, "Jumlah bayar", { positive: true });
    const remaining = orderTotal(order) - (paidByOrder(db.transactions).get(order.id) ?? 0);
    if (amount > remaining) throw new InputError(`Jumlah bayar melebihi sisa tagihan (${formatRupiah(Math.max(0, remaining))}).`);

    db.transactions.push({
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      date: date(input.date, "Tanggal"),
      kind: "in",
      category: "preorder",
      amount,
      note: text(input.note, "Catatan", { max: 200 }),
      orderId: order.id,
    });
  });
}

/* ------------------------------ Pembukuan ------------------------------ */

export type TransactionInput = {
  /** Kosong = transaksi baru */
  id?: string;
  kind: TransactionKind;
  category: string;
  amount: number;
  date: string;
  note: string;
  /** Rincian menu, khusus penjualan langsung */
  lines?: MenuLine[];
};

export async function saveTransaction(input: TransactionInput): Promise<ActionResult> {
  return run((db) => {
    const existing = input.id ? db.transactions.find((transaction) => transaction.id === input.id) : undefined;
    if (input.id && !existing) throw new InputError("Transaksi ini sudah tidak ada. Muat ulang halaman.");
    if (existing?.orderId || existing?.movementId) {
      throw new InputError("Transaksi ini dibuat otomatis. Ubah dari halaman Pre-order atau Bahan.");
    }

    const category = getCategory(input.category);
    if (!category || category.automatic || category.kind !== input.kind) throw new InputError("Pilih kategori dulu.");

    const items = category.id === "sales" ? menuLines(input.lines ?? [], existing?.items) : [];
    const fields = {
      kind: category.kind,
      category: category.id as TransactionCategoryId,
      amount: money(input.amount, "Jumlah uang", { positive: true }),
      date: date(input.date, "Tanggal"),
      note: text(input.note, "Keterangan", { max: 200 }),
      items: items.length > 0 ? items : undefined,
    };

    if (existing) Object.assign(existing, fields);
    else db.transactions.push({ id: randomUUID(), createdAt: new Date().toISOString(), ...fields });
  });
}

/**
 * Membuang satu catatan stok beserta pengeluaran belanjanya (kalau ada).
 * Ditolak kalau stok bahannya jadi minus, mis. menghapus belanja yang bahannya sudah dicatat terpakai.
 */
function removeMovement(db: Db, movementId: string): void {
  const movement = db.stockMovements.find((candidate) => candidate.id === movementId);
  if (!movement) return;
  db.stockMovements = db.stockMovements.filter((candidate) => candidate.id !== movementId);
  db.transactions = db.transactions.filter((transaction) => transaction.movementId !== movementId);

  const ingredient = db.ingredients.find((candidate) => candidate.id === movement.ingredientId);
  const stock = stockByIngredient(db.stockMovements).get(movement.ingredientId) ?? 0;
  if (ingredient && stock < 0) {
    throw new InputError(
      `Tidak bisa dihapus: stok ${ingredient.name} akan jadi minus (${formatNumber(stock)} ${ingredient.unit}). Hapus dulu catatan pemakaiannya, atau koreksi stoknya.`,
    );
  }
}

/** Menghapus transaksi. Kalau transaksinya belanja bahan, catatan stok belanja itu ikut dihapus. */
export async function deleteTransaction(id: string): Promise<ActionResult> {
  return run((db) => {
    const transaction = db.transactions.find((candidate) => candidate.id === id);
    if (!transaction) throw new InputError("Transaksi ini sudah tidak ada.");
    db.transactions = db.transactions.filter((candidate) => candidate.id !== id);
    if (transaction.movementId) removeMovement(db, transaction.movementId);
  });
}

/* ------------------------------ Bahan ------------------------------ */

export type IngredientInput = {
  /** Kosong = bahan baru */
  id?: string;
  name: string;
  unit: string;
  minStock: number;
  /** Stok yang sudah ada saat bahan didaftarkan (hanya bahan baru) */
  initialStock?: number;
};

export async function saveIngredient(input: IngredientInput): Promise<ActionResult> {
  return run((db) => {
    const existing = input.id ? db.ingredients.find((ingredient) => ingredient.id === input.id) : undefined;
    if (input.id && !existing) throw new InputError("Bahan ini sudah tidak ada. Muat ulang halaman.");

    const fields = {
      name: text(input.name, "Nama bahan", { required: true, max: 60 }),
      unit: text(input.unit, "Satuan", { required: true, max: 20 }),
      minStock: quantity(input.minStock, "Stok minimum"),
    };
    const sameName = db.ingredients.find((ingredient) => ingredient.name.toLowerCase() === fields.name.toLowerCase());
    if (sameName && sameName.id !== existing?.id) throw new InputError(`Bahan "${sameName.name}" sudah ada.`);

    if (existing) {
      Object.assign(existing, fields);
      return;
    }

    const now = new Date();
    const id = randomUUID();
    db.ingredients.push({ id, createdAt: now.toISOString(), ...fields });

    const initialStock = quantity(input.initialStock, "Stok sekarang");
    if (initialStock > 0) {
      db.stockMovements.push({
        id: randomUUID(),
        createdAt: now.toISOString(),
        ingredientId: id,
        date: todayISO(now),
        kind: "adjustment",
        qty: initialStock,
        note: "Stok awal",
      });
    }
  });
}

/** Menghapus bahan beserta riwayat stoknya. Pengeluaran belanjanya tetap ada di pembukuan. */
export async function deleteIngredient(id: string): Promise<ActionResult> {
  return run((db) => {
    if (!db.ingredients.some((ingredient) => ingredient.id === id)) throw new InputError("Bahan ini sudah tidak ada.");
    const removed = new Set(db.stockMovements.filter((movement) => movement.ingredientId === id).map((m) => m.id));
    db.ingredients = db.ingredients.filter((ingredient) => ingredient.id !== id);
    db.stockMovements = db.stockMovements.filter((movement) => !removed.has(movement.id));
    for (const transaction of db.transactions) {
      if (transaction.movementId && removed.has(transaction.movementId)) delete transaction.movementId;
    }
  });
}

export type StockInput = {
  kind: "purchase" | "usage";
  date: string;
  note: string;
  /** `cost`: total harga belanja bahan itu (hanya `purchase`) */
  lines: { ingredientId: string; qty: number; cost?: number }[];
};

/** Mencatat belanja atau pemakaian untuk beberapa bahan sekaligus. Belanja otomatis masuk pembukuan. */
export async function recordStock(input: StockInput): Promise<ActionResult> {
  return run((db) => {
    const isPurchase = input.kind === "purchase";
    if (!isPurchase && input.kind !== "usage") throw new InputError("Jenis catatan tidak dikenal.");
    const movementDate = date(input.date, "Tanggal");
    const note = text(input.note, "Catatan", { max: 200 });
    const stock = stockByIngredient(db.stockMovements);
    const now = new Date().toISOString();
    let recorded = 0;

    for (const raw of list(input.lines, "Daftar bahan")) {
      const line = raw as Partial<StockInput["lines"][number]> | null;
      const ingredient = db.ingredients.find((candidate) => candidate.id === line?.ingredientId);
      if (!ingredient) throw new InputError("Ada bahan yang sudah tidak ada. Muat ulang halaman.");

      const qty = quantity(line?.qty, `Jumlah ${ingredient.name}`);
      const cost = isPurchase ? money(line?.cost, `Harga ${ingredient.name}`) : 0;
      if (qty === 0) {
        if (cost > 0) throw new InputError(`Jumlah ${ingredient.name} belum diisi.`);
        continue;
      }

      const available = stock.get(ingredient.id) ?? 0;
      if (!isPurchase && qty > available) {
        throw new InputError(
          `Stok ${ingredient.name} tinggal ${formatNumber(Math.max(0, available))} ${ingredient.unit}. Catat belanja atau koreksi stoknya dulu.`,
        );
      }

      const movementId = randomUUID();
      db.stockMovements.push({
        id: movementId,
        createdAt: now,
        ingredientId: ingredient.id,
        date: movementDate,
        kind: input.kind,
        qty: isPurchase ? qty : -qty,
        cost: cost > 0 ? cost : undefined,
        note,
      });
      stock.set(ingredient.id, roundQty(available + (isPurchase ? qty : -qty)));

      if (cost > 0) {
        db.transactions.push({
          id: randomUUID(),
          createdAt: now,
          date: movementDate,
          kind: "out",
          category: "ingredients",
          amount: cost,
          note: `Beli ${ingredient.name} ${formatNumber(qty)} ${ingredient.unit}${note ? ` · ${note}` : ""}`,
          movementId,
        });
      }
      recorded += 1;
    }

    if (recorded === 0) throw new InputError("Isi jumlah minimal untuk satu bahan.");
  });
}

export type AdjustmentInput = { ingredientId: string; actual: number; date: string; note: string };

/** Koreksi stok: isi jumlah yang benar-benar ada di dapur, selisihnya dicatat otomatis. */
export async function adjustStock(input: AdjustmentInput): Promise<ActionResult> {
  return run((db) => {
    const ingredient = db.ingredients.find((candidate) => candidate.id === input.ingredientId);
    if (!ingredient) throw new InputError("Bahan ini sudah tidak ada. Muat ulang halaman.");

    const actual = quantity(input.actual, "Jumlah sebenarnya");
    const current = stockByIngredient(db.stockMovements).get(ingredient.id) ?? 0;
    const difference = roundQty(actual - current);
    if (difference === 0) throw new InputError("Jumlahnya sama dengan stok yang tercatat.");

    db.stockMovements.push({
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      ingredientId: ingredient.id,
      date: date(input.date, "Tanggal"),
      kind: "adjustment",
      qty: difference,
      note: text(input.note, "Catatan", { max: 200 }),
    });
  });
}

/** Menghapus satu catatan stok. Kalau itu belanja, pengeluarannya di pembukuan ikut dihapus. */
export async function deleteMovement(id: string): Promise<ActionResult> {
  return run((db) => {
    if (!db.stockMovements.some((movement) => movement.id === id)) throw new InputError("Catatan ini sudah tidak ada.");
    removeMovement(db, id);
  });
}

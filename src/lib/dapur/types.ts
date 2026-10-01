/**
 * Bentuk data "Dapur" (catatan toko): pre-order, pembukuan, dan stok bahan.
 * Semuanya tersimpan di satu file: catatan-toko/data.json (lihat store.ts).
 */

/* ------------------------------ Pre-order ------------------------------ */

export const ORDER_STATUSES = ["new", "making", "ready", "done", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const orderStatusLabels: Record<OrderStatus, string> = {
  new: "Baru",
  making: "Sedang dibuat",
  ready: "Siap diambil",
  done: "Selesai",
  cancelled: "Batal",
};

/** Langkah berikutnya untuk tombol cepat di kartu pesanan. */
export const nextOrderStep: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  new: { status: "making", label: "Mulai dibuat" },
  making: { status: "ready", label: "Tandai siap" },
  ready: { status: "done", label: "Selesai" },
};

/** Pesanan yang masih harus diurus (belum selesai / batal). */
export function isActiveOrder(status: OrderStatus): boolean {
  return status === "new" || status === "making" || status === "ready";
}

export type Fulfillment = "pickup" | "delivery";

export const fulfillmentLabels: Record<Fulfillment, string> = {
  pickup: "Ambil sendiri",
  delivery: "Diantar",
};

export type OrderItem = {
  menuId: string;
  /** Nama & harga disalin saat pesanan dibuat, jadi tidak berubah kalau harga menu naik. */
  name: string;
  price: number;
  qty: number;
};

export type Order = {
  id: string;
  /** Nomor urut yang mudah disebut ke pelanggan: PO #12 */
  number: number;
  createdAt: string;
  customer: string;
  phone: string;
  items: OrderItem[];
  deliveryFee: number;
  discount: number;
  /** Tanggal diambil/diantar, "YYYY-MM-DD" */
  dueDate: string;
  /** "HH:MM" atau kosong */
  dueTime: string;
  fulfillment: Fulfillment;
  address: string;
  status: OrderStatus;
  note: string;
};

/** Menu yang bisa dipilih di form (diambil dari src/data/menu.ts). */
export type MenuOption = { id: string; name: string; price: number };

export type PaymentStatus = "unpaid" | "partial" | "paid";

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  unpaid: "Belum bayar",
  partial: "DP",
  paid: "Lunas",
};

/* ------------------------------ Pembukuan ------------------------------ */

export type TransactionKind = "in" | "out";

export type TransactionCategory = {
  id: string;
  label: string;
  kind: TransactionKind;
  /** `false`: uang yang bukan hasil/biaya usaha (modal, ambil pribadi). Masuk saldo kas, tidak dihitung laba. */
  business: boolean;
  /** Dibuat otomatis dari halaman lain, tidak dipilih manual. */
  automatic?: boolean;
};

export const transactionCategories = [
  { id: "sales", label: "Penjualan langsung", kind: "in", business: true },
  { id: "preorder", label: "Pembayaran pre-order", kind: "in", business: true, automatic: true },
  { id: "other-in", label: "Pemasukan lain", kind: "in", business: true },
  { id: "capital", label: "Tambahan modal", kind: "in", business: false },
  { id: "ingredients", label: "Bahan baku", kind: "out", business: true },
  { id: "packaging", label: "Kemasan", kind: "out", business: true },
  { id: "utilities", label: "Gas, listrik & air", kind: "out", business: true },
  { id: "delivery", label: "Transport & ongkir", kind: "out", business: true },
  { id: "equipment", label: "Peralatan", kind: "out", business: true },
  { id: "marketing", label: "Promosi", kind: "out", business: true },
  { id: "other-out", label: "Pengeluaran lain", kind: "out", business: true },
  { id: "personal", label: "Ambil untuk pribadi", kind: "out", business: false },
] as const satisfies readonly TransactionCategory[];

export type TransactionCategoryId = (typeof transactionCategories)[number]["id"];

const categoryById = new Map<string, TransactionCategory>(transactionCategories.map((c) => [c.id, c]));

export function getCategory(id: string): TransactionCategory | undefined {
  return categoryById.get(id);
}

export type SaleItem = { menuId: string; name: string; price: number; qty: number };

export type Transaction = {
  id: string;
  createdAt: string;
  /** "YYYY-MM-DD" */
  date: string;
  kind: TransactionKind;
  category: TransactionCategoryId;
  amount: number;
  note: string;
  /** Rincian menu untuk penjualan langsung */
  items?: SaleItem[];
  /** Terisi kalau ini pembayaran sebuah pre-order */
  orderId?: string;
  /** Terisi kalau ini belanja bahan (lihat StockMovement) */
  movementId?: string;
};

/* ------------------------------ Bahan ------------------------------ */

export type Ingredient = {
  id: string;
  createdAt: string;
  name: string;
  /** Satuan stok: gram, liter, butir, pcs, … */
  unit: string;
  /** Stok di bawah/sama dengan angka ini dianggap menipis. 0 = tidak dipantau. */
  minStock: number;
};

export type StockMovementKind = "purchase" | "usage" | "adjustment";

export const stockMovementLabels: Record<StockMovementKind, string> = {
  purchase: "Belanja",
  usage: "Dipakai",
  adjustment: "Koreksi stok",
};

export type StockMovement = {
  id: string;
  createdAt: string;
  ingredientId: string;
  /** "YYYY-MM-DD" */
  date: string;
  kind: StockMovementKind;
  /** Perubahan stok: positif = bertambah, negatif = berkurang */
  qty: number;
  /** Total harga belanja (hanya `purchase`) */
  cost?: number;
  note: string;
};

export type StockStatus = "ok" | "low" | "empty";

export const stockStatusLabels: Record<StockStatus, string> = {
  ok: "Aman",
  low: "Menipis",
  empty: "Habis",
};

/* ------------------------------ File data ------------------------------ */

export type Db = {
  version: 1;
  /** Nomor pre-order terakhir yang sudah dipakai */
  lastOrderNumber: number;
  orders: Order[];
  transactions: Transaction[];
  ingredients: Ingredient[];
  stockMovements: StockMovement[];
};

export function emptyDb(): Db {
  return { version: 1, lastOrderNumber: 0, orders: [], transactions: [], ingredients: [], stockMovements: [] };
}

/** Hasil server action: sukses, atau pesan yang bisa langsung ditampilkan di form. */
export type ActionResult = { ok: true } | { ok: false; error: string };

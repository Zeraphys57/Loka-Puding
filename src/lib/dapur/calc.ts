import { monthOf } from "@/lib/dapur/dates";
import {
  getCategory,
  type Ingredient,
  type Order,
  type PaymentStatus,
  type StockMovement,
  type StockStatus,
  type Transaction,
} from "@/lib/dapur/types";

/* Semua angka turunan dihitung dari catatan mentah, tidak disimpan: tidak mungkin "tidak sinkron". */

/* ------------------------------ Pre-order ------------------------------ */

export function itemsTotal(items: ReadonlyArray<{ price: number; qty: number }>): number {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

export function itemsCount(items: ReadonlyArray<{ qty: number }>): number {
  return items.reduce((sum, item) => sum + item.qty, 0);
}

export function orderTotal(order: Pick<Order, "items" | "deliveryFee" | "discount">): number {
  return Math.max(0, itemsTotal(order.items) + order.deliveryFee - order.discount);
}

/** Jumlah yang sudah dibayar per pesanan (dari transaksi pembukuan). */
export function paidByOrder(transactions: readonly Transaction[]): Map<string, number> {
  const paid = new Map<string, number>();
  for (const transaction of transactions) {
    if (!transaction.orderId) continue;
    paid.set(transaction.orderId, (paid.get(transaction.orderId) ?? 0) + transaction.amount);
  }
  return paid;
}

export function paymentStatus(total: number, paid: number): PaymentStatus {
  if (paid <= 0) return total === 0 ? "paid" : "unpaid";
  return paid >= total ? "paid" : "partial";
}

/** "3× Puding Karamel, 2× Puding Karamel Topping Regal" */
export function summarizeItems(items: ReadonlyArray<{ name: string; qty: number }>): string {
  return items.map((item) => `${item.qty}× ${item.name}`).join(", ");
}

export type OrderPayment = { id: string; date: string; amount: number; note: string };

/** Pesanan + angka turunannya, siap ditampilkan. */
export type OrderView = Order & {
  total: number;
  paid: number;
  remaining: number;
  payment: PaymentStatus;
  /** Riwayat pembayaran, terbaru dulu */
  payments: OrderPayment[];
};

export function viewOrders(orders: readonly Order[], transactions: readonly Transaction[]): OrderView[] {
  const payments = new Map<string, OrderPayment[]>();
  for (const transaction of [...transactions].sort(byNewest)) {
    if (!transaction.orderId) continue;
    const { id, date, amount, note } = transaction;
    payments.set(transaction.orderId, [...(payments.get(transaction.orderId) ?? []), { id, date, amount, note }]);
  }

  return orders.map((order) => {
    const total = orderTotal(order);
    const orderPayments = payments.get(order.id) ?? [];
    const paid = orderPayments.reduce((sum, payment) => sum + payment.amount, 0);
    return {
      ...order,
      total,
      paid,
      remaining: Math.max(0, total - paid),
      payment: paymentStatus(total, paid),
      payments: orderPayments,
    };
  });
}

/** Urutan kerja: tanggal & jam ambil paling dekat dulu (tanpa jam = paling akhir di hari itu). */
export function byDueDate(a: Order, b: Order): number {
  return (
    a.dueDate.localeCompare(b.dueDate) ||
    (a.dueTime || "99:99").localeCompare(b.dueTime || "99:99") ||
    a.number - b.number
  );
}

/* ------------------------------ Pembukuan ------------------------------ */

export type MonthSummary = {
  /** Pemasukan & pengeluaran usaha (tanpa modal / ambil pribadi) */
  income: number;
  expense: number;
  profit: number;
  /** Pengeluaran usaha per kategori, terbesar dulu */
  expenseByCategory: { id: string; label: string; amount: number }[];
  /** Uang di luar hitungan laba: tambahan modal (masuk) & ambil pribadi (keluar) */
  nonBusinessIn: number;
  nonBusinessOut: number;
  count: number;
};

export function summarizeMonth(transactions: readonly Transaction[], month: string): MonthSummary {
  const summary = { income: 0, expense: 0, nonBusinessIn: 0, nonBusinessOut: 0, count: 0 };
  const byCategory = new Map<string, number>();

  for (const transaction of transactions) {
    if (monthOf(transaction.date) !== month) continue;
    summary.count += 1;
    const business = getCategory(transaction.category)?.business ?? true;
    if (transaction.kind === "in") {
      summary[business ? "income" : "nonBusinessIn"] += transaction.amount;
    } else {
      summary[business ? "expense" : "nonBusinessOut"] += transaction.amount;
      if (business) byCategory.set(transaction.category, (byCategory.get(transaction.category) ?? 0) + transaction.amount);
    }
  }

  const expenseByCategory = [...byCategory]
    .map(([id, amount]) => ({ id, label: getCategory(id)?.label ?? id, amount }))
    .sort((a, b) => b.amount - a.amount);

  return { ...summary, profit: summary.income - summary.expense, expenseByCategory };
}

/** Satu baris buku kas, siap ditampilkan. */
export type LedgerRow = Transaction & {
  title: string;
  /** Kategori + keterangan tambahan */
  subtitle: string;
  /** Dari mana catatan ini berasal: diisi manual, pembayaran pre-order, atau belanja bahan */
  source: "manual" | "order" | "stock";
};

export function viewLedger(transactions: readonly Transaction[], orders: readonly Order[]): LedgerRow[] {
  const orderById = new Map(orders.map((order) => [order.id, order]));
  const join = (...parts: string[]) => parts.filter(Boolean).join(" · ");

  return [...transactions].sort(byNewest).map((transaction) => {
    const category = getCategory(transaction.category)?.label ?? transaction.category;
    const order = transaction.orderId ? orderById.get(transaction.orderId) : undefined;
    const source = transaction.orderId ? "order" : transaction.movementId ? "stock" : "manual";

    if (order) {
      return { ...transaction, source, title: `PO #${order.number} · ${order.customer}`, subtitle: join(category, transaction.note) };
    }
    if (transaction.items?.length) {
      return { ...transaction, source, title: summarizeItems(transaction.items), subtitle: join(category, transaction.note) };
    }
    return { ...transaction, source, title: transaction.note || category, subtitle: transaction.note ? category : "" };
  });
}

/** Saldo kas: semua uang masuk dikurangi semua uang keluar, sejak catatan pertama. */
export function cashBalance(transactions: readonly Transaction[]): number {
  return transactions.reduce((sum, t) => sum + (t.kind === "in" ? t.amount : -t.amount), 0);
}

/** Terbaru dulu; di tanggal yang sama, yang dicatat belakangan di atas. */
export function byNewest<T extends { date: string; createdAt: string }>(a: T, b: T): number {
  return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);
}

/* ------------------------------ Bahan ------------------------------ */

/** Membuang sisa pecahan biner (0.1 + 0.2) dari jumlah stok. */
export function roundQty(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function stockByIngredient(movements: readonly StockMovement[]): Map<string, number> {
  const stock = new Map<string, number>();
  for (const movement of movements) {
    stock.set(movement.ingredientId, roundQty((stock.get(movement.ingredientId) ?? 0) + movement.qty));
  }
  return stock;
}

export function stockStatus(stock: number, minStock: number): StockStatus {
  if (stock <= 0) return "empty";
  return minStock > 0 && stock <= minStock ? "low" : "ok";
}

/** Harga per satuan dari belanja terakhir tiap bahan. */
export function lastUnitPrice(movements: readonly StockMovement[]): Map<string, number> {
  const latest = new Map<string, StockMovement>();
  for (const movement of movements) {
    if (movement.kind !== "purchase" || !movement.cost || movement.qty <= 0) continue;
    const current = latest.get(movement.ingredientId);
    if (!current || byNewest(movement, current) < 0) latest.set(movement.ingredientId, movement);
  }
  return new Map([...latest].map(([id, movement]) => [id, (movement.cost ?? 0) / movement.qty]));
}

export type IngredientView = Ingredient & {
  stock: number;
  status: StockStatus;
  /** Harga per satuan dari belanja terakhir, kalau ada */
  unitPrice: number | null;
};

/** Satu catatan stok + nama & satuan bahannya, siap ditampilkan. */
export type MovementView = StockMovement & { ingredientName: string; unit: string };

export function viewMovements(ingredients: readonly Ingredient[], movements: readonly StockMovement[]): MovementView[] {
  const byId = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
  return [...movements].sort(byNewest).flatMap((movement) => {
    const ingredient = byId.get(movement.ingredientId);
    return ingredient ? [{ ...movement, ingredientName: ingredient.name, unit: ingredient.unit }] : [];
  });
}

const STATUS_ORDER: Record<StockStatus, number> = { empty: 0, low: 1, ok: 2 };

/** Bahan + stok terkini; yang habis/menipis di atas, lalu urut nama. */
export function viewIngredients(
  ingredients: readonly Ingredient[],
  movements: readonly StockMovement[],
): IngredientView[] {
  const stock = stockByIngredient(movements);
  const prices = lastUnitPrice(movements);
  return ingredients
    .map((ingredient) => {
      const current = stock.get(ingredient.id) ?? 0;
      return {
        ...ingredient,
        stock: current,
        status: stockStatus(current, ingredient.minStock),
        unitPrice: prices.get(ingredient.id) ?? null,
      };
    })
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.name.localeCompare(b.name, "id"));
}

import Link from "next/link";
import { NewOrderButton, TransactionButtons } from "@/components/dapur/QuickActions";
import { Card, CardTitle, OrderStatusPill, PageHeader, PaymentPill, Pill, SignedAmount, StatTile, StockPill } from "@/components/dapur/ui";
import { ArrowRightIcon } from "@/components/ui/Icons";
import {
  byDueDate,
  itemsCount,
  summarizeMonth,
  viewIngredients,
  viewLedger,
  viewOrders,
  type OrderView,
} from "@/lib/dapur/calc";
import { addDays, addMonths, formatDueDate, formatLongDate, formatMonth, formatShortDate, monthOf, todayISO } from "@/lib/dapur/dates";
import { getMenuOptions } from "@/lib/dapur/menu";
import { getDb } from "@/lib/dapur/store";
import { isActiveOrder } from "@/lib/dapur/types";
import { formatNumber, formatRupiah, formatTime } from "@/lib/format";

// Jadwal di ringkasan: pesanan sampai seminggu ke depan (yang lewat tanggal selalu ikut tampil)
const SCHEDULE_DAYS = 7;
const RECENT_SHOWN = 6;

const moreLink = "inline-flex items-center gap-1.5 rounded font-bold text-caramel-700 hover:text-caramel-800 [&_svg]:size-4";

/** Jumlah per menu yang masih harus dibuat (pesanan berstatus Baru / Sedang dibuat). */
function toMake(orders: OrderView[]): { name: string; qty: number }[] {
  const totals = new Map<string, number>();
  for (const order of orders) {
    if (order.status !== "new" && order.status !== "making") continue;
    for (const item of order.items) totals.set(item.name, (totals.get(item.name) ?? 0) + item.qty);
  }
  return [...totals].map(([name, qty]) => ({ name, qty }));
}

export default async function DapurHomePage() {
  const db = await getDb();
  const today = todayISO();
  const month = monthOf(today);
  const menu = getMenuOptions();

  const summary = summarizeMonth(db.transactions, month);
  const lastMonth = summarizeMonth(db.transactions, addMonths(month, -1));
  const orders = viewOrders(db.orders, db.transactions);
  const unpaid = orders.filter((order) => order.status !== "cancelled" && order.remaining > 0);
  const activeOrders = orders.filter((order) => isActiveOrder(order.status)).sort(byDueDate);

  const horizon = addDays(today, SCHEDULE_DAYS);
  const scheduled = activeOrders.filter((order) => order.dueDate <= horizon);
  const schedule = new Map<string, OrderView[]>();
  for (const order of scheduled) schedule.set(order.dueDate, [...(schedule.get(order.dueDate) ?? []), order]);

  const ingredients = viewIngredients(db.ingredients, db.stockMovements);
  const lowStock = ingredients.filter((ingredient) => ingredient.status !== "ok");
  const recent = viewLedger(db.transactions, db.orders).slice(0, RECENT_SHOWN);
  const isNew = db.orders.length === 0 && db.transactions.length === 0 && db.ingredients.length === 0;

  return (
    <div className="grid gap-8">
      <PageHeader title="Ringkasan" lead={formatLongDate(today)}>
        <NewOrderButton menu={menu} today={today} />
        <TransactionButtons menu={menu} today={today} />
      </PageHeader>

      {isNew ? (
        <Card className="border-caramel-300 bg-caramel-50/70">
          <h2 className="text-2xl leading-tight font-bold tracking-[-0.01em] text-espresso">Selamat datang di Dapur</h2>
          <p className="mt-2 max-w-2xl text-ink-muted">
            Ini buku catatan toko: pre-order, uang masuk dan keluar, dan stok bahan. Tidak ada halaman login: Dapur
            hanya terbuka di HP atau laptop yang pernah membuka link rahasianya, jadi simpan link itu baik-baik dan
            jangan dibagikan.
          </p>
          <ol className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              { href: "/dapur/bahan", title: "Daftarkan bahan", text: "Susu, gula, Regal, popcorn, cup. Isi stok yang ada sekarang." },
              { href: "/dapur/pre-order", title: "Catat pre-order", text: "Siapa pesan apa, untuk kapan, sudah DP berapa." },
              { href: "/dapur/pembukuan", title: "Catat uang masuk & keluar", text: "Penjualan harian dan belanja, supaya laba kelihatan." },
            ].map((step, index) => (
              <li key={step.href}>
                <Link
                  href={step.href}
                  className="flex h-full flex-col rounded-2xl border border-sand/80 bg-milk-50 p-4 transition-colors hover:border-caramel-300"
                >
                  <span className="font-hand text-2xl leading-none text-caramel-600">{index + 1}.</span>
                  <span className="mt-1 font-bold text-espresso">{step.title}</span>
                  <span className="mt-1 text-sm text-ink-muted">{step.text}</span>
                </Link>
              </li>
            ))}
          </ol>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          tone="accent"
          label={`Laba ${formatMonth(month)}`}
          value={formatRupiah(summary.profit)}
          note={lastMonth.count > 0 ? `Bulan lalu ${formatRupiah(lastMonth.profit)}` : "Pemasukan dikurangi pengeluaran"}
        />
        <StatTile label="Pemasukan bulan ini" value={formatRupiah(summary.income)} />
        <StatTile label="Pengeluaran bulan ini" value={formatRupiah(summary.expense)} />
        <StatTile
          label="Belum dibayar pelanggan"
          value={formatRupiah(unpaid.reduce((sum, order) => sum + order.remaining, 0))}
          note={unpaid.length > 0 ? `Dari ${unpaid.length} pesanan` : "Semua pesanan lunas"}
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <CardTitle
            aside={
              <Link href="/dapur/pre-order" className={moreLink}>
                Semua pre-order
                <ArrowRightIcon />
              </Link>
            }
          >
            Yang harus disiapkan
          </CardTitle>

          {scheduled.length === 0 ? (
            <p className="text-ink-muted">
              {activeOrders.length > 0
                ? `Tidak ada pesanan untuk ${SCHEDULE_DAYS} hari ke depan. Pesanan terdekat: ${formatShortDate(activeOrders[0].dueDate)}.`
                : "Tidak ada pesanan yang menunggu."}
            </p>
          ) : (
            <ol className="grid gap-5">
              {[...schedule].map(([dueDate, dayOrders]) => {
                const making = toMake(dayOrders);
                return (
                  <li key={dueDate} className="grid gap-2.5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <h3 className="text-lg leading-tight font-bold text-espresso">{formatDueDate(dueDate, today)}</h3>
                      {dueDate < today ? <Pill tone="bad">Lewat tanggal</Pill> : null}
                    </div>
                    {making.length > 0 ? (
                      <p className="rounded-xl bg-caramel-50 px-3.5 py-2.5 text-sm text-espresso">
                        <span className="font-bold">Perlu dibuat:</span>{" "}
                        {making.map((item) => `${item.qty}× ${item.name}`).join(", ")}
                      </p>
                    ) : null}
                    <ul className="divide-y divide-sand/70 rounded-2xl border border-sand/80 bg-white">
                      {dayOrders.map((order) => (
                        <li key={order.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2.5">
                          <p className="min-w-0 flex-1 basis-40 leading-snug break-words text-espresso">
                            <span className="font-semibold">{order.customer}</span>{" "}
                            <span className="text-sm text-ink-muted">
                              · PO #{order.number} · {itemsCount(order.items)} pcs
                              {order.dueTime ? ` · ${formatTime(order.dueTime)}` : ""}
                            </span>
                          </p>
                          <OrderStatusPill status={order.status} />
                          <PaymentPill status={order.payment} />
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ol>
          )}
          {activeOrders.length > scheduled.length && scheduled.length > 0 ? (
            <p className="mt-4 text-sm text-ink-muted">+ {activeOrders.length - scheduled.length} pesanan lain setelah minggu ini.</p>
          ) : null}
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardTitle
              aside={
                <Link href="/dapur/bahan" className={moreLink}>
                  Bahan
                  <ArrowRightIcon />
                </Link>
              }
            >
              Stok menipis
            </CardTitle>
            {ingredients.length === 0 ? (
              <p className="text-ink-muted">Belum ada bahan yang dipantau.</p>
            ) : lowStock.length === 0 ? (
              <p className="text-ink-muted">Semua {ingredients.length} bahan aman.</p>
            ) : (
              <ul className="grid gap-3">
                {lowStock.map((ingredient) => (
                  <li key={ingredient.id} className="flex items-center justify-between gap-3">
                    <p className="min-w-0 leading-snug break-words">
                      <span className="font-semibold text-espresso">{ingredient.name}</span>
                      <span className="block text-sm text-ink-muted">
                        Sisa {formatNumber(ingredient.stock)} {ingredient.unit}
                      </span>
                    </p>
                    <StockPill status={ingredient.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardTitle
              aside={
                <Link href="/dapur/pembukuan" className={moreLink}>
                  Pembukuan
                  <ArrowRightIcon />
                </Link>
              }
            >
              Catatan terakhir
            </CardTitle>
            {recent.length === 0 ? (
              <p className="text-ink-muted">Belum ada uang masuk atau keluar yang dicatat.</p>
            ) : (
              <ul className="grid gap-3">
                {recent.map((row) => (
                  <li key={row.id} className="flex items-start justify-between gap-3">
                    <p className="min-w-0 leading-snug break-words">
                      <span className="font-semibold text-espresso">{row.title}</span>
                      <span className="block text-sm text-ink-muted">{formatDueDate(row.date, today)}</span>
                    </p>
                    <SignedAmount kind={row.kind} amount={row.amount} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

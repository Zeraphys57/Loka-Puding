import type { Metadata } from "next";
import Link from "next/link";
import { Ledger } from "@/components/dapur/Ledger";
import { TransactionButtons } from "@/components/dapur/QuickActions";
import { Card, CardTitle, EmptyState, PageHeader, StatTile } from "@/components/dapur/ui";
import { buttonClasses } from "@/components/ui/Button";
import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon } from "@/components/ui/Icons";
import { cashBalance, summarizeMonth, viewLedger } from "@/lib/dapur/calc";
import { addMonths, formatMonth, isMonth, monthOf, todayISO } from "@/lib/dapur/dates";
import { getMenuOptions } from "@/lib/dapur/menu";
import { getDb } from "@/lib/dapur/store";
import { formatRupiah } from "@/lib/format";

export const metadata: Metadata = { title: "Pembukuan" };

const monthLink = (month: string) => `/dapur/pembukuan?bulan=${month}`;
const stepButton =
  "grid size-10 place-items-center rounded-full border border-sand bg-milk-50 text-espresso transition-colors hover:border-caramel-300 hover:bg-caramel-50";

export default async function LedgerPage({ searchParams }: PageProps<"/dapur/pembukuan">) {
  const db = await getDb();
  const today = todayISO();
  const currentMonth = monthOf(today);
  const { bulan } = await searchParams;
  const month = typeof bulan === "string" && isMonth(bulan) ? bulan : currentMonth;

  const summary = summarizeMonth(db.transactions, month);
  const rows = viewLedger(
    db.transactions.filter((transaction) => monthOf(transaction.date) === month),
    db.orders,
  );
  const menu = getMenuOptions();
  const largestExpense = summary.expenseByCategory[0]?.amount ?? 0;

  return (
    <div className="grid gap-8">
      <PageHeader title="Pembukuan" lead="Uang masuk dan keluar. Pembayaran pre-order dan belanja bahan tercatat sendiri di sini.">
        <TransactionButtons menu={menu} today={today} />
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2">
        <Link href={monthLink(addMonths(month, -1))} aria-label={`Bulan sebelumnya: ${formatMonth(addMonths(month, -1))}`} className={stepButton}>
          <ChevronLeftIcon className="size-5" />
        </Link>
        <h2 className="min-w-44 text-center text-2xl leading-tight font-bold tracking-[-0.01em] text-espresso">{formatMonth(month)}</h2>
        <Link href={monthLink(addMonths(month, 1))} aria-label={`Bulan berikutnya: ${formatMonth(addMonths(month, 1))}`} className={stepButton}>
          <ChevronRightIcon className="size-5" />
        </Link>
        {month === currentMonth ? null : (
          <Link href="/dapur/pembukuan" className={buttonClasses("ghost", "sm")}>
            Ke bulan ini
          </Link>
        )}
        {rows.length > 0 ? (
          <a href={`/dapur/pembukuan/ekspor?bulan=${month}`} className={buttonClasses("outline", "sm", "ml-auto")}>
            <DownloadIcon />
            Unduh untuk Excel
          </a>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile tone="accent" label="Laba" value={formatRupiah(summary.profit)} note="Pemasukan dikurangi pengeluaran" />
        <StatTile label="Pemasukan" value={formatRupiah(summary.income)} />
        <StatTile label="Pengeluaran" value={formatRupiah(summary.expense)} />
        <StatTile label="Saldo kas" value={formatRupiah(cashBalance(db.transactions))} note="Semua uang masuk dikurangi keluar, sejak awal" />
      </div>

      {summary.nonBusinessIn > 0 || summary.nonBusinessOut > 0 ? (
        <p className="-mt-4 text-sm text-ink-muted">
          Di luar hitungan laba bulan ini:
          {summary.nonBusinessIn > 0 ? ` tambahan modal ${formatRupiah(summary.nonBusinessIn)}` : ""}
          {summary.nonBusinessIn > 0 && summary.nonBusinessOut > 0 ? " dan" : ""}
          {summary.nonBusinessOut > 0 ? ` ambil untuk pribadi ${formatRupiah(summary.nonBusinessOut)}` : ""}. Keduanya tetap
          dihitung di saldo kas.
        </p>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState title={`Belum ada catatan di ${formatMonth(month)}`}>
          Catat setiap uang yang masuk dan keluar, sekecil apa pun. Di akhir bulan langsung kelihatan untung atau rugi.
        </EmptyState>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Ledger rows={rows} menu={menu} today={today} />

          <Card>
            <CardTitle>Pengeluaran per kategori</CardTitle>
            {summary.expenseByCategory.length === 0 ? (
              <p className="text-sm text-ink-muted">Belum ada pengeluaran bulan ini.</p>
            ) : (
              <ul className="grid gap-4">
                {summary.expenseByCategory.map((category) => (
                  <li key={category.id}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-semibold text-espresso">{category.label}</span>
                      <span className="text-ink-muted tabular-nums">{formatRupiah(category.amount)}</span>
                    </div>
                    {/* Batang sebanding dengan kategori terbesar; angkanya selalu tertulis di atasnya */}
                    <div
                      aria-hidden="true"
                      className="mt-1.5 h-2 min-w-1 rounded-r-full bg-caramel-500"
                      style={{ width: `${(category.amount / largestExpense) * 100}%` }}
                    />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

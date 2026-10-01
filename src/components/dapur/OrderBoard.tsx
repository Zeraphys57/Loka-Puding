"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/dapur/Dialog";
import { inputClass } from "@/components/dapur/fields";
import { OrderDialog } from "@/components/dapur/OrderDialog";
import { PaymentDialog } from "@/components/dapur/PaymentDialog";
import { EmptyState, orderStatusTones, PaymentPill, Pill } from "@/components/dapur/ui";
import { useSave } from "@/components/dapur/useSave";
import { Button } from "@/components/ui/Button";
import {
  ChevronRightIcon,
  ClockIcon,
  CoinIcon,
  MapPinIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  StoreIcon,
  TrashIcon,
  TruckIcon,
  WhatsAppIcon,
} from "@/components/ui/Icons";
import { cn } from "@/lib/cn";
import { deleteOrder, setOrderStatus } from "@/lib/dapur/actions";
import { byDueDate, itemsCount, summarizeItems, type OrderView } from "@/lib/dapur/calc";
import { customerWhatsappLink } from "@/lib/dapur/contact";
import { formatDueDate } from "@/lib/dapur/dates";
import {
  fulfillmentLabels,
  isActiveOrder,
  nextOrderStep,
  ORDER_STATUSES,
  orderStatusLabels,
  type MenuOption,
  type OrderStatus,
} from "@/lib/dapur/types";
import { formatRupiah, formatTime } from "@/lib/format";

type Filter = "active" | "done" | "cancelled" | "all";

const FILTERS: { id: Filter; label: string; match: (order: OrderView) => boolean }[] = [
  { id: "active", label: "Aktif", match: (order) => isActiveOrder(order.status) },
  { id: "done", label: "Selesai", match: (order) => order.status === "done" },
  { id: "cancelled", label: "Batal", match: (order) => order.status === "cancelled" },
  { id: "all", label: "Semua", match: () => true },
];

/** Cocok dengan nama, nomor PO ("12" / "#12"), atau potongan nomor WhatsApp. */
function matchesSearch(order: OrderView, needle: string): boolean {
  if (!needle) return true;
  const digits = needle.replace(/\D/g, "");
  return (
    order.customer.toLowerCase().includes(needle) ||
    `#${order.number}`.includes(needle) ||
    (digits !== "" && order.phone.replace(/\D/g, "").includes(digits))
  );
}

type OrderBoardProps = {
  orders: OrderView[];
  menu: MenuOption[];
  today: string;
};

/** Daftar pre-order: saring, cari, ubah status, catat bayar. Dikelompokkan per tanggal ambil. */
export function OrderBoard({ orders, menu, today }: OrderBoardProps) {
  const [filter, setFilter] = useState<Filter>("active");
  const [query, setQuery] = useState("");
  // Hanya id yang disimpan: datanya selalu diambil dari `orders` terbaru setelah disimpan
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const find = (id: string | null) => orders.find((order) => order.id === id) ?? null;
  const deleting = find(deletingId);

  const active = FILTERS.find((candidate) => candidate.id === filter) ?? FILTERS[0];
  const needle = query.trim().toLowerCase();
  const visible = orders
    .filter(active.match)
    .filter((order) => matchesSearch(order, needle))
    .sort(byDueDate);
  // Yang masih dikerjakan: paling dekat dulu. Riwayat (selesai/batal/semua): paling baru dulu.
  if (filter !== "active") visible.reverse();

  const groups = new Map<string, OrderView[]>();
  for (const order of visible) groups.set(order.dueDate, [...(groups.get(order.dueDate) ?? []), order]);

  if (orders.length === 0) {
    return (
      <>
        <EmptyState
          title="Belum ada pre-order"
          action={
            <Button onClick={() => setEditing("new")}>
              <PlusIcon />
              Catat pre-order pertama
            </Button>
          }
        >
          Setiap pesanan yang masuk dicatat di sini: siapa yang pesan, menu apa, kapan diambil, dan sudah bayar berapa.
        </EmptyState>
        <OrderDialog open={editing === "new"} onClose={() => setEditing(null)} menu={menu} today={today} />
      </>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label="Saring pesanan" className="flex flex-wrap gap-2">
          {FILTERS.map((candidate) => {
            const selected = candidate.id === filter;
            return (
              <button
                key={candidate.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setFilter(candidate.id)}
                className={cn(
                  "flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-bold transition-colors",
                  selected
                    ? "border-transparent bg-espresso text-milk-50"
                    : "border-sand bg-milk-50 text-ink-muted hover:border-caramel-300 hover:text-espresso",
                )}
              >
                {candidate.label}
                <span className={cn("text-xs tabular-nums", selected ? "text-caramel-200" : "text-ink-muted")}>
                  {orders.filter(candidate.match).length}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <label className="relative block flex-1 lg:w-64">
            <span className="sr-only">Cari nama, nomor WhatsApp, atau nomor PO</span>
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-muted" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama / nomor"
              className={cn(inputClass, "h-10 rounded-full pl-10")}
            />
          </label>
          <Button size="sm" onClick={() => setEditing("new")}>
            <PlusIcon />
            Pre-order baru
          </Button>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-3xl border border-sand/80 bg-milk-50 px-6 py-10 text-center text-ink-muted">
          {needle ? `Tidak ada pesanan yang cocok dengan "${query.trim()}".` : `Tidak ada pesanan di "${active.label}".`}
        </p>
      ) : (
        [...groups].map(([dueDate, dayOrders]) => {
          const late = dueDate < today && dayOrders.some((order) => isActiveOrder(order.status));
          return (
            <section key={dueDate} aria-label={formatDueDate(dueDate, today)}>
              <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                <h2 className="text-xl leading-tight font-bold tracking-[-0.01em] text-espresso">{formatDueDate(dueDate, today)}</h2>
                {late ? <Pill tone="bad">Lewat tanggal</Pill> : null}
                <p className="text-sm text-ink-muted">
                  {dayOrders.length} pesanan · {dayOrders.reduce((sum, order) => sum + itemsCount(order.items), 0)} pcs
                </p>
              </div>
              <ul className="grid gap-3 xl:grid-cols-2">
                {dayOrders.map((order) => (
                  <li key={order.id}>
                    <OrderCard
                      order={order}
                      onEdit={() => setEditing(order.id)}
                      onPay={() => setPayingId(order.id)}
                      onDelete={() => setDeletingId(order.id)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}

      <OrderDialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        menu={menu}
        today={today}
        order={editing && editing !== "new" ? (find(editing) ?? undefined) : undefined}
      />
      <PaymentDialog order={find(payingId)} onClose={() => setPayingId(null)} today={today} />
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeletingId(null)}
        action={() => deleteOrder(deletingId ?? "")}
        title={deleting ? `Hapus PO #${deleting.number}?` : "Hapus pesanan?"}
        confirmLabel="Hapus pesanan"
      >
        {deleting ? (
          <p>
            Pesanan {deleting.customer} akan dihapus permanen
            {deleting.paid > 0 ? `, termasuk catatan pembayaran ${formatRupiah(deleting.paid)} di pembukuan` : ""}.
            {deleting.status === "cancelled"
              ? ""
              : " Kalau pesanannya hanya dibatalkan, ubah statusnya jadi “Batal” supaya riwayatnya tetap ada."}
          </p>
        ) : null}
      </ConfirmDialog>
    </div>
  );
}

const iconButton =
  "grid size-10 shrink-0 place-items-center rounded-full text-ink-muted transition-colors hover:bg-caramel-50 hover:text-espresso";

function OrderCard({
  order,
  onEdit,
  onPay,
  onDelete,
}: {
  order: OrderView;
  onEdit: () => void;
  onPay: () => void;
  onDelete: () => void;
}) {
  const status = useSave();
  const next = nextOrderStep[order.status];
  const whatsapp = customerWhatsappLink(order);
  const closed = !isActiveOrder(order.status);
  const cancelled = order.status === "cancelled";

  const changeStatus = (value: OrderStatus) => status.save(() => setOrderStatus(order.id, value));

  return (
    <article
      className={cn(
        "flex h-full flex-col gap-3 rounded-3xl border border-sand/80 bg-milk-50 p-5 transition-opacity",
        closed && "bg-milk-50/60",
        status.pending && "opacity-60",
      )}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold tracking-[0.14em] text-caramel-700 uppercase">PO #{order.number}</p>
          <h3 className={cn("mt-0.5 text-xl leading-tight font-bold break-words text-espresso", cancelled && "line-through decoration-2")}>
            {order.customer}
          </h3>
        </div>
        <div className="-mt-1.5 -mr-2 flex shrink-0 items-center">
          {whatsapp ? (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Chat WhatsApp ${order.customer}`}
              className={iconButton}
            >
              <WhatsAppIcon className="size-5" />
            </a>
          ) : null}
          <button type="button" onClick={onEdit} aria-label={`Ubah PO #${order.number}`} className={iconButton}>
            <PencilIcon className="size-[1.15rem]" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Hapus PO #${order.number}`}
            className={cn(iconButton, "hover:bg-red-50 hover:text-red-700")}
          >
            <TrashIcon className="size-[1.15rem]" />
          </button>
        </div>
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
        {order.dueTime ? (
          <li className="flex items-center gap-1.5">
            <ClockIcon className="size-4" />
            {formatTime(order.dueTime)}
          </li>
        ) : null}
        <li className="flex items-center gap-1.5">
          {order.fulfillment === "delivery" ? <TruckIcon className="size-4" /> : <StoreIcon className="size-4" />}
          {fulfillmentLabels[order.fulfillment]}
        </li>
        {order.phone ? <li className="tabular-nums">{order.phone}</li> : null}
      </ul>

      <p className="leading-snug font-semibold text-espresso">{summarizeItems(order.items)}</p>

      {order.address ? (
        <p className="flex gap-1.5 text-sm text-ink-muted">
          <MapPinIcon className="mt-0.5 size-4 shrink-0" />
          <span className="break-words">{order.address}</span>
        </p>
      ) : null}
      {order.note ? <p className="rounded-xl bg-caramel-50 px-3 py-2 text-sm break-words text-espresso">{order.note}</p> : null}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-sand/70 pt-3">
        <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <div className="flex gap-1.5">
            <dt className="text-ink-muted">Total</dt>
            <dd className="font-semibold text-espresso tabular-nums">{formatRupiah(order.total)}</dd>
          </div>
          {order.paid > 0 && (order.remaining > 0 || cancelled) ? (
            <div className="flex gap-1.5">
              <dt className="text-ink-muted">Dibayar</dt>
              <dd className="font-semibold text-espresso tabular-nums">{formatRupiah(order.paid)}</dd>
            </div>
          ) : null}
          {order.remaining > 0 && !cancelled ? (
            <div className="flex gap-1.5">
              <dt className="text-ink-muted">Sisa</dt>
              <dd className="font-semibold text-espresso tabular-nums">{formatRupiah(order.remaining)}</dd>
            </div>
          ) : null}
        </dl>
        {/* Pesanan batal tidak punya tagihan: status bayarnya tidak relevan lagi */}
        {cancelled ? null : <PaymentPill status={order.payment} />}
      </div>

      {status.error ? (
        <p role="alert" className="text-sm font-semibold text-red-800">
          {status.error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative">
          <span className="sr-only">Status PO #{order.number}</span>
          <StatusSelect value={order.status} onChange={changeStatus} disabled={status.pending} />
        </label>
        {next ? (
          <Button size="sm" disabled={status.pending} onClick={() => changeStatus(next.status)}>
            {next.label}
          </Button>
        ) : null}
        {(!cancelled && order.remaining > 0) || order.payments.length > 0 ? (
          <Button size="sm" variant="soft" onClick={onPay}>
            <CoinIcon />
            {order.remaining > 0 && !cancelled ? "Catat bayar" : "Pembayaran"}
          </Button>
        ) : null}
      </div>
    </article>
  );
}

const selectTones: Record<string, string> = {
  info: "border-sky-200 bg-sky-50 text-sky-900",
  progress: "border-caramel-200 bg-caramel-100 text-caramel-800",
  good: "border-emerald-200 bg-emerald-50 text-emerald-900",
  muted: "border-espresso/10 bg-espresso/5 text-ink-muted",
  bad: "border-red-200 bg-red-50 text-red-800",
};

/** Status pesanan sebagai pilihan: bisa lompat ke status mana pun (termasuk Batal). */
function StatusSelect({
  value,
  onChange,
  disabled,
}: {
  value: OrderStatus;
  onChange: (value: OrderStatus) => void;
  disabled: boolean;
}) {
  return (
    <>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as OrderStatus)}
        className={cn(
          "h-10 cursor-pointer appearance-none rounded-full border pr-9 pl-4 text-sm font-bold disabled:cursor-default",
          selectTones[orderStatusTones[value]],
        )}
      >
        {ORDER_STATUSES.map((status) => (
          <option key={status} value={status} className="bg-white text-espresso">
            {orderStatusLabels[status]}
          </option>
        ))}
      </select>
      <ChevronRightIcon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 rotate-90 opacity-70" />
    </>
  );
}

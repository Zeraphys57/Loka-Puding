"use client";

import { useState, type FormEvent } from "react";
import { ConfirmDialog, Dialog } from "@/components/dapur/Dialog";
import { Field, FormFooter, MoneyInput, TextInput } from "@/components/dapur/fields";
import { useSave } from "@/components/dapur/useSave";
import { Button } from "@/components/ui/Button";
import { TrashIcon } from "@/components/ui/Icons";
import { addPayment, deleteTransaction } from "@/lib/dapur/actions";
import type { OrderPayment, OrderView } from "@/lib/dapur/calc";
import { formatDate } from "@/lib/dapur/dates";
import { formatRupiah } from "@/lib/format";

type PaymentDialogProps = {
  /** Pesanan yang dibayar; `null` = tertutup */
  order: OrderView | null;
  onClose: () => void;
  today: string;
};

/** Mencatat pembayaran sebuah pre-order (DP, cicilan, pelunasan) dan melihat riwayatnya. */
export function PaymentDialog({ order, onClose, today }: PaymentDialogProps) {
  return (
    <Dialog
      open={order !== null}
      onClose={onClose}
      title={order ? `Pembayaran PO #${order.number}` : "Pembayaran"}
      description={order ? `${order.customer} · otomatis tercatat di pembukuan` : undefined}
    >
      {order ? <Payments order={order} onClose={onClose} today={today} /> : null}
    </Dialog>
  );
}

function Payments({ order, onClose, today }: { order: OrderView; onClose: () => void; today: string }) {
  // Menghapus pembayaran tidak menutup jendela ini: riwayat & sisa tagihan langsung diperbarui
  const [removing, setRemoving] = useState<OrderPayment | null>(null);

  return (
    <div className="grid gap-5">
      <dl className="grid grid-cols-3 gap-2 rounded-2xl bg-custard/70 p-4 text-sm">
        <div>
          <dt className="text-ink-muted">Total</dt>
          <dd className="mt-0.5 font-semibold text-espresso">{formatRupiah(order.total)}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Sudah dibayar</dt>
          <dd className="mt-0.5 font-semibold text-espresso">{formatRupiah(order.paid)}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Sisa</dt>
          <dd className="mt-0.5 font-semibold text-espresso">{formatRupiah(order.remaining)}</dd>
        </div>
      </dl>

      {order.payments.length > 0 ? (
        <div>
          <h3 className="mb-2 font-sans text-sm font-bold text-espresso">Riwayat pembayaran</h3>
          <ul className="divide-y divide-sand/70 rounded-2xl border border-sand/80 bg-white">
            {order.payments.map((payment) => (
              <li key={payment.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-espresso tabular-nums">{formatRupiah(payment.amount)}</p>
                  <p className="truncate text-sm text-ink-muted">
                    {formatDate(payment.date)}
                    {payment.note ? ` · ${payment.note}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRemoving(payment)}
                  aria-label={`Hapus pembayaran ${formatRupiah(payment.amount)} tanggal ${formatDate(payment.date)}`}
                  className="grid size-9 shrink-0 place-items-center rounded-full text-ink-muted transition-colors hover:bg-red-50 hover:text-red-700"
                >
                  <TrashIcon className="size-[1.1rem]" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {order.status !== "cancelled" && order.remaining > 0 ? (
        // `key`: sisa tagihan berubah (pembayaran dihapus) → isian jumlah mulai lagi dari sisa terbaru
        <NewPayment key={order.remaining} order={order} onClose={onClose} today={today} />
      ) : (
        <div className="flex items-center justify-between gap-3">
          {order.status === "cancelled" ? (
            <p className="text-sm text-ink-muted">Pesanan ini batal. Kalau uangnya dikembalikan, hapus pembayarannya di atas.</p>
          ) : (
            <p className="font-semibold text-emerald-800">Pesanan ini sudah lunas.</p>
          )}
          <Button variant="soft" size="sm" onClick={onClose} className="shrink-0">
            Tutup
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        action={() => deleteTransaction(removing?.id ?? "")}
        title="Hapus pembayaran ini?"
        confirmLabel="Hapus pembayaran"
      >
        {removing ? (
          <p>
            Pembayaran {formatRupiah(removing.amount)} tanggal {formatDate(removing.date)} akan dihapus dari pesanan ini dan
            dari pembukuan.
          </p>
        ) : null}
      </ConfirmDialog>
    </div>
  );
}

function NewPayment({ order, onClose, today }: { order: OrderView; onClose: () => void; today: string }) {
  const [amount, setAmount] = useState(order.remaining);
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const { pending, error, save } = useSave(onClose);

  function submit(event: FormEvent) {
    event.preventDefault();
    save(() => addPayment({ orderId: order.id, amount, date, note }));
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Jumlah diterima" hint="Sudah terisi sisa tagihan. Ubah kalau baru bayar sebagian.">
          <MoneyInput value={amount} onChange={setAmount} data-autofocus />
        </Field>
        <Field label="Tanggal">
          <TextInput type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
        </Field>
      </div>
      <Field label="Keterangan" optional>
        <TextInput value={note} onChange={(event) => setNote(event.target.value)} placeholder="Mis. transfer BCA, tunai" maxLength={200} />
      </Field>
      <FormFooter pending={pending} error={error} onCancel={onClose} submitLabel="Catat pembayaran" />
    </form>
  );
}

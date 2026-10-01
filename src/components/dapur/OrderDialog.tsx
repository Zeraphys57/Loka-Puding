"use client";

import { useState, type FormEvent } from "react";
import { Dialog } from "@/components/dapur/Dialog";
import { Field, FormFooter, MoneyInput, Segmented, Stepper, Textarea, TextInput } from "@/components/dapur/fields";
import { useSave } from "@/components/dapur/useSave";
import { saveOrder } from "@/lib/dapur/actions";
import { itemsCount, itemsTotal, type OrderView } from "@/lib/dapur/calc";
import { addDays } from "@/lib/dapur/dates";
import type { Fulfillment, MenuOption } from "@/lib/dapur/types";
import { formatRupiah } from "@/lib/format";

type OrderDialogProps = {
  open: boolean;
  onClose: () => void;
  menu: MenuOption[];
  today: string;
  /** Diisi = mengubah pesanan ini; kosong = pesanan baru */
  order?: OrderView;
};

const FULFILLMENT_OPTIONS = [
  { id: "pickup", label: "Ambil sendiri" },
  { id: "delivery", label: "Diantar" },
] as const;

export function OrderDialog({ open, onClose, menu, today, order }: OrderDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={order ? `Ubah PO #${order.number}` : "Pre-order baru"}
      description={order ? undefined : "Catat pesanan yang masuk dari WhatsApp atau langsung."}
    >
      <OrderForm onClose={onClose} menu={menu} today={today} order={order} />
    </Dialog>
  );
}

function OrderForm({ onClose, menu, today, order }: Omit<OrderDialogProps, "open">) {
  // Menu yang sudah dihapus dari katalog tetap muncul kalau ada di pesanan lama, dengan harga saat dipesan
  const rows: MenuOption[] = [
    ...menu.map((item) => {
      const ordered = order?.items.find((line) => line.menuId === item.id);
      return ordered ? { ...item, name: ordered.name, price: ordered.price } : item;
    }),
    ...(order?.items ?? [])
      .filter((line) => !menu.some((item) => item.id === line.menuId))
      .map((line) => ({ id: line.menuId, name: line.name, price: line.price })),
  ];

  const [customer, setCustomer] = useState(order?.customer ?? "");
  const [phone, setPhone] = useState(order?.phone ?? "");
  const [qty, setQty] = useState<Record<string, number>>(() =>
    Object.fromEntries((order?.items ?? []).map((line) => [line.menuId, line.qty])),
  );
  const [fulfillment, setFulfillment] = useState<Fulfillment>(order?.fulfillment ?? "pickup");
  const [address, setAddress] = useState(order?.address ?? "");
  const [deliveryFee, setDeliveryFee] = useState(order?.deliveryFee ?? 0);
  const [discount, setDiscount] = useState(order?.discount ?? 0);
  const [dueDate, setDueDate] = useState(order?.dueDate ?? addDays(today, 1));
  const [dueTime, setDueTime] = useState(order?.dueTime ?? "");
  const [note, setNote] = useState(order?.note ?? "");
  const [downPayment, setDownPayment] = useState(0);
  const { pending, error, save } = useSave(onClose);

  const lines = rows.map((row) => ({ ...row, qty: qty[row.id] ?? 0 }));
  const pieces = itemsCount(lines);
  const total = Math.max(0, itemsTotal(lines) + (fulfillment === "delivery" ? deliveryFee : 0) - discount);

  function submit(event: FormEvent) {
    event.preventDefault();
    save(() =>
      saveOrder({
        id: order?.id,
        customer,
        phone,
        lines: lines.map((line) => ({ menuId: line.id, qty: line.qty })),
        deliveryFee,
        discount,
        dueDate,
        dueTime,
        fulfillment,
        address,
        note,
        downPayment: order ? undefined : downPayment,
      }),
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama pemesan">
          <TextInput value={customer} onChange={(event) => setCustomer(event.target.value)} required maxLength={80} autoComplete="off" data-autofocus />
        </Field>
        <Field label="Nomor WhatsApp" optional>
          <TextInput
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="0812…"
            maxLength={30}
            autoComplete="off"
          />
        </Field>
      </div>

      <div role="group" aria-labelledby="order-items-label" className="grid gap-2">
        <p id="order-items-label" className="text-sm font-bold text-espresso">
          Pesanan
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tanggal diambil / diantar">
          <TextInput type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} required />
        </Field>
        <Field label="Jam" optional>
          <TextInput type="time" value={dueTime} onChange={(event) => setDueTime(event.target.value)} />
        </Field>
      </div>

      <div className="grid gap-4">
        <Segmented label="Cara serah terima" options={FULFILLMENT_OPTIONS} value={fulfillment} onChange={setFulfillment} />
        {fulfillment === "delivery" ? (
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_11rem]">
            <Field label="Alamat antar" optional>
              <Textarea value={address} onChange={(event) => setAddress(event.target.value)} maxLength={300} />
            </Field>
            <Field label="Ongkir" optional>
              <MoneyInput value={deliveryFee} onChange={setDeliveryFee} />
            </Field>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Potongan harga" optional>
          <MoneyInput value={discount} onChange={setDiscount} />
        </Field>
        {order ? null : (
          <Field
            label="Sudah dibayar sekarang"
            optional
            hint="Uang muka atau pelunasan yang diterima hari ini. Otomatis masuk pembukuan."
          >
            <MoneyInput value={downPayment} onChange={setDownPayment} />
          </Field>
        )}
      </div>

      <Field label="Catatan" optional>
        <Textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} placeholder="Mis. tulisan di kartu ucapan, tanpa popcorn" />
      </Field>

      <FormFooter pending={pending} error={error} onCancel={onClose} submitLabel={order ? "Simpan perubahan" : "Simpan pesanan"}>
        <p className="text-sm text-ink-muted">
          {pieces} pcs · Total <strong className="text-lg font-semibold text-espresso">{formatRupiah(total)}</strong>
        </p>
      </FormFooter>
    </form>
  );
}

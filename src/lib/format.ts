const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

/** 15000 → "Rp 15.000" */
export function formatRupiah(value: number): string {
  return rupiah.format(value);
}

/** "09:00" → "09.00" (penulisan jam yang lazim di Indonesia) */
export function formatTime(time: string): string {
  return time.replace(":", ".");
}

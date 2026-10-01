import { siteConfig } from "@/config/site";
import { summarizeItems, type OrderView } from "@/lib/dapur/calc";
import { formatLongDate } from "@/lib/dapur/dates";
import { fulfillmentLabels } from "@/lib/dapur/types";
import { formatRupiah, formatTime } from "@/lib/format";

/** "0812-3456-7890" / "+62 812…" / "812…" → "6281234567890". Kosong kalau bukan nomor yang masuk akal. */
export function toWhatsappNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return "";
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}

/** Link chat WhatsApp ke pelanggan dengan rangkuman pesanannya sudah terisi. Kosong kalau nomornya tidak ada. */
export function customerWhatsappLink(order: OrderView): string {
  const number = toWhatsappNumber(order.phone);
  if (!number) return "";

  const when = `${formatLongDate(order.dueDate)}${order.dueTime ? ` pukul ${formatTime(order.dueTime)}` : ""}`;
  const message = [
    `Halo Kak ${order.customer}! Ini dari ${siteConfig.name} 👋`,
    "",
    `Pesanan PO #${order.number}:`,
    summarizeItems(order.items),
    `Total: ${formatRupiah(order.total)}`,
    order.remaining > 0 ? `Sisa pembayaran: ${formatRupiah(order.remaining)}` : "Pembayaran: lunas ✅",
    `${fulfillmentLabels[order.fulfillment]}: ${when}`,
  ].join("\n");

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

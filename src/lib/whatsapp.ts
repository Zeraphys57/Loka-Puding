import { siteConfig } from "@/config/site";

/** Mengganti {kunci} di template dengan nilainya. */
export function fillTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

/** https://wa.me/<nomor>?text=<pesan> */
export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${siteConfig.whatsapp.number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Link WhatsApp dengan pesan umum ("Pesan Sekarang"). */
export function whatsappOrderLink(): string {
  return whatsappLink(siteConfig.whatsapp.messages.general);
}

/** Link WhatsApp dengan nama & harga menu sudah terisi. */
export function whatsappItemLink(item: { name: string; priceLabel: string }): string {
  return whatsappLink(
    fillTemplate(siteConfig.whatsapp.messages.item, {
      item: item.name,
      price: item.priceLabel,
    }),
  );
}

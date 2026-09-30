import { menuItems } from "@/data/menu";

/**
 * Varian puding di hero, satu per menu (lihat src/data/menu.ts).
 * File ini sengaja tidak meng-import three.js supaya aman dipakai di Server Component.
 */
export const PUDDING_VARIANTS = ["klasik", "regal", "popcorn"] as const;

export type PuddingVariant = (typeof PUDDING_VARIANTS)[number];

export function isPuddingVariant(value: unknown): value is PuddingVariant {
  return typeof value === "string" && (PUDDING_VARIANTS as readonly string[]).includes(value);
}

/** Menu (id di src/data/menu.ts) yang diperagakan tiap varian, nama pendek untuk tombol, dan teks alternatifnya. */
export const VARIANT_INFO: Record<PuddingVariant, { menuId: string; short: string; alt: string }> = {
  klasik: {
    menuId: "puding-karamel",
    short: "Klasik",
    alt: "Puding karamel dua lapis Loka Pudding di atas piring keramik",
  },
  regal: {
    menuId: "puding-karamel-regal",
    short: "Regal",
    alt: "Puding karamel Loka Pudding dengan biskuit Regal tertancap di lapisan karamel dan remahannya",
  },
  popcorn: {
    menuId: "puding-karamel-popcorn",
    short: "Popcorn",
    alt: "Puding karamel Loka Pudding dengan tumpukan popcorn karamel di atasnya",
  },
};

/** Varian yang menunya ada: menu yang dihapus dari data/menu.ts otomatis hilang dari hero. */
export const HERO_VARIANTS: readonly PuddingVariant[] = PUDDING_VARIANTS.filter((variant) =>
  menuItems.some((item) => item.id === VARIANT_INFO[variant].menuId),
);

/** Data satu varian yang siap ditampilkan di hero (disusun di server dari data menu). */
export type HeroVariantItem = {
  variant: PuddingVariant;
  short: string;
  name: string;
  note?: string;
  alt: string;
  /** Link WhatsApp dengan nama & harga menu ini sudah terisi */
  orderHref: string;
};

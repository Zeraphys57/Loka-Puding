/**
 * Varian puding di hero, satu per menu (lihat src/data/menu.ts).
 * File ini sengaja tidak meng-import three.js supaya aman dipakai di Server Component.
 */
export const PUDDING_VARIANTS = ["klasik", "regal", "popcorn"] as const;

export type PuddingVariant = (typeof PUDDING_VARIANTS)[number];

export function isPuddingVariant(value: unknown): value is PuddingVariant {
  return typeof value === "string" && (PUDDING_VARIANTS as readonly string[]).includes(value);
}

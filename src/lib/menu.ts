import { menuCategories, menuItems, type MenuCategoryId, type MenuItem } from "@/data/menu";
import { formatRupiah } from "@/lib/format";

/** Data menu yang siap ditampilkan (label sudah diformat di server). */
export type MenuItemView = Omit<MenuItem, "imageAlt" | "available"> & {
  priceLabel: string;
  categoryLabel: string;
  imageAlt: string;
  available: boolean;
};

export type MenuCategoryView = { id: MenuCategoryId; label: string };

const categoryLabels = new Map<MenuCategoryId, string>(menuCategories.map((c) => [c.id, c.label]));

export function getMenuItems(): MenuItemView[] {
  return menuItems.map((item) => ({
    ...item,
    priceLabel: formatRupiah(item.price),
    categoryLabel: categoryLabels.get(item.category) ?? item.category,
    imageAlt: item.imageAlt ?? `Foto ${item.name}`,
    available: item.available ?? true,
  }));
}

/** Hanya kategori yang punya menu, agar tidak ada tombol filter kosong. */
export function getMenuCategories(items: MenuItemView[]): MenuCategoryView[] {
  return menuCategories
    .filter((category) => items.some((item) => item.category === category.id))
    .map(({ id, label }) => ({ id, label }));
}

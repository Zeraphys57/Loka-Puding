import { menuCategories, menuItems, type MenuCategoryId, type MenuItem } from "@/data/menu";
import { formatRupiah } from "@/lib/format";

/** Satu puding di dalam paket, untuk foto isi paket. */
export type BundlePart = { name: string; image?: string; imageAlt: string };

/** Data menu yang siap ditampilkan (label sudah diformat di server). */
export type MenuItemView = Omit<MenuItem, "imageAlt" | "available" | "contents"> & {
  priceLabel: string;
  categoryLabel: string;
  imageAlt: string;
  available: boolean;
  /** Isi paket; kosong untuk menu satuan. */
  contents: BundlePart[];
  /** Selisih dengan beli satuan, mis. "Rp2.000". Hanya ada jika paketnya memang lebih murah. */
  savingsLabel?: string;
};

export type MenuCategoryView = { id: MenuCategoryId; label: string };

const categoryLabels = new Map<MenuCategoryId, string>(menuCategories.map((c) => [c.id, c.label]));
const itemsById = new Map(menuItems.map((item) => [item.id, item]));

export function getMenuItems(): MenuItemView[] {
  return menuItems.map((item) => {
    const parts = (item.contents ?? []).map((id) => {
      const part = itemsById.get(id);
      // Salah ketik id di data/menu.ts harus gagal saat build, bukan diam-diam menghitung harga salah
      if (!part) throw new Error(`Menu "${item.id}": isi paket "${id}" tidak ada di menuItems`);
      return part;
    });
    const savings = parts.reduce((sum, part) => sum + part.price, 0) - item.price;

    return {
      ...item,
      priceLabel: formatRupiah(item.price),
      categoryLabel: categoryLabels.get(item.category) ?? item.category,
      imageAlt: item.imageAlt ?? `Foto ${item.name}`,
      available: item.available ?? true,
      contents: parts.map(({ name, image, imageAlt }) => ({ name, image, imageAlt: imageAlt ?? `Foto ${name}` })),
      savingsLabel: parts.length > 0 && savings > 0 ? formatRupiah(savings) : undefined,
    };
  });
}

/** Hanya kategori yang punya menu, agar tidak ada tombol filter kosong. */
export function getMenuCategories(items: MenuItemView[]): MenuCategoryView[] {
  return menuCategories
    .filter((category) => items.some((item) => item.category === category.id))
    .map(({ id, label }) => ({ id, label }));
}

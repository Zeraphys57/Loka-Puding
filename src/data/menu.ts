/**
 * Katalog menu Loka Puding. Satu-satunya tempat untuk mengubah menu.
 *
 * TODO: ini DATA CONTOH. Ganti nama, deskripsi, harga, dan foto dengan menu asli.
 * - `price` ditulis sebagai angka tanpa titik (15000 = Rp15.000)
 * - `image` menunjuk ke file di folder public/images/menu/
 * - `badge` opsional: "Best Seller" atau "Baru"
 * - `available: false` menandai menu yang sedang habis
 */

export const menuCategories = [
  { id: "puding-karamel", label: "Puding Karamel" },
] as const;

export type MenuCategoryId = (typeof menuCategories)[number]["id"];

export type MenuBadge = "Best Seller" | "Baru";

export type MenuItem = {
  id: string;
  name: string;
  category: MenuCategoryId;
  description: string;
  /** Harga dalam Rupiah, tanpa titik. */
  price: number;
  /** Path foto di folder public, mis. "/images/menu/puding-susu-telang.webp" */
  image: string;
  /** Deskripsi foto untuk pembaca layar. Jika kosong, dibuat dari nama menu. */
  imageAlt?: string;
  badge?: MenuBadge;
  /** Default `true`. Isi `false` kalau menu sedang habis. */
  available?: boolean;
};

export const menuItems: MenuItem[] = [
  {
    id: "puding-karamel",
    name: "Puding Karamel",
    category: "puding-karamel",
    description: "Puding susu lembut dengan saus karamel lumer.",
    price: 10000,
    image: "/images/menu/puding-karamel-v2.jpg",
    imageAlt: "Puding Karamel",
  },
  {
    id: "puding-karamel-regal",
    name: "Pudding Karamel Topping Regal",
    category: "puding-karamel",
    description: "Puding susu lembut berlapis karamel dengan topping biskuit Regal renyah.",
    price: 13000,
    image: "/images/menu/puding-karamel-regal-v2.jpg",
    imageAlt: "Pudding Karamel Topping Regal",
  },
  {
    id: "puding-karamel-popcorn",
    name: "Pudding Karamel Topping Popcorn Karamel",
    category: "puding-karamel",
    description: "Puding susu lembut berlapis karamel dengan topping popcorn karamel.",
    price: 15000,
    image: "/images/menu/puding-karamel-popcorn-v2.jpg",
    imageAlt: "Pudding Karamel Topping Popcorn Karamel",
  },
];

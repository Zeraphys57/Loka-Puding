/**
 * Katalog menu Loka Pudding. Satu-satunya tempat untuk mengubah menu.
 *
 * - `price` ditulis sebagai angka tanpa titik (15000 = Rp15.000)
 * - `image` menunjuk ke file di folder public/images/menu/.
 *   Belum punya foto? Hapus/kosongkan `image` → otomatis tampil template "Foto segera hadir".
 * - `badge` opsional: "Best Seller" atau "Baru"
 * - `note` opsional: catatan kecil bergaya tulisan tangan di dekat foto (mis. "ada kriuknya!")
 * - `topping` opsional: tambahan dibanding menu sebelumnya, tampil di panah "+ …" (mis. "biskuit Regal")
 * - `available: false` menandai menu yang sedang habis
 */

export const menuCategories = [
  { id: "puding-karamel", label: "Puding Karamel" },
  { id: "minuman", label: "Minuman" },
  { id: "bundling", label: "Paket Bundling" },
  // Tambah kategori baru di sini saat menu bertambah, mis. { id: "puding-susu", label: "Puding Susu" }.
  // Tombol filter kategori baru muncul otomatis jika ada lebih dari satu kategori yang punya menu.
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
  /** Path foto di folder public, mis. "/images/menu/puding-karamel-v2.jpg". Kosong = template foto. */
  image?: string;
  /** Deskripsi foto untuk pembaca layar. Jika kosong, dibuat dari nama menu. */
  imageAlt?: string;
  badge?: MenuBadge;
  /** Catatan tulisan tangan di dekat foto. Singkat saja (±15 huruf). */
  note?: string;
  /** Tambahan dibanding menu sebelumnya, untuk panah "+ …" di etalase (mis. "biskuit Regal"). */
  topping?: string;
  /** Default `true`. Isi `false` kalau menu sedang habis. */
  available?: boolean;
  /** Khusus paket: `id` menu yang ada di dalamnya. Foto isi & label "hemat Rp…" dibuat otomatis dari sini. */
  contents?: string[];
};

export const menuItems: MenuItem[] = [
  {
    id: "puding-karamel",
    name: "Puding Karamel",
    category: "puding-karamel",
    description: "Puding susu lembut dengan saus karamel lumer.",
    price: 10000,
    image: "/images/menu/puding-karamel-v9.jpg",
    imageAlt: "Puding karamel dalam cup bening dengan lapisan saus karamel di atasnya, di atas tumpukan puding dan es batu",
    note: "yang klasik!",
  },
  {
    id: "puding-karamel-regal",
    name: "Puding Karamel Topping Regal",
    category: "puding-karamel",
    description: "Puding susu lembut berlapis karamel dengan topping biskuit Regal renyah.",
    price: 13000,
    image: "/images/menu/puding-karamel-regal-v5.jpg",
    imageAlt: "Puding karamel dalam cup bening dengan potongan biskuit Regal di atasnya, di piring putih",
    note: "ada kriuknya!",
    topping: "biskuit Regal",
  },
  {
    id: "puding-karamel-popcorn",
    name: "Puding Karamel Topping Popcorn Karamel",
    category: "puding-karamel",
    description: "Puding susu lembut berlapis karamel dengan topping popcorn karamel.",
    price: 15000,
    image: "/images/menu/puding-karamel-popcorn-v5.jpg",
    imageAlt: "Puding karamel dalam cup bening dengan popcorn karamel di atas dan di sekelilingnya",
    note: "banjir popcorn!",
    topping: "popcorn karamel",
  },
  {
    id: "milk-tea",
    name: "Milk Tea",
    category: "minuman",
    description: "Teh susu dingin dalam botol, teman pas buat puding karamel.",
    price: 15000,
    image: "/images/menu/milk-tea-v6.jpg",
    imageAlt: "Milk tea dingin dengan es batu dalam gelas kaca bening",
    note: "teman puding!",
  },
  {
    id: "sweet-pair",
    name: "Sweet Pair",
    category: "bundling",
    description: "1 Puding Karamel klasik + 1 Milk Tea.",
    price: 22000,
    contents: ["puding-karamel", "milk-tea"],
  },
  {
    id: "regal-pair",
    name: "Regal Pair",
    category: "bundling",
    description: "1 Puding Karamel Topping Regal + 1 Milk Tea.",
    price: 25000,
    contents: ["puding-karamel-regal", "milk-tea"],
  },
  {
    id: "popcorn-pair",
    name: "Popcorn Pair",
    category: "bundling",
    description: "1 Puding Karamel Topping Popcorn Karamel + 1 Milk Tea.",
    price: 27000,
    contents: ["puding-karamel-popcorn", "milk-tea"],
  },
  {
    id: "sweet-trio",
    name: "Sweet Trio",
    category: "bundling",
    description: "Isi 3 puding: Puding Karamel klasik + Topping Regal + Topping Popcorn Karamel.",
    price: 35000,
    contents: ["puding-karamel", "puding-karamel-regal", "puding-karamel-popcorn"],
  },
];

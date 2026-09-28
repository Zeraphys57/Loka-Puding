/**
 * Katalog menu Loka Pudding. Satu-satunya tempat untuk mengubah menu.
 *
 * - `price` ditulis sebagai angka tanpa titik (15000 = Rp15.000)
 * - `image` menunjuk ke file di folder public/images/menu/.
 *   Belum punya foto? Hapus/kosongkan `image` → otomatis tampil template "Foto segera hadir".
 * - `badge` opsional: "Best Seller" atau "Baru"
 * - `note` opsional: catatan kecil bergaya tulisan tangan di dekat foto (mis. "ada kriuknya!")
 * - `available: false` menandai menu yang sedang habis
 */

export const menuCategories = [
  { id: "puding-karamel", label: "Puding Karamel" },
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
    imageAlt: "Puding karamel dalam gelas kaca dengan lapisan saus karamel di atas piring keramik",
    note: "yang klasik!",
  },
  {
    id: "puding-karamel-regal",
    name: "Puding Karamel Topping Regal",
    category: "puding-karamel",
    description: "Puding susu lembut berlapis karamel dengan topping biskuit Regal renyah.",
    price: 13000,
    image: "/images/menu/puding-karamel-regal-v2.jpg",
    imageAlt: "Puding karamel dengan biskuit Regal dan remahannya di atas lapisan karamel",
    note: "ada kriuknya!",
  },
  {
    id: "puding-karamel-popcorn",
    name: "Puding Karamel Topping Popcorn Karamel",
    category: "puding-karamel",
    description: "Puding susu lembut berlapis karamel dengan topping popcorn karamel.",
    price: 15000,
    image: "/images/menu/puding-karamel-popcorn-v2.jpg",
    imageAlt: "Puding karamel dengan tumpukan popcorn karamel di atasnya",
    note: "banjir popcorn!",
  },
];

/**
 * "Menu lainnya menyusul": slot template untuk menu yang akan datang.
 * Tampil di bawah katalog sebagai kartu "Segera Hadir" dengan gambar kosong.
 * - Sudah punya foto (mis. dari Gemini)? Isi `image`.
 * - Menu sudah siap dijual? Pindahkan ke `menuItems` di atas (lengkapi harga & kategori).
 * - Tidak ingin menampilkan bagian ini? Kosongkan array-nya: `[]`.
 */
export type UpcomingMenu = {
  id: string;
  /** Nama sementara, mis. "Varian Baru" atau nama menu yang sudah pasti */
  name: string;
  teaser: string;
  image?: string;
};

export const upcomingMenus: UpcomingMenu[] = [
  {
    id: "menu-baru-1",
    name: "Varian Baru",
    teaser: "Sedang kami racik di dapur. Tunggu kejutannya!",
  },
  {
    id: "menu-baru-2",
    name: "Varian Baru",
    teaser: "Rasa baru yang nggak kalah bikin nagih.",
  },
];

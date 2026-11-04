/**
 * Semua info bisnis Loka Pudding ada di file ini.
 * Ganti setiap nilai yang diberi tanda `TODO` dengan data asli.
 * Tidak perlu mengubah komponen apa pun: seluruh website membaca dari sini.
 */

export type SchemaDay =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export type OpeningHours = {
  /** Teks yang tampil di website, mis. "Senin – Jumat" */
  label: string;
  /** Hari dalam format schema.org (untuk Google) */
  days: readonly SchemaDay[];
  /** Jam buka & tutup format 24 jam "HH:MM" */
  opens: string;
  closes: string;
};

export const siteConfig = {
  name: "Loka Pudding",
  // TODO: sesuaikan tagline & deskripsi jika perlu
  tagline: "Puding lembut, goyangnya bikin gemas.",
  description:
    "Loka Pudding: puding karamel homemade yang lembut dengan saus karamel lumer. Tersedia topping biskuit Regal dan popcorn karamel. Dibuat fresh setiap hari, pesan langsung lewat WhatsApp.",
  keywords: [
    "puding",
    "puding karamel",
    "puding karamel regal",
    "puding popcorn karamel",
    "puding homemade",
    "dessert",
    "UMKM",
  ],

  whatsapp: {
    // Format internasional tanpa "+" dan tanpa 0 di depan (0895… → 62895…)
    number: "62895327578708",
    /** Nomor yang ditampilkan di website */
    display: "+62 895-3275-78708",
    messages: {
      /** Pesan untuk tombol "Pesan Sekarang" / "Pesan via WhatsApp" */
      general: "Halo Loka Pudding! 👋 Saya mau pesan pudding. Menu apa saja yang ready hari ini?",
      /** Pesan untuk tombol "Pesan Menu Ini". {item} dan {price} diisi otomatis */
      item: "Halo Loka Pudding! 👋 Saya mau pesan *{item}* ({price}). Apakah masih tersedia?",
    },
  },

  address: {
    street: "Perum, RT.07/RW.02, Kadisoko",
    locality: "Purwomartani, Kalasan",
    city: "Sleman",
    region: "DI Yogyakarta",
    postalCode: "55571",
    country: "ID",
  },

  // Titik toko dari Plus Code 6CWX+R95 (Kadisoko, Purwomartani)
  geo: {
    latitude: -7.752988,
    longitude: 110.448484,
  },

  maps: {
    embedUrl: "https://www.google.com/maps?q=-7.752988,110.448484&z=17&output=embed",
    link: "https://maps.google.com/?q=-7.752988,110.448484",
  },

  /**
   * Zona waktu toko. Dipakai Dapur (/dapur) untuk menentukan tanggal "hari ini":
   * server hosting memakai jam UTC, jadi tanpa ini pesanan pagi hari tercatat di tanggal kemarin.
   * WIB: "Asia/Jakarta" · WITA: "Asia/Makassar" · WIT: "Asia/Jayapura"
   */
  timeZone: "Asia/Jakarta",

  // TODO: jam buka asli
  openingHours: [
    {
      label: "Senin – Jumat",
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "20:00",
    },
    {
      label: "Sabtu – Minggu",
      days: ["Saturday", "Sunday"],
      opens: "08:00",
      closes: "21:00",
    },
  ] satisfies readonly OpeningHours[],

  social: {
    // TODO: akun Instagram asli
    instagram: {
      handle: "@lokapudding",
      url: "https://www.instagram.com/lokapudding?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==",
    },
    // TODO: akun TikTok asli (kosongkan url jika tidak ada)
    tiktok: {
      handle: "@lokapuding",
      url: "https://www.tiktok.com/@lokapuding",
    },
  },

  /**
   * Link toko di aplikasi pesan-antar.
   * Tombolnya otomatis muncul di bagian Lokasi kalau link-nya diisi.
   */
  delivery: {
    gofood: "", // TODO: link GoFood
    grabfood: "", // TODO: link GrabFood
    shopeefood: "", // TODO: link ShopeeFood
  },
  // Kisaran harga untuk Google dihitung otomatis dari data/menu.ts
} as const;

export type SiteConfig = typeof siteConfig;

export const navLinks = [
  { href: "#home", label: "Home" },
  { href: "#tentang", label: "Tentang" },
  { href: "#menu", label: "Menu" },
  { href: "#lokasi", label: "Lokasi" },
] as const;

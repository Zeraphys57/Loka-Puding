/**
 * Semua info bisnis Loka Puding ada di file ini.
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
  name: "Loka Puding",
  // TODO: sesuaikan tagline & deskripsi jika perlu
  tagline: "Puding lembut, goyangnya bikin gemas.",
  description:
    "Loka Puding: puding homemade yang lembut dari susu asli, buah segar, dan biru alami bunga telang. Dibuat fresh setiap hari, pesan langsung lewat WhatsApp.",
  keywords: [
    "puding",
    "puding homemade",
    "puding susu",
    "puding bunga telang",
    "puding cokelat",
    "hampers puding",
    "dessert",
    "UMKM",
  ],

  whatsapp: {
    // TODO: nomor WhatsApp asli, format internasional tanpa "+" dan tanpa 0 di depan (0812… → 62812…)
    number: "6281234567890",
    // TODO: nomor yang ditampilkan di website
    display: "+62 812-3456-7890",
    messages: {
      /** Pesan untuk tombol "Pesan Sekarang" / "Pesan via WhatsApp" */
      general: "Halo Loka Puding! 👋 Saya mau pesan puding. Menu apa saja yang ready hari ini?",
      /** Pesan untuk tombol "Pesan Menu Ini". {item} dan {price} diisi otomatis */
      item: "Halo Loka Puding! 👋 Saya mau pesan *{item}* ({price}). Apakah masih tersedia?",
    },
  },

  // TODO: alamat toko asli
  address: {
    street: "Jl. Contoh Manis No. 12",
    locality: "Kel. Contoh, Kec. Contoh",
    city: "Kota Contoh",
    region: "Jawa Barat",
    postalCode: "40000",
    country: "ID",
  },

  // TODO: koordinat toko (klik kanan lokasi di Google Maps → salin angka koordinat)
  geo: {
    latitude: -6.2,
    longitude: 106.816666,
  },

  maps: {
    // TODO: Google Maps → Bagikan → Sematkan peta → salin URL di dalam src="..."
    embedUrl: "https://www.google.com/maps?q=Jakarta&z=13&output=embed",
    // TODO: Google Maps → Bagikan → Salin link
    link: "https://maps.google.com/?q=Jakarta",
  },

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

  // TODO: sesuaikan dengan harga termurah – termahal di menu
  priceRange: "Rp12.000 – Rp120.000",
} as const;

export type SiteConfig = typeof siteConfig;

export const navLinks = [
  { href: "#beranda", label: "Beranda" },
  { href: "#tentang", label: "Tentang" },
  { href: "#menu", label: "Menu" },
  { href: "#lokasi", label: "Lokasi" },
] as const;

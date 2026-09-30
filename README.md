# Loka Puding — Website Brand & Menu

Website satu halaman untuk **Loka Puding**: puding 3D yang bisa "dicolek", katalog menu dengan pesan langsung via WhatsApp, info lokasi, dan SEO lengkap. Dibuat dengan Next.js, Tailwind CSS, GSAP, Lenis, dan React Three Fiber.

> **Penting:** semua teks, foto, alamat, dan nomor WhatsApp saat ini masih **contoh**. Cari tanda `TODO` di kode untuk bagian yang harus diganti (lihat [Checklist sebelum online](#checklist-sebelum-online)).

---

## Menjalankan di komputer

Syarat: **Node.js 20.9 atau lebih baru** ([unduh versi LTS](https://nodejs.org)).

```bash
npm install      # sekali saja, untuk memasang paket
npm run dev      # buka http://localhost:3000 (otomatis refresh saat file diubah)
```

Perintah lain:

| Perintah | Fungsi |
|---|---|
| `npm run build` | Membuat versi produksi (sekaligus cek error TypeScript) |
| `npm run start` | Menjalankan hasil `build` di http://localhost:3000 |
| `npm run lint` | Memeriksa kualitas kode |

---

## Mengubah info bisnis → `src/config/site.ts`

Semua info toko ada di **satu file** ini. Seluruh website (navbar, hero, lokasi, footer, data Google) otomatis ikut berubah.

| Bagian | Isi |
|---|---|
| `name`, `tagline`, `description` | Nama brand, slogan, dan deskripsi untuk Google |
| `whatsapp.number` | Format internasional **tanpa `+` dan tanpa 0 di depan**. Contoh: `0812-3456-7890` → `6281234567890` |
| `whatsapp.display` | Nomor yang tampil di website |
| `whatsapp.messages` | Pesan otomatis. `{item}` dan `{price}` akan terisi nama & harga menu |
| `address` | Alamat toko |
| `geo` | Koordinat toko (buka Google Maps → klik kanan titik toko → klik angka koordinat untuk menyalin) |
| `maps.embedUrl` | Google Maps → cari toko → **Bagikan** → **Sematkan peta** → salin URL di dalam `src="…"` |
| `maps.link` | Google Maps → **Bagikan** → **Salin link** |
| `openingHours` | Jam buka. `label` untuk tampilan, `days` dalam bahasa Inggris (untuk Google), jam format `"HH:MM"` |
| `social` | Link Instagram & TikTok |
| `delivery` | Link GoFood / GrabFood / ShopeeFood. **Tombolnya otomatis muncul** di bagian Lokasi kalau link-nya diisi |

Kisaran harga untuk Google dihitung otomatis dari harga menu, jadi tidak perlu diisi.

---

## Mengganti warna website → `src/config/theme.ts`

Ada dua palet: `"karamel"` (krem, karamel, espresso; yang dipakai sekarang) dan `"biru"` (biru pastel, diambil dari taplak gingham di foto menu). Ganti satu kata ini untuk berpindah:

```ts
export const palette: Palette = "karamel"; // atau "biru"
```

Nilai warnanya ada di `src/app/globals.css` (blok `@theme` untuk karamel, blok `[data-palette="biru"]` untuk biru). Warna produk (puding 3D, logo, navbar karamel, dan penampang puding di bagian Kisah Kami) sengaja tidak ikut berubah: pudingnya tetap karamel apa pun paletnya.

---

## Mengubah menu → `src/data/menu.ts`

Saat ini ada 3 menu: **Puding Karamel**, **Puding Karamel Topping Regal**, dan **Puding Karamel Topping Popcorn Karamel**. Setiap menu ditulis seperti ini:

```ts
{
  id: "puding-karamel-regal",        // unik, huruf kecil & tanda "-"
  name: "Puding Karamel Topping Regal",
  category: "puding-karamel",        // salah satu id di menuCategories
  description: "Puding susu lembut berlapis karamel dengan topping biskuit Regal renyah.",
  price: 13000,                      // tanpa titik: 13000 = Rp13.000
  image: "/images/menu/puding-karamel-regal-v2.jpg", // opsional, lihat "Belum punya foto?"
  imageAlt: "Puding karamel dengan biskuit Regal di atasnya", // opsional
  badge: "Best Seller",              // opsional: "Best Seller" atau "Baru"
  available: false,                  // opsional: isi false jika sedang habis
},
```

- **Menambah menu:** salin satu blok `{ … }`, tempel di dalam `menuItems`, lalu ubah isinya.
- **Menghapus menu:** hapus bloknya.
- **Belum punya foto?** Hapus baris `image`. Website otomatis menampilkan template **"Foto segera hadir"** yang rapi, jadi menu tetap bisa dijual dulu.
- **Kategori:** ubah daftar `menuCategories` di bagian atas file. Tombol filter kategori baru muncul otomatis begitu ada lebih dari satu kategori yang punya menu.
- Harga otomatis tampil sebagai `Rp 13.000`, dan tombol **Pesan Menu Ini** otomatis mengirim nama + harga ke WhatsApp.

### Slot "Menu lainnya menyusul"

Di bawah katalog ada bagian **Segera Hadir** berisi kartu dengan gambar kosong (template) + kartu ajakan follow Instagram. Isinya diatur di `upcomingMenus` (masih di `src/data/menu.ts`):

```ts
{ id: "menu-baru-1", name: "Varian Baru", teaser: "Sedang kami racik di dapur. Tunggu kejutannya!" },
```

- Sudah punya foto untuk menu yang akan datang? Tambahkan `image: "/images/menu/nama-file.jpg"`.
- Menunya sudah resmi dijual? **Pindahkan** ke `menuItems` (lengkapi harga, kategori, deskripsi).
- Tidak ingin menampilkan bagian ini? Kosongkan: `export const upcomingMenus: UpcomingMenu[] = [];`

---

## Mengganti & menambah foto

**Foto menu** ada di `public/images/menu/`. Saat ini: `puding-karamel-v2.jpg`, `puding-karamel-regal-v2.jpg`, `puding-karamel-popcorn-v2.jpg`.

1. Siapkan foto **persegi (1:1)**, idealnya **1024 × 1024 px**, format JPG atau WebP.
2. Simpan ke `public/images/menu/` dengan nama huruf kecil tanpa spasi (mis. `puding-karamel-oreo.jpg`).
3. Isi kolom `image` di `src/data/menu.ts`, mis. `image: "/images/menu/puding-karamel-oreo.jpg"`.

Next.js otomatis memperkecil & mengompres foto sesuai layar pengunjung, jadi tidak perlu membuat banyak versi.

### Membuat foto menu baru dengan Gemini (Nano Banana)

Agar foto menu baru **senada** dengan 3 foto yang sudah ada (gelas kaca, piring keramik berbintik, sendok perak, taplak kotak-kotak biru-putih):

1. Buka Gemini, **lampirkan salah satu foto yang sudah ada** (mis. `puding-karamel-v2.jpg`) sebagai contoh gaya.
2. Tempel prompt ini, lalu ganti bagian `[TOPPING]`:

   > Buat foto produk baru dengan gaya, sudut kamera, gelas, piring, sendok, taplak, dan pencahayaan yang **sama persis** seperti foto ini. Isinya: puding susu putih lembut dalam gelas kaca bening dengan lapisan saus karamel mengilap di atasnya, diberi topping **[TOPPING]**. Foto makanan realistis, rasio 1:1 (persegi), latar belakang blur, tanpa teks dan tanpa logo.

3. Unduh hasilnya, simpan ke `public/images/menu/`, lalu isi `image` pada menu tersebut.

**Ikon & gambar pratinjau link:**

| File | Kegunaan |
|---|---|
| `src/app/icon.svg`, `src/app/favicon.ico` | Ikon di tab browser |
| `src/app/apple-icon.png` (180×180) | Ikon saat disimpan ke layar utama iPhone |
| `src/app/opengraph-image.tsx` | Gambar pratinjau saat link dibagikan di WhatsApp/Instagram. Dibuat otomatis dari nama & slogan di `site.ts` |

---

## Puding 3D

Puding di bagian atas halaman adalah model 3D yang **bergoyang saat dicolek**, condong mengikuti kursor, dan ikut "terguncang" saat halaman di-scroll.

- Model 3D hanya dimuat setelah halaman selesai tampil, dan **hanya di perangkat yang mampu**. Di perangkat lain (mode hemat data, memori kecil, tanpa kartu grafis, atau pengaturan "kurangi gerakan"), tampil ilustrasi puding yang sama dalam bentuk gambar.
- Untuk mencoba: tambahkan `?pudding=3d` (paksa 3D) atau `?pudding=static` (paksa gambar) di belakang URL.
- **Tiga varian: Klasik, Regal, Popcorn.** Pengunjung bisa menggeser pudingnya ke kiri-kanan atau memilih lewat tombol di bawahnya. Nama, harga, catatan tangan, dan pesan WhatsApp diambil otomatis dari menu yang bersangkutan di `src/data/menu.ts`. Menu yang dihapus dari data otomatis hilang dari hero. Link langsung ke satu varian: `?varian=regal` atau `?varian=popcorn`.
- Topping dibuat langsung dengan kode (tanpa file model): bentuk & posisinya ada di `src/components/three/toppingLayout.ts` dan `toppings.ts`, gambar cadangannya di `PuddingFallback.tsx`.
- **Mengatur rasa goyangan:** ubah angka di `src/components/three/jiggle.config.ts` (kekakuan, redaman, kekuatan colekan, dll.). Saat `npm run dev`, nilainya bisa dicoba langsung dari console browser lewat `window.__JIGGLE`.
- **Warna & tekstur:** warna lapisan susu, karamel, dan piring ada di `createMaterials` (`src/components/three/Pudding.tsx`). Tekstur (pori halus, riak karamel, bintik piring keramik) dibuat langsung di shader tanpa file gambar, lihat `src/components/three/surfaceDetail.ts`. Kalau warnanya diubah, samakan juga gradasi di `PuddingFallback.tsx` (versi gambar/cadangan).

> Alat uji seperti PageSpeed/Lighthouse umumnya berjalan tanpa kartu grafis, sehingga yang dinilai adalah versi gambar. Ini memang perilaku yang benar untuk perangkat tanpa GPU.

---

## Online-kan ke Vercel (gratis)

1. Simpan proyek ke GitHub:
   ```bash
   git init
   git add .
   git commit -m "Website Loka Puding"
   ```
   Lalu buat repository baru di [github.com](https://github.com/new) dan ikuti petunjuk `git remote add` + `git push`.
2. Masuk ke [vercel.com](https://vercel.com) dengan akun GitHub → **Add New… → Project** → pilih repository tadi → **Deploy**. Tidak perlu pengaturan apa pun.
3. **Domain sendiri (opsional):** di Vercel buka **Settings → Domains** dan tambahkan domain Anda. Lalu di **Settings → Environment Variables** tambahkan `NEXT_PUBLIC_SITE_URL` = `https://domainanda.com` dan deploy ulang, agar link untuk Google & pratinjau WhatsApp memakai domain tersebut.
4. Setiap kali ada perubahan yang di-`push` ke GitHub, Vercel otomatis memperbarui website.

Setelah online, cek hasilnya di:
- [Rich Results Test](https://search.google.com/test/rich-results): data toko & menu untuk Google
- [PageSpeed Insights](https://pagespeed.web.dev): kecepatan di HP

---

## Struktur folder

```
src/
├─ app/                 halaman, metadata SEO, ikon, sitemap, robots
├─ components/
│  ├─ sections/         Navbar, Hero, Tentang, Menu, Lokasi, Footer
│  ├─ ui/               tombol, kartu menu, dialog detail, filter, menu mobile, dll.
│  ├─ three/            puding 3D (bentuk, material, fisika goyangan) + ilustrasi cadangan
│  └─ providers/        smooth scroll (Lenis)
├─ config/site.ts       ← info bisnis
├─ config/theme.ts      ← palet warna (biru / karamel)
├─ data/menu.ts         ← daftar menu
└─ lib/                 fungsi bantu (format Rupiah, link WhatsApp, scroll, dll.)
public/images/menu/     ← foto menu
```

---

## Checklist sebelum online

Cari `TODO` di proyek (di VS Code: `Ctrl + Shift + F`) lalu lengkapi:

- [ ] Nomor WhatsApp & isi pesan otomatis (`site.ts`)
- [ ] Alamat, koordinat, link & embed Google Maps (`site.ts`)
- [ ] Jam buka (`site.ts`)
- [ ] Instagram, TikTok, link GoFood/GrabFood/ShopeeFood (`site.ts`)
- [ ] Cek harga & deskripsi 3 menu karamel (`menu.ts`)
- [ ] Atur slot "Menu lainnya menyusul" atau kosongkan jika tidak dipakai (`upcomingMenus` di `menu.ts`)
- [ ] Cerita brand & keunggulan (`src/components/sections/About.tsx`)
- [ ] Logo/ikon asli jika ada (`src/app/icon.svg`, `favicon.ico`, `apple-icon.png`)
- [ ] Domain (`NEXT_PUBLIC_SITE_URL` di Vercel)

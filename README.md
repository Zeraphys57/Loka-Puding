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

## Dapur: catatan toko (pre-order, pembukuan, stok bahan) → `/dapur`

Dapur dipakai **online**: catatan yang sama terbuka dari HP maupun laptop, lewat alamat website + `/dapur`.

| Halaman | Isinya |
|---|---|
| **Ringkasan** | Laba bulan ini, tagihan yang belum dibayar, pesanan yang harus disiapkan seminggu ke depan, stok yang menipis |
| **Pre-order** | Catat pesanan (menu, tanggal ambil/antar, ongkir, potongan), ubah status Baru → Sedang dibuat → Siap → Selesai, catat DP & pelunasan, chat WhatsApp pelanggan dengan rangkuman pesanan |
| **Pembukuan** | Uang masuk & keluar per bulan, laba, saldo kas, pengeluaran per kategori, unduh CSV untuk Excel |
| **Bahan** | Stok bahan/kemasan, catat belanja & pemakaian (beberapa bahan sekaligus), koreksi stok, tanda menipis/habis |

Yang dicatat sekali muncul di semua tempat: **pembayaran pre-order** dan **belanja bahan** otomatis masuk Pembukuan. Daftar menu dan harganya diambil dari `src/data/menu.ts`; pesanan lama tetap memakai harga saat dipesan.

### Tanpa login: pakai link rahasia

Dapur tidak punya halaman login. Gantinya ada satu **link rahasia**:

```
https://alamat-website-anda/dapur/buka?kunci=KUNCI-ANDA
```

- Buka link itu **sekali** di HP atau laptop → perangkat itu diingat (sekitar setahun), dan selanjutnya cukup buka `/dapur`.
- Perangkat yang belum pernah membuka link itu hanya melihat **404**, seolah halamannya tidak ada.
- **Perlakukan link ini seperti kunci toko.** Siapa pun yang memegangnya bisa melihat data pelanggan dan mengubah pembukuan. Simpan di tempat pribadi (mis. "Pesan Tersimpan" WhatsApp), jangan dikirim ke grup.
- Pinjam HP orang lain? Setelah selesai, tekan **Kunci perangkat ini** di bagian bawah Dapur.
- Link bocor atau HP hilang? Ganti `DAPUR_KEY` di Vercel lalu deploy ulang: semua perangkat lama langsung terkunci, dan link baru memakai kunci yang baru.

### Menyalakan Dapur di Vercel (sekali saja)

Repo ini publik, jadi kunci dan alamat database **tidak pernah ditulis di kode**. Keduanya disimpan di Vercel:

1. **Database (Supabase).** Pilih salah satu:
   - *Paling mudah:* di dashboard Vercel buka proyek ini → tab **Storage** → **Create Database** → **Supabase** → region **Singapore** → sambungkan ke proyek. Vercel otomatis mengisi `POSTGRES_URL`.
   - *Sudah punya proyek Supabase:* di dashboard Supabase klik **Connect** → salin connection string **Transaction pooler** (port `6543`, bukan "Direct connection") → di Vercel **Settings → Environment Variables** tambah `DATABASE_URL` berisi string itu, dengan password-nya sudah diisi.

   Tidak perlu membuat tabel: Dapur menyiapkannya sendiri saat pertama kali dibuka.
2. **Kunci.** Di komputer, jalankan `npm run dapur:kunci` untuk membuat kunci acak. Di Vercel: **Settings → Environment Variables** → tambah `DAPUR_KEY` dengan nilai kunci itu (centang Production). Kunci di bawah 20 huruf ditolak.
3. **Deploy ulang** (push ke GitHub, atau tombol Redeploy di Vercel).
4. Buka link rahasia di HP dan laptop Anda. Selesai.

Kalau Dapur menampilkan "belum tersambung ke database", langkah 1 belum selesai atau belum di-deploy ulang.

### Datanya di mana?

- Di database Supabase tadi, dalam satu dokumen (tabel `dapur.store`). Salinan harian otomatis disimpan di tabel `dapur.backup` (30 hari terakhir).
- Tabelnya sengaja di schema **`dapur`**, bukan `public`, dan Row Level Security-nya aktif: API bawaan Supabase (yang bisa dipakai siapa pun yang memegang "anon key") tidak bisa menyentuhnya. Di Table Editor Supabase, ganti pilihan schema ke `dapur` untuk melihatnya. **Jangan pindahkan tabel ini ke `public` dan jangan tambahkan `dapur` ke "Exposed schemas".**
- **Paket gratis Supabase menjeda proyek yang sepi sekitar seminggu.** Kalau setelah lama tidak dipakai Dapur menampilkan "Catatan belum bisa dibuka", buka dashboard Supabase → **Resume project**. Catatannya tidak hilang.
- Tombol **Unduh cadangan** di bagian bawah Dapur mengunduh seluruh catatan sebagai satu file. Unduh sesekali dan simpan di Google Drive.
- Tanggal "hari ini" mengikuti zona waktu toko (`timeZone` di `src/config/site.ts`, bawaan WIB).

### Mencoba di komputer sendiri

`npm run dev`, lalu buka `http://localhost:3000/dapur` (kalau port 3000 terpakai, lihat alamat di terminal). Di sini Dapur terbuka tanpa kunci dan catatannya disimpan di folder `catatan-toko/`: **terpisah** dari Dapur yang online, cocok untuk coba-coba. Folder itu tidak ikut ke GitHub.

Aturan aksesnya ada di `src/lib/dapur/access.ts`, penyimpanannya di `src/lib/dapur/store.ts`.

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
│  └─ dapur/            halaman Dapur (ringkasan, pre-order, pembukuan, bahan)
├─ components/
│  ├─ sections/         Navbar, Hero, Tentang, Menu, Lokasi, Footer
│  ├─ ui/               tombol, kartu menu, dialog detail, filter, menu mobile, dll.
│  ├─ dapur/            form & daftar Dapur
│  ├─ three/            puding 3D (bentuk, material, fisika goyangan) + ilustrasi cadangan
│  └─ providers/        smooth scroll (Lenis)
├─ config/site.ts       ← info bisnis
├─ config/theme.ts      ← palet warna (biru / karamel)
├─ data/menu.ts         ← daftar menu
└─ lib/                 fungsi bantu (format Rupiah, link WhatsApp, scroll, dll.)
   └─ dapur/            data Dapur: penyimpanan file, perhitungan, aturan akses
public/images/menu/     ← foto menu
catatan-toko/           ← catatan Dapur saat coba-coba di komputer (tidak ikut ke GitHub)
vercel.json             ← server Vercel di Singapura, dekat database & pembeli
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
- [ ] Dapur: database Supabase + `DAPUR_KEY` di Vercel (lihat bagian Dapur)

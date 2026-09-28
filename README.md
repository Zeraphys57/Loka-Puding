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
| `priceRange` | Kisaran harga termurah–termahal |

---

## Mengubah menu → `src/data/menu.ts`

Setiap menu ditulis seperti ini:

```ts
{
  id: "puding-susu-telang",          // unik, huruf kecil & tanda "-" (dipakai juga untuk nama foto)
  name: "Puding Susu Telang",
  category: "puding-susu",           // salah satu id di menuCategories
  description: "Signature kami! Dua lapis puding ...",
  price: 15000,                      // tanpa titik: 15000 = Rp15.000
  image: "/images/menu/puding-susu-telang.webp",
  imageAlt: "Puding dua lapis biru dan putih dengan krim di atasnya", // opsional
  badge: "Best Seller",              // opsional: "Best Seller" atau "Baru"
  available: false,                  // opsional: isi false jika sedang habis
},
```

- **Menambah menu:** salin satu blok `{ … }`, tempel di dalam `menuItems`, lalu ubah isinya.
- **Menghapus menu:** hapus bloknya.
- **Kategori:** ubah daftar `menuCategories` di bagian atas file. Tombol filter kategori yang tidak punya menu otomatis disembunyikan.
- Harga otomatis tampil sebagai `Rp 15.000`, dan tombol **Pesan Menu Ini** otomatis mengirim nama + harga ke WhatsApp.

---

## Mengganti foto

**Foto menu** ada di `public/images/menu/`.

1. Siapkan foto **persegi (1:1)**, minimal **800 × 800 px**, format JPG atau WebP (usahakan < 300 KB).
2. Paling mudah: beri nama **sama persis** dengan file contoh (mis. `puding-susu-telang.webp`) lalu timpa filenya.
3. Jika nama/format berbeda (mis. `.jpg`), sesuaikan kolom `image` di `src/data/menu.ts`.

Next.js otomatis memperkecil & mengompres foto sesuai layar pengunjung, jadi tidak perlu membuat banyak versi.

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
- **Mengatur rasa goyangan:** ubah angka di `src/components/three/jiggle.config.ts` (kekakuan, redaman, kekuatan colekan, dll.). Saat `npm run dev`, nilainya bisa dicoba langsung dari console browser lewat `window.__JIGGLE`.

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
- [ ] Nama, deskripsi, harga, dan foto menu asli (`menu.ts` + `public/images/menu/`)
- [ ] Cerita brand & keunggulan (`src/components/sections/About.tsx`)
- [ ] Logo/ikon asli jika ada (`src/app/icon.svg`, `favicon.ico`, `apple-icon.png`)
- [ ] Domain (`NEXT_PUBLIC_SITE_URL` di Vercel)

import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { DapurError } from "@/lib/dapur/errors";

/*
 * Dapur online TANPA halaman login. Pengamannya "link rahasia":
 *
 * 1. Pemilik membuat kunci acak dan menyimpannya di pengaturan hosting sebagai DAPUR_KEY
 *    (TIDAK di dalam kode: repo ini publik).
 * 2. Membuka https://…/dapur/buka?kunci=<kunci> sekali di sebuah HP/laptop membuat perangkat itu "diingat"
 *    (cookie yang tidak bisa dibaca JavaScript), lalu /dapur langsung terbuka di perangkat itu.
 * 3. Tanpa cookie itu, semua halaman & aksi Dapur menjawab 404: orang lain bahkan tidak melihat halaman login.
 *
 * Siapa pun yang memegang link itu bisa membuka Dapur, jadi perlakukan link-nya seperti kunci toko.
 * Kalau link bocor atau HP hilang: ganti DAPUR_KEY di hosting → semua perangkat lama langsung terkunci.
 *
 * Pengecualian: saat `npm run dev` di komputer sendiri (alamat localhost), Dapur terbuka tanpa kunci.
 */

const DEVICE_COOKIE = "loka_dapur";
const COOKIE_PATH = "/dapur";
// Batas umur cookie di Chrome adalah 400 hari; setelah itu link rahasia perlu dibuka lagi di perangkat tersebut
const REMEMBER_SECONDS = 400 * 24 * 60 * 60;
// Kunci pendek bisa ditebak dengan mencoba-coba: tolak, anggap Dapur belum diaktifkan
const MIN_KEY_LENGTH = 20;

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);

function configuredKey(): string | null {
  const key = process.env.DAPUR_KEY?.trim() ?? "";
  return key.length >= MIN_KEY_LENGTH ? key : null;
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

/** Perbandingan yang lamanya tidak bergantung pada isi, supaya kunci tidak bisa ditebak dari waktu respons. */
function sameSecret(a: string, b: string): boolean {
  return timingSafeEqual(digest(a), digest(b));
}

/** Isi cookie perangkat: turunan dari kunci, bukan kuncinya sendiri. Kunci diganti → semua cookie lama tidak cocok lagi. */
function deviceToken(key: string): string {
  return digest(`loka-dapur-perangkat:${key}`).toString("hex");
}

async function isLocalDevelopment(): Promise<boolean> {
  if (process.env.NODE_ENV !== "development") return false;
  const host = (await headers()).get("host") ?? "";
  try {
    return LOCAL_HOSTNAMES.has(new URL(`http://${host}`).hostname);
  } catch {
    return false;
  }
}

/** Perangkat ini pernah membuka link rahasia yang masih berlaku? */
export async function isRememberedDevice(): Promise<boolean> {
  const key = configuredKey();
  const token = (await cookies()).get(DEVICE_COOKIE)?.value;
  return key !== null && token !== undefined && sameSecret(token, deviceToken(key));
}

export async function canOpenDapur(): Promise<boolean> {
  return (await isLocalDevelopment()) || (await isRememberedDevice());
}

/** Untuk server action: gagal keras kalau Dapur tidak boleh dibuka dari perangkat ini. */
export async function requireDapur(): Promise<void> {
  if (!(await canOpenDapur())) {
    throw new DapurError("Perangkat ini belum terdaftar untuk Dapur. Buka lagi link rahasia Dapur, lalu coba lagi.");
  }
}

/** Kunci dari link rahasia benar? (Selalu salah kalau DAPUR_KEY belum diisi.) */
export function isDapurKey(candidate: string): boolean {
  const key = configuredKey();
  return key !== null && sameSecret(candidate, key);
}

/** Cookie yang membuat perangkat "diingat". Dipasang oleh /dapur/buka setelah kuncinya cocok. */
export function deviceCookie() {
  const key = configuredKey();
  if (!key) return null;
  return {
    name: DEVICE_COOKIE,
    value: deviceToken(key),
    httpOnly: true,
    // Saat development alamatnya http://, cookie `secure` tidak akan tersimpan
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: COOKIE_PATH,
    maxAge: REMEMBER_SECONDS,
  };
}

/** Melupakan perangkat ini (mis. setelah membuka Dapur di HP orang lain). Hanya bisa dipanggil dari server action. */
export async function forgetDevice(): Promise<void> {
  (await cookies()).set(DEVICE_COOKIE, "", { path: COOKIE_PATH, maxAge: 0 });
}

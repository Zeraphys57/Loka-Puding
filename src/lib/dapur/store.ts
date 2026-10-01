import "server-only";
import { notFound } from "next/navigation";
import { cache } from "react";
import { canOpenDapur, requireDapur } from "@/lib/dapur/access";
import { DapurError } from "@/lib/dapur/errors";
import { readFileDb, updateFileDb } from "@/lib/dapur/store-file";
import { databaseUrl, readPostgresDb, updatePostgresDb } from "@/lib/dapur/store-postgres";
import type { Db } from "@/lib/dapur/types";

/*
 * Tempat catatan toko disimpan:
 * - "database": Postgres di Supabase (POSTGRES_URL / DATABASE_URL terisi). Inilah yang dipakai website
 *    yang sudah online, jadi catatan yang sama terlihat dari HP maupun laptop.
 * - "file":     catatan-toko/data.json di komputer ini. Untuk mencoba Dapur saat `npm run dev` tanpa database.
 * - "missing":  sudah online di Vercel tapi database belum disambungkan. File tidak bisa dipakai di sana,
 *    jadi Dapur menampilkan petunjuk penyambungan (lihat layout Dapur).
 */
export type Storage = "database" | "file" | "missing";

export function storageKind(): Storage {
  if (databaseUrl()) return "database";
  return process.env.VERCEL ? "missing" : "file";
}

const NOT_CONNECTED = "Dapur belum tersambung ke database. Sambungkan Supabase di pengaturan hosting dulu.";

/**
 * Membaca seluruh catatan untuk ditampilkan. Dalam satu permintaan halaman, hanya dibaca sekali.
 * Kalau perangkat ini tidak boleh membuka Dapur → halaman 404.
 */
export const getDb = cache(async (): Promise<Db> => {
  if (!(await canOpenDapur())) notFound();
  const storage = storageKind();
  if (storage === "missing") throw new DapurError(NOT_CONNECTED);
  return storage === "database" ? readPostgresDb() : readFileDb();
});

/**
 * Mengubah catatan: `change` menerima data terbaru dan mengubahnya di tempat.
 * Kalau `change` melempar error, tidak ada yang tersimpan.
 */
export async function updateDb<T>(change: (db: Db) => T): Promise<T> {
  await requireDapur();
  const storage = storageKind();
  if (storage === "missing") throw new DapurError(NOT_CONNECTED);
  return storage === "database" ? updatePostgresDb(change) : updateFileDb(change);
}

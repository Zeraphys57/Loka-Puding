import "server-only";
import postgres from "postgres";
import { todayISO } from "@/lib/dapur/dates";
import { emptyDb, type Db } from "@/lib/dapur/types";

/*
 * Penyimpanan online: database Postgres di Supabase.
 * Alamatnya dibaca dari environment variable di hosting, tidak pernah ditulis di kode:
 * - POSTGRES_URL  diisi otomatis kalau Supabase disambungkan lewat Vercel (Storage → Supabase), atau
 * - DATABASE_URL  diisi sendiri dengan connection string "Transaction pooler" dari dashboard Supabase.
 *
 * Seluruh catatan toko disimpan sebagai satu dokumen JSON di tabel `dapur.store` (bentuknya sama
 * persis dengan file catatan-toko/data.json), jadi seluruh logika Dapur tidak perlu tahu bedanya.
 * Tabel `dapur.backup` menyimpan salinan harian: keadaan sebelum perubahan pertama tiap hari, 30 hari terakhir.
 *
 * KEAMANAN (penting di Supabase): tabel di schema `public` otomatis bisa diakses lewat API bawaan Supabase
 * oleh siapa pun yang memegang "anon key". Karena itu tabel Dapur sengaja TIDAK di `public`, melainkan di
 * schema `dapur` yang tidak diekspos API, dan Row Level Security dinyalakan tanpa policy sebagai lapis kedua.
 * Yang bisa membacanya hanya koneksi database langsung dari server ini. Jangan pindahkan ke `public`.
 */

const STORE_ID = "main";
const BACKUP_DAYS = 30;

export function databaseUrl(): string | null {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || null;
}

type Sql = ReturnType<typeof postgres>;

// Satu koneksi (pool) per proses server, juga saat modul dimuat ulang di development
const holder = globalThis as typeof globalThis & { __lokaDapurSql?: Sql; __lokaDapurTables?: Promise<void> };

function connect(): Sql {
  if (holder.__lokaDapurSql) return holder.__lokaDapurSql;

  const url = new URL(databaseUrl() ?? "");
  // Parameter lain di alamat (mis. `supa=base-pooler.x` atau `pgbouncer=true` dari Supabase) akan dikirim
  // driver ini ke server sebagai pengaturan sesi dan ditolak. Yang dipakai hanya sslmode; sisanya dibuang.
  const sslmode = url.searchParams.get("sslmode");
  url.search = "";
  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";

  holder.__lokaDapurSql = postgres(url.toString(), {
    ssl: sslmode === "disable" ? false : sslmode === "verify-full" ? "verify-full" : isLocal && !sslmode ? false : "require",
    // Pooler Supabase mode transaksi (port 6543) tidak mendukung prepared statement
    prepare: false,
    max: 3,
    idle_timeout: 20,
    connect_timeout: 15,
    onnotice: () => {},
  });
  return holder.__lokaDapurSql;
}

/**
 * Menyiapkan schema & tabel saat Dapur pertama kali dipakai (tidak perlu menjalankan SQL manual).
 * Dicek sekali per proses; kalau gagal, dicoba lagi di permintaan berikutnya.
 */
function ensureTables(sql: Sql): Promise<void> {
  holder.__lokaDapurTables ??= (async () => {
    const [{ ready }] = await sql`
      SELECT to_regclass('dapur.store') IS NOT NULL AND to_regclass('dapur.backup') IS NOT NULL AS ready`;
    if (ready) return;

    await sql.begin(async (tx) => {
      await tx`CREATE SCHEMA IF NOT EXISTS dapur`;
      await tx`
        CREATE TABLE IF NOT EXISTS dapur.store (
          id text PRIMARY KEY,
          data jsonb NOT NULL,
          updated_at timestamptz NOT NULL DEFAULT now()
        )`;
      await tx`
        CREATE TABLE IF NOT EXISTS dapur.backup (
          day date PRIMARY KEY,
          data jsonb NOT NULL
        )`;
      // Tanpa policy: semua peran selain pemilik tabel (koneksi server ini) ditolak
      await tx`ALTER TABLE dapur.store ENABLE ROW LEVEL SECURITY`;
      await tx`ALTER TABLE dapur.backup ENABLE ROW LEVEL SECURITY`;
    });
  })().catch((error) => {
    holder.__lokaDapurTables = undefined;
    throw error;
  });
  return holder.__lokaDapurTables;
}

/** Dokumen dari versi lama mungkin belum punya semua bagian. */
function normalize(data: unknown): Db {
  return { ...emptyDb(), ...(data as Partial<Db> | null) };
}

export async function readPostgresDb(): Promise<Db> {
  const sql = connect();
  await ensureTables(sql);
  const rows = await sql`SELECT data FROM dapur.store WHERE id = ${STORE_ID}`;
  return normalize(rows[0]?.data);
}

/**
 * Baca → ubah → simpan dalam satu transaksi dengan baris terkunci (FOR UPDATE):
 * dua perangkat yang menyimpan bersamaan diproses bergantian, tidak saling menimpa.
 * Kalau `change` melempar error, transaksi dibatalkan dan tidak ada yang tersimpan.
 */
export async function updatePostgresDb<T>(change: (db: Db) => T): Promise<T> {
  const sql = connect();
  await ensureTables(sql);
  const today = todayISO();

  const result = await sql.begin(async (tx) => {
    await tx`INSERT INTO dapur.store (id, data) VALUES (${STORE_ID}, ${tx.json(emptyDb())}) ON CONFLICT (id) DO NOTHING`;
    const [row] = await tx`SELECT data FROM dapur.store WHERE id = ${STORE_ID} FOR UPDATE`;

    // Salinan harian diambil SEBELUM diubah: keadaan sebelum perubahan pertama hari ini
    await tx`
      INSERT INTO dapur.backup (day, data)
      SELECT ${today}::date, data FROM dapur.store WHERE id = ${STORE_ID}
      ON CONFLICT (day) DO NOTHING`;
    await tx`DELETE FROM dapur.backup WHERE day < ${today}::date - ${BACKUP_DAYS}::int`;

    const db = normalize(row.data);
    const value = change(db);
    await tx`UPDATE dapur.store SET data = ${tx.json(db)}, updated_at = now() WHERE id = ${STORE_ID}`;
    return value;
  });
  return result as T;
}

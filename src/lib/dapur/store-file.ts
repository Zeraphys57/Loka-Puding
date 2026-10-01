import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { todayISO } from "@/lib/dapur/dates";
import { DapurError } from "@/lib/dapur/errors";
import { emptyDb, type Db } from "@/lib/dapur/types";

/*
 * Penyimpanan di file, untuk mencoba Dapur di komputer sendiri (`npm run dev`) tanpa database:
 * semua catatan ada di catatan-toko/data.json di folder proyek.
 * - Tidak ikut ke GitHub (lihat .gitignore).
 * - Sebelum perubahan pertama setiap hari, file kemarin disalin ke catatan-toko/cadangan/.
 * Tidak bisa dipakai di hosting seperti Vercel (file di sana tidak tersimpan): di sana pakai store-postgres.ts.
 */

export const DATA_FOLDER_NAME = "catatan-toko";

const DATA_DIR = path.join(process.cwd(), DATA_FOLDER_NAME);
const DATA_FILE = path.join(DATA_DIR, "data.json");
const BACKUP_DIR = path.join(DATA_DIR, "cadangan");
const BACKUPS_KEPT = 30;

function errorCode(error: unknown): string | undefined {
  return (error as NodeJS.ErrnoException | null)?.code;
}

export async function readFileDb(): Promise<Db> {
  let raw: string;
  try {
    raw = await fs.readFile(DATA_FILE, "utf8");
  } catch (error) {
    // Belum pernah mencatat apa pun
    if (errorCode(error) === "ENOENT") return emptyDb();
    throw error;
  }

  try {
    // File dari versi lama mungkin belum punya semua bagian
    return { ...emptyDb(), ...(JSON.parse(raw) as Partial<Db>) };
  } catch {
    // Jangan pernah menimpa file yang rusak dengan data kosong: biarkan pemilik memulihkannya dari cadangan
    throw new DapurError(
      `File ${DATA_FOLDER_NAME}/data.json rusak dan tidak bisa dibaca. Pulihkan dari folder ${DATA_FOLDER_NAME}/cadangan.`,
    );
  }
}

/** Salinan harian sebelum perubahan pertama hari itu; hanya 30 salinan terakhir yang disimpan. */
async function backupOncePerDay(): Promise<void> {
  const target = path.join(BACKUP_DIR, `data-${todayISO()}.json`);
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    await fs.copyFile(DATA_FILE, target, fs.constants.COPYFILE_EXCL);
  } catch (error) {
    // EEXIST: cadangan hari ini sudah ada. ENOENT: belum ada data untuk dicadangkan.
    if (errorCode(error) === "EEXIST" || errorCode(error) === "ENOENT") return;
    throw error;
  }

  const backups = (await fs.readdir(BACKUP_DIR)).filter((name) => /^data-\d{4}-\d{2}-\d{2}\.json$/.test(name)).sort();
  const expired = backups.slice(0, Math.max(0, backups.length - BACKUPS_KEPT));
  await Promise.all(expired.map((name) => fs.rm(path.join(BACKUP_DIR, name), { force: true })));
}

/** Tulis ke file sementara lalu ganti nama: file data tidak pernah setengah tertulis. */
async function writeFileDb(db: Db): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await backupOncePerDay();
  const temporary = `${DATA_FILE}.${process.pid}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(db, null, 2)}\n`, "utf8");
  await fs.rename(temporary, DATA_FILE);
}

// Antrean perubahan: dua simpan yang hampir bersamaan dijalankan bergantian, bukan saling menimpa.
// Disimpan di globalThis supaya tetap satu antrean walau modul dimuat ulang saat development.
const queueHolder = globalThis as typeof globalThis & { __lokaDapurQueue?: Promise<unknown> };

export async function updateFileDb<T>(change: (db: Db) => T): Promise<T> {
  const run = (queueHolder.__lokaDapurQueue ?? Promise.resolve()).then(async () => {
    const db = await readFileDb();
    const result = change(db);
    await writeFileDb(db);
    return result;
  });
  // Antrean tetap jalan walau satu perubahan gagal
  queueHolder.__lokaDapurQueue = run.catch(() => undefined);
  return run;
}

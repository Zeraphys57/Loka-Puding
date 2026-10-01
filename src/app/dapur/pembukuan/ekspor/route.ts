import type { NextRequest } from "next/server";
import { canOpenDapur } from "@/lib/dapur/access";
import { viewLedger } from "@/lib/dapur/calc";
import { isMonth, monthOf, todayISO } from "@/lib/dapur/dates";
import { getDb } from "@/lib/dapur/store";

/** Sel CSV: selalu dikutip, tanda kutip di dalamnya digandakan. */
function cell(value: string | number): string {
  const text = String(value);
  // Teks yang diawali = + - @ bisa dibaca Excel sebagai rumus: beri apostrof agar tetap teks
  const safe = typeof value === "string" && /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

/**
 * Unduhan pembukuan satu bulan sebagai CSV untuk Excel / Google Sheets:
 * /dapur/pembukuan/ekspor?bulan=2026-10
 */
export async function GET(request: NextRequest) {
  if (!(await canOpenDapur())) return new Response("Not found", { status: 404 });

  const requested = request.nextUrl.searchParams.get("bulan") ?? "";
  const month = isMonth(requested) ? requested : monthOf(todayISO());
  const db = await getDb();
  const rows = viewLedger(
    db.transactions.filter((transaction) => monthOf(transaction.date) === month),
    db.orders,
  ).reverse();

  const lines = [
    ["Tanggal", "Jenis", "Keterangan", "Kategori & catatan", "Masuk", "Keluar"].map(cell),
    ...rows.map((row) =>
      [
        row.date,
        row.kind === "in" ? "Masuk" : "Keluar",
        row.title,
        row.subtitle,
        row.kind === "in" ? row.amount : "",
        row.kind === "out" ? row.amount : "",
      ].map(cell),
    ),
  ];

  // Titik koma: pemisah kolom Excel berbahasa Indonesia. BOM: supaya huruf non-ASCII terbaca benar.
  const csv = `﻿${lines.map((line) => line.join(";")).join("\r\n")}\r\n`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pembukuan-loka-${month}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

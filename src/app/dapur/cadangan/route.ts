import { canOpenDapur } from "@/lib/dapur/access";
import { todayISO } from "@/lib/dapur/dates";
import { getDb } from "@/lib/dapur/store";

/**
 * Unduhan seluruh catatan Dapur sebagai satu file JSON (pre-order, pembukuan, bahan),
 * untuk disimpan sendiri sebagai cadangan.
 */
export async function GET() {
  if (!(await canOpenDapur())) return new Response("Not found", { status: 404 });
  const db = await getDb();

  return new Response(`${JSON.stringify(db, null, 2)}\n`, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="cadangan-dapur-loka-${todayISO()}.json"`,
      "Cache-Control": "no-store",
    },
  });
}

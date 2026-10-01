import type { Metadata } from "next";
import { IngredientBoard } from "@/components/dapur/IngredientBoard";
import { PageHeader } from "@/components/dapur/ui";
import { viewIngredients, viewMovements } from "@/lib/dapur/calc";
import { todayISO } from "@/lib/dapur/dates";
import { getDb } from "@/lib/dapur/store";

export const metadata: Metadata = { title: "Bahan" };

// Riwayat yang ditampilkan; catatan yang lebih lama tetap tersimpan dan tetap dihitung ke stok
const HISTORY_SHOWN = 50;

export default async function IngredientsPage() {
  const db = await getDb();

  return (
    <div className="grid gap-8">
      <PageHeader title="Bahan" lead="Stok bahan baku, topping, dan kemasan. Catat belanja dan pemakaian, Dapur yang menghitung sisanya." />
      <IngredientBoard
        ingredients={viewIngredients(db.ingredients, db.stockMovements)}
        movements={viewMovements(db.ingredients, db.stockMovements).slice(0, HISTORY_SHOWN)}
        today={todayISO()}
      />
    </div>
  );
}

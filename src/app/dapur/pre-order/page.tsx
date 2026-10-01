import type { Metadata } from "next";
import { OrderBoard } from "@/components/dapur/OrderBoard";
import { PageHeader } from "@/components/dapur/ui";
import { viewOrders } from "@/lib/dapur/calc";
import { todayISO } from "@/lib/dapur/dates";
import { getMenuOptions } from "@/lib/dapur/menu";
import { getDb } from "@/lib/dapur/store";

export const metadata: Metadata = { title: "Pre-order" };

export default async function PreOrderPage() {
  const db = await getDb();

  return (
    <div className="grid gap-8">
      <PageHeader title="Pre-order" lead="Semua pesanan dari masuk sampai diambil: apa yang harus dibuat, untuk kapan, dan siapa yang belum lunas." />
      <OrderBoard orders={viewOrders(db.orders, db.transactions)} menu={getMenuOptions()} today={todayISO()} />
    </div>
  );
}

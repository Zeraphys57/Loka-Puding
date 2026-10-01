import { menuItems } from "@/data/menu";
import type { MenuOption } from "@/lib/dapur/types";

/** Menu untuk form pre-order & penjualan: nama dan harga terkini dari katalog (src/data/menu.ts). */
export function getMenuOptions(): MenuOption[] {
  return menuItems.map(({ id, name, price }) => ({ id, name, price }));
}

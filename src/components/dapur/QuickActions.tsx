"use client";

import { useState } from "react";
import { OrderDialog } from "@/components/dapur/OrderDialog";
import { TransactionDialog, type TransactionMode } from "@/components/dapur/TransactionDialog";
import { Button } from "@/components/ui/Button";
import { MinusIcon, PlusIcon } from "@/components/ui/Icons";
import type { MenuOption } from "@/lib/dapur/types";

type Props = { menu: MenuOption[]; today: string };

/** Tombol "Catat penjualan" & "Catat pengeluaran" beserta form-nya (halaman Pembukuan & Ringkasan). */
export function TransactionButtons({ menu, today }: Props) {
  const [mode, setMode] = useState<TransactionMode | null>(null);
  return (
    <>
      <Button size="sm" onClick={() => setMode("sale")}>
        <PlusIcon />
        Catat penjualan
      </Button>
      <Button size="sm" variant="soft" onClick={() => setMode("out")}>
        <MinusIcon />
        Catat pengeluaran
      </Button>
      <TransactionDialog open={mode !== null} onClose={() => setMode(null)} menu={menu} today={today} mode={mode ?? "sale"} />
    </>
  );
}

/** Tombol "Pre-order baru" beserta form-nya (halaman Ringkasan). */
export function NewOrderButton({ menu, today }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" variant="dark" onClick={() => setOpen(true)}>
        <PlusIcon />
        Pre-order baru
      </Button>
      <OrderDialog open={open} onClose={() => setOpen(false)} menu={menu} today={today} />
    </>
  );
}

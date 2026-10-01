"use client";

import { useState, useTransition } from "react";
import { Dialog } from "@/components/dapur/Dialog";
import { Button } from "@/components/ui/Button";
import { lockDevice } from "@/lib/dapur/actions";

/**
 * "Kunci perangkat ini": melupakan perangkat ini, mis. setelah membuka Dapur di HP orang lain.
 * Pakai konfirmasi, karena setelah dikunci Dapur baru bisa dibuka lagi lewat link rahasia.
 */
export function LockDeviceButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        Kunci perangkat ini
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Kunci perangkat ini?" size="sm">
        <p className="text-[0.95rem] leading-relaxed text-ink-muted">
          Dapur tidak bisa dibuka lagi di perangkat ini sampai link rahasianya dibuka ulang. Pakai ini setelah meminjam
          HP atau laptop orang lain. Catatan toko tidak terhapus.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={pending} data-autofocus>
            Batal
          </Button>
          <Button variant="dark" size="sm" disabled={pending} onClick={() => startTransition(() => lockDevice())}>
            {pending ? "Mengunci…" : "Kunci perangkat"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}

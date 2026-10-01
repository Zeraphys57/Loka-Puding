"use client";

import { useState, useTransition } from "react";
import type { ActionResult } from "@/lib/dapur/types";

/** Menjalankan server action dari form: status menunggu, pesan error, dan aksi setelah sukses. */
export function useSave(onSaved?: () => void) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save(action: () => Promise<ActionResult>) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await action();
        if (result.ok) onSaved?.();
        else setError(result.error);
      } catch {
        setError("Tidak bisa menyimpan. Pastikan `npm run dev` masih berjalan, lalu coba lagi.");
      }
    });
  }

  return { pending, error, save, setError };
}

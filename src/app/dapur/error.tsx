"use client";

import { useEffect } from "react";
import { EmptyState } from "@/components/dapur/ui";
import { Button } from "@/components/ui/Button";

/** Tampil kalau catatan gagal dibaca (mis. database sedang tidak bisa dihubungi). Navigasi Dapur tetap ada. */
export default function DapurError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EmptyState title="Catatan belum bisa dibuka" action={<Button onClick={() => retry()}>Coba lagi</Button>}>
      Dapur tidak berhasil membaca catatan toko. Biasanya karena koneksi internet atau database sedang lambat. Catatan
      yang sudah tersimpan tidak hilang.
    </EmptyState>
  );
}

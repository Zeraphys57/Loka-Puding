"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { useSave } from "@/components/dapur/useSave";
import { Button } from "@/components/ui/Button";
import { CloseIcon } from "@/components/ui/Icons";
import { cn } from "@/lib/cn";
import type { ActionResult } from "@/lib/dapur/types";
import { lockScroll, unlockScroll } from "@/lib/scroll";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  size?: "sm" | "md" | "lg";
  children: ReactNode;
};

const sizes = { sm: "sm:max-w-md", md: "sm:max-w-xl", lg: "sm:max-w-3xl" };

/**
 * Jendela form Dapur, memakai <dialog> bawaan browser (showModal): latar otomatis `inert`,
 * fokus terkurung di dalam, dan Esc menutup. Isi hanya dirender saat terbuka, jadi form
 * selalu mulai dari keadaan awal setiap kali dibuka.
 *
 * Klik di luar jendela sengaja TIDAK menutup: isian form yang panjang tidak hilang karena salah klik.
 */
export function Dialog({ open, onClose, title, description, size = "md", children }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;

    dialog.showModal();
    lockScroll();
    // Isian yang ditandai langsung siap diketik. Tanpa tanda: fokus di jendelanya, bukan di tombol Tutup,
    // supaya Enter/Spasi pertama tidak langsung menutup form.
    (dialog.querySelector<HTMLElement>("[data-autofocus]") ?? panelRef.current)?.focus();

    return () => {
      dialog.close();
      unlockScroll();
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-transparent p-0 backdrop:bg-espresso/45 backdrop:backdrop-blur-[2px]"
    >
      {open ? (
        <div className="flex h-full items-end justify-center sm:items-center sm:p-6">
          <div
            ref={panelRef}
            tabIndex={-1}
            className={cn(
              "relative flex max-h-[94dvh] w-full animate-rise flex-col overflow-hidden rounded-t-[1.75rem] bg-milk-50 text-espresso shadow-pop outline-none sm:rounded-[1.75rem]",
              sizes[size],
            )}
          >
            <header className="flex items-start gap-4 border-b border-sand/70 px-5 pt-5 pb-4 sm:px-7">
              <div className="min-w-0 flex-1">
                <h2 id={titleId} className="text-2xl leading-tight font-bold tracking-[-0.01em]">
                  {title}
                </h2>
                {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup"
                className="-mt-1 -mr-1 grid size-10 shrink-0 place-items-center rounded-full text-ink-muted transition-colors hover:bg-caramel-50 hover:text-espresso"
              >
                <CloseIcon className="size-5" />
              </button>
            </header>
            <div className="overflow-y-auto overscroll-contain px-5 py-5 sm:px-7">{children}</div>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  /** Server action yang dijalankan saat dikonfirmasi; jendela menutup kalau berhasil */
  action: () => Promise<ActionResult>;
  title: string;
  /** Penjelasan apa saja yang ikut terhapus */
  children: ReactNode;
  confirmLabel: string;
};

/** Konfirmasi sebelum menghapus. Kalau server menolak, alasannya tampil di sini. */
export function ConfirmDialog({ open, onClose, title, ...body }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={title} size="sm">
      <ConfirmBody onClose={onClose} {...body} />
    </Dialog>
  );
}

function ConfirmBody({ onClose, action, children, confirmLabel }: Omit<ConfirmDialogProps, "open" | "title">) {
  const { pending, error, save } = useSave(onClose);
  return (
    <>
      <div className="text-[0.95rem] leading-relaxed text-ink-muted">{children}</div>
      {error ? (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-800">
          {error}
        </p>
      ) : null}
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" size="sm" onClick={onClose} disabled={pending} data-autofocus>
          Batal
        </Button>
        {/* Bukan <Button>: warna merahnya akan bertabrakan dengan warna varian tombol */}
        <button
          type="button"
          onClick={() => save(action)}
          disabled={pending}
          className="inline-flex h-10 items-center justify-center rounded-full bg-red-700 px-4 text-sm font-bold whitespace-nowrap text-white transition-colors hover:bg-red-800 disabled:pointer-events-none disabled:opacity-50"
        >
          {pending ? "Menghapus…" : confirmLabel}
        </button>
      </div>
    </>
  );
}

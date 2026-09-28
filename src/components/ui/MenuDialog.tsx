"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, type KeyboardEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyImage } from "@/components/ui/EmptyImage";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { CloseIcon, WhatsAppIcon } from "@/components/ui/Icons";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { EASE, gsap } from "@/lib/gsap";
import type { MenuItemView } from "@/lib/menu";
import { lockScroll, unlockScroll } from "@/lib/scroll";
import { whatsappItemLink, whatsappOrderLink } from "@/lib/whatsapp";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

type MenuDialogProps = {
  /** Menu yang sedang dibuka; `null` = tertutup */
  item: MenuItemView | null;
  /** Dipanggil setelah dialog benar-benar tertutup */
  onClosed: () => void;
};

/**
 * Detail menu memakai <dialog> bawaan browser (showModal): latar otomatis `inert`,
 * Esc memicu event `cancel`. Ditambah: animasi buka/tutup, kunci scroll, dan
 * fokus berputar di dalam dialog (Tab / Shift+Tab).
 */
export function MenuDialog({ item, onClosed }: MenuDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !item || dialog.open) return;

    closingRef.current = false;
    dialog.showModal();
    lockScroll();
    panelRef.current?.scrollTo({ top: 0 });

    if (reducedMotion) {
      gsap.set([backdropRef.current, panelRef.current], { clearProps: "all" });
      return;
    }
    gsap.fromTo(backdropRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: "power1.out" });
    gsap.fromTo(
      panelRef.current,
      { autoAlpha: 0, y: 56, scale: 0.94 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: EASE.pop },
    );
  }, [item, reducedMotion]);

  const requestClose = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog?.open || closingRef.current) return;
    closingRef.current = true;

    if (reducedMotion) {
      dialog.close();
      return;
    }
    gsap.to(panelRef.current, { autoAlpha: 0, y: 32, scale: 0.97, duration: 0.24, ease: "power2.in" });
    gsap.to(backdropRef.current, {
      autoAlpha: 0,
      duration: 0.26,
      ease: "power1.in",
      onComplete: () => dialog.close(),
    });
  }, [reducedMotion]);

  function handleClosed() {
    closingRef.current = false;
    unlockScroll();
    onClosed();
  }

  // Fokus berputar: Tab di elemen terakhir → kembali ke yang pertama (dan sebaliknya)
  function trapFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab" || !dialogRef.current) return;
    const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="menu-dialog-title"
      aria-describedby="menu-dialog-description"
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onClose={handleClosed}
      onKeyDown={trapFocus}
      className="m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-transparent p-0 backdrop:bg-transparent"
    >
      <div
        ref={backdropRef}
        aria-hidden="true"
        onClick={requestClose}
        className="fixed inset-0 bg-espresso/50 backdrop-blur-[3px]"
      />

      <div className="pointer-events-none fixed inset-0 flex items-end justify-center sm:items-center sm:p-6">
        <div
          ref={panelRef}
          data-lenis-prevent
          className="pointer-events-auto relative max-h-[92dvh] w-full overflow-y-auto overscroll-contain rounded-t-[2.25rem] bg-milk-50 shadow-pop sm:max-w-3xl sm:rounded-[2.25rem]"
        >
          <button
            type="button"
            onClick={requestClose}
            aria-label="Tutup detail menu"
            className="absolute top-3 right-3 z-10 grid size-11 place-items-center rounded-full bg-milk-50/90 text-espresso shadow-soft ring-1 ring-sand backdrop-blur transition-[scale] duration-500 ease-jelly hover:scale-110 active:scale-95"
          >
            <CloseIcon className="size-5" />
          </button>

          {item ? (
            <div className="grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
              <div className="relative aspect-[4/3] bg-custard sm:aspect-auto sm:min-h-[26rem]">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.imageAlt}
                    fill
                    sizes="(min-width: 640px) 360px, 100vw"
                    className={item.available ? "object-cover" : "object-cover opacity-85 grayscale-[0.6]"}
                  />
                ) : (
                  <EmptyImage name={item.name} />
                )}
                {item.badge ? (
                  <Badge
                    tone={item.badge === "Best Seller" ? "accent" : "primary"}
                    className="absolute top-4 left-4"
                  >
                    {item.badge}
                  </Badge>
                ) : null}
              </div>

              <div className="flex flex-col gap-4 p-6 sm:p-8">
                <Eyebrow>{item.categoryLabel}</Eyebrow>
                <h2 id="menu-dialog-title" className="pr-10 text-3xl leading-[1.05] font-bold tracking-[-0.02em] text-espresso sm:text-4xl">
                  {item.name}
                </h2>
                <p id="menu-dialog-description" className="leading-relaxed text-ink-muted">
                  {item.description}
                </p>
                <p className="font-display text-3xl font-black tracking-tight text-caramel-700">{item.priceLabel}</p>

                <div className="mt-auto flex flex-col gap-3 pt-2">
                  {item.available ? (
                    <ButtonLink href={whatsappItemLink(item)} external variant="primary" size="lg">
                      <WhatsAppIcon />
                      Pesan Menu Ini
                    </ButtonLink>
                  ) : (
                    <>
                      <Button variant="soft" size="lg" disabled>
                        Sedang habis
                      </Button>
                      <p className="text-center text-sm text-ink-muted">
                        Tanya jadwal restock lewat{" "}
                        <a
                          href={whatsappOrderLink()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-caramel-700 underline decoration-caramel-300 decoration-2 underline-offset-4"
                        >
                          WhatsApp
                        </a>
                        , ya!
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </dialog>
  );
}

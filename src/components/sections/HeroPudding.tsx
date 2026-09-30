"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { PuddingStage, type Nudge } from "@/components/three/PuddingStage";
import type { HeroVariantItem, PuddingVariant } from "@/components/three/variants";
import { ButtonLink } from "@/components/ui/Button";
import { HandNote } from "@/components/ui/HandNote";
import { ArrowRightIcon, WhatsAppIcon } from "@/components/ui/Icons";
import { PriceSticker } from "@/components/ui/PriceSticker";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/cn";
import { whatsappOrderLink } from "@/lib/whatsapp";
import { onVariantSelect, selectVariant, stepVariant, useSelectedVariant, type Direction } from "@/lib/heroVariant";

/*
 * Hero bisa digeser kiri-kanan untuk melihat tiap menu (Klasik, Regal, Popcorn).
 * - Puding digeser dengan jari/mouse, atau lewat tombol ‹ Klasik · Regal · Popcorn ›.
 * - Puding lama meluncur keluar, yang baru meluncur masuk lalu bergoyang seperti piring yang didorong.
 * - Stiker harga & tombol Pesan ikut varian yang tampil.
 * Pilihan disimpan di lib/heroVariant.ts supaya komponen-komponen yang letaknya berjauhan tetap sepakat.
 */

// Jarak geser (px) atau kecepatan rata-rata (px/ms) minimum agar dianggap berganti varian
const SWIPE_DISTANCE = 60;
const SWIPE_SPEED = 0.45;

let slideEase: string | null = null;

/** Easing kenyal milik brand (--ease-jelly); browser lama yang belum mendukung `linear()` memakai back-out. */
function slideInEase(): string {
  if (slideEase) return slideEase;
  const jelly = getComputedStyle(document.documentElement).getPropertyValue("--ease-jelly").trim();
  slideEase = jelly && CSS.supports("animation-timing-function", jelly) ? jelly : "cubic-bezier(0.34, 1.56, 0.64, 1)";
  return slideEase;
}

const offstage = (side: number) => `translateX(${side * 75}%) rotate(${side * 8}deg)`;

type DragState = { id: number; x: number; y: number; t: number; dx: number; active: boolean };

export function HeroPudding({ items }: { items: HeroVariantItem[] }) {
  const selected = useSelectedVariant();
  // Varian yang sedang dirender: tertinggal dari pilihan selama puding lama meluncur keluar
  const [shown, setShown] = useState<PuddingVariant | null>(null);
  const [nudge, setNudge] = useState<Nudge>({ id: 0, x: 0 });
  const slideRef = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);
  const reducedMotion = useReducedMotion();

  const displayed = shown ?? selected;
  const item = items.find((entry) => entry.variant === displayed) ?? items[0];
  const swipeable = items.length > 1;

  useEffect(
    () =>
      onVariantSelect((next, direction) => {
        const slide = slideRef.current;
        if (!slide || reducedMotion) {
          setShown(next);
          return;
        }
        // Mulai dari posisi terakhir (bisa sedang diseret), hentikan animasi sebelumnya
        const from = slide.style.transform || "none";
        slide.getAnimations().forEach((animation) => animation.cancel());
        slide.style.transform = "";
        const exit = slide.animate(
          [
            { transform: from, opacity: 1 },
            { transform: offstage(-direction), opacity: 0 },
          ],
          { duration: 260, easing: "cubic-bezier(0.55, 0, 0.8, 0.3)", fill: "forwards" },
        );
        exit.finished.then(
          () => {
            setShown(next);
            setNudge((current) => ({ id: current.id + 1, x: -direction }));
            slide.animate(
              [
                { transform: offstage(direction), opacity: 0 },
                { transform: "none", opacity: 1 },
              ],
              { duration: 760, easing: slideInEase() },
            );
            exit.cancel();
          },
          () => {}, // dibatalkan oleh pilihan berikutnya
        );
      }),
    [reducedMotion],
  );

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!swipeable || (event.pointerType === "mouse" && event.button !== 0)) return;
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, t: event.timeStamp, dx: 0, active: false };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    const slide = slideRef.current;
    if (!state || state.id !== event.pointerId || !slide) return;
    const dx = event.clientX - state.x;
    const dy = event.clientY - state.y;
    if (!state.active) {
      // Gerakan vertikal = scroll halaman, bukan geser varian
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
        drag.current = null;
        return;
      }
      if (Math.abs(dx) < 10) return;
      state.active = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      slide.getAnimations().forEach((animation) => animation.cancel());
    }
    state.dx = dx;
    // Ikut jari dengan sedikit hambatan & miring, seperti menggeser piring di meja
    slide.style.transform = `translateX(${dx * 0.55}px) rotate(${dx * 0.012}deg)`;
  };

  const release = (event: PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const state = drag.current;
    drag.current = null;
    const slide = slideRef.current;
    if (!state?.active || !slide) return;
    const speed = state.dx / Math.max(event.timeStamp - state.t, 1);
    if (!cancelled && (Math.abs(state.dx) > SWIPE_DISTANCE || Math.abs(speed) > SWIPE_SPEED)) {
      stepVariant(state.dx < 0 ? 1 : -1);
      return;
    }
    // Kurang jauh: kembali ke tengah sambil memantul
    const from = slide.style.transform;
    slide.style.transform = "";
    if (!reducedMotion) slide.animate([{ transform: from }, { transform: "none" }], { duration: 600, easing: slideInEase() });
  };

  return (
    <>
      <div
        ref={slideRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(event) => release(event, false)}
        onPointerCancel={(event) => release(event, true)}
        className={cn("relative", swipeable && "touch-pan-y select-none")}
      >
        <PuddingStage
          variant={displayed}
          label={item ? `${item.alt}. ${item.name}, ${item.priceLabel}.` : ""}
          nudge={nudge}
        />
      </div>

      {swipeable && item ? (
        <>
          <PriceSticker
            key={`price-${displayed}`}
            label={item.priceLabel}
            className="pointer-events-none absolute right-[-2%] bottom-[24%] origin-bottom-right rotate-[9deg] scale-[0.62] animate-pop-in sm:scale-75 lg:top-[6%] lg:right-[2%] lg:bottom-auto lg:origin-top-right lg:scale-90"
          />
          {/* Catatan tangan dari data menu ("ada kriuknya!"), hanya di desktop: di HP bertabrakan dengan judul */}
          {item.note ? (
            <div className="pointer-events-none absolute top-[7%] left-[2%] hidden lg:block">
              <HandNote key={`note-${displayed}`} arrow="down-right" className="-rotate-6 animate-pop-in text-[1.65rem]">
                {item.note}
              </HandNote>
            </div>
          ) : null}
          {/* Diumumkan ke pembaca layar hanya setelah pengunjung berganti varian */}
          <p className="sr-only" aria-live="polite">
            {shown ? `${item.name}, ${item.priceLabel}` : ""}
          </p>
        </>
      ) : null}
    </>
  );
}

/** Tombol ‹ Klasik · Regal · Popcorn ›. Gumpalan karamel meluncur kenyal ke varian yang aktif. */
export function HeroVariantTabs({ items, className }: { items: HeroVariantItem[]; className?: string }) {
  const selected = useSelectedVariant();
  if (items.length < 2) return null;
  const index = Math.max(
    0,
    items.findIndex((item) => item.variant === selected),
  );

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step: Direction | 0 = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    stepVariant(step);
  };

  const arrow =
    "grid size-9 shrink-0 place-items-center rounded-full bg-milk-50/85 text-espresso shadow-soft ring-1 ring-espresso/10 backdrop-blur-md transition-[translate,background-color] duration-500 ease-jelly hover:bg-milk-50 active:scale-90 [&_svg]:size-4";

  return (
    <div role="group" aria-label="Pilih varian puding" onKeyDown={onKeyDown} className={cn("items-center gap-1.5", className)}>
      {/* Panah: hanya di layar lebar (di HP cukup geser pudingnya atau ketuk labelnya) */}
      <button type="button" aria-label="Varian sebelumnya" onClick={() => stepVariant(-1)} className={cn(arrow, "hidden hover:-translate-x-0.5 sm:grid")}>
        <ArrowRightIcon className="-scale-x-100" />
      </button>
      <div
        className="relative grid w-max rounded-full bg-milk-50/85 p-1 shadow-soft ring-1 ring-espresso/10 backdrop-blur-md"
        style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}
      >
        <span
          aria-hidden="true"
          className="absolute inset-y-1 left-1 rounded-full bg-caramel-600 shadow-soft transition-transform duration-700 ease-jelly motion-reduce:transition-none"
          style={{ width: `calc((100% - 0.5rem) / ${items.length})`, transform: `translateX(${index * 100}%)` }}
        />
        {items.map((item) => {
          const active = item.variant === selected;
          return (
            <button
              key={item.variant}
              type="button"
              aria-pressed={active}
              aria-label={`${item.short}: ${item.name}, ${item.priceLabel}`}
              onClick={() => selectVariant(item.variant)}
              className={cn(
                "relative z-10 h-9 rounded-full px-3 text-[0.68rem] font-bold tracking-[0.14em] whitespace-nowrap uppercase transition-colors duration-300 sm:px-4 sm:text-[0.72rem]",
                active ? "text-white" : "text-espresso hover:text-caramel-700",
              )}
            >
              {item.short}
            </button>
          );
        })}
      </div>
      <button type="button" aria-label="Varian berikutnya" onClick={() => stepVariant(1)} className={cn(arrow, "hidden hover:translate-x-0.5 sm:grid")}>
        <ArrowRightIcon />
      </button>
    </div>
  );
}

/** Tombol "Pesan via WhatsApp" di hero: pesannya sudah berisi menu yang sedang tampil. */
export function HeroOrderButton({ items, className }: { items: HeroVariantItem[]; className?: string }) {
  const selected = useSelectedVariant();
  const item = items.find((entry) => entry.variant === selected) ?? items[0];
  return (
    <ButtonLink
      href={item?.orderHref ?? whatsappOrderLink()}
      external
      variant="outline"
      size="lg"
      aria-label={item ? `Pesan via WhatsApp: ${item.name}` : undefined}
      className={className}
    >
      <WhatsAppIcon />
      <span className="sm:hidden">Pesan</span>
      <span className="hidden sm:inline">Pesan via WhatsApp</span>
    </ButtonLink>
  );
}

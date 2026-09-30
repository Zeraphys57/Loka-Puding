"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { PuddingStage, type Nudge } from "@/components/three/PuddingStage";
import type { HeroVariantItem, PuddingVariant } from "@/components/three/variants";
import { ButtonLink } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { PuddingMark } from "@/components/ui/Logo";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/cn";
import { whatsappOrderLink } from "@/lib/whatsapp";
import { onVariantSelect, selectVariant, stepVariant, useSelectedVariant, type Direction } from "@/lib/heroVariant";
import { HERO_NOTES, HeroNotes, POKE_NOTE } from "./HeroNotes";

/*
 * Hero bisa digeser kiri-kanan untuk melihat tiap menu (Klasik, Regal, Popcorn).
 * - Puding digeser dengan jari/mouse, atau dipilih lewat tiga puding mini di bawahnya.
 * - Puding lama meluncur keluar, yang baru meluncur masuk lalu bergoyang seperti piring yang didorong.
 * - Coretan tangan (HeroNotes) & tombol Pesan ikut varian yang tampil. Harga sengaja tidak ditampilkan di hero.
 * Pilihan disimpan di lib/heroVariant.ts supaya komponen-komponen yang letaknya berjauhan tetap sepakat.
 */

// Catatan yang dimulai saat halaman pertama dibuka menunggu judul & puding muncul dulu (detik)
const NOTES_FIRST_DELAY = 0.9;

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
  const notesRef = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);
  const reducedMotion = useReducedMotion();

  const displayed = shown ?? selected;
  const item = items.find((entry) => entry.variant === displayed) ?? items[0];
  const swipeable = items.length > 1;

  useEffect(
    () =>
      onVariantSelect((next, direction, previous) => {
        const slide = slideRef.current;
        if (!slide || reducedMotion) {
          setShown(next);
          return;
        }
        // Tahan puding yang sedang tampil selama ia meluncur keluar (termasuk saat pertama kali berganti)
        setShown((current) => current ?? previous);
        // Catatan varian lama memudar; yang baru ditulis ulang begitu puding baru masuk
        notesRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" });
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
          label={item ? `${item.alt}. ${item.name}.` : ""}
          nudge={nudge}
        />
      </div>

      {/* Coretan "colek aku!" tetap. Catatan per varian ditulis ulang setiap puding baru selesai masuk
          (nudge.id bertambah), juga kalau setelah digeser cepat bolak-balik variannya ternyata sama. */}
      <HeroNotes callouts={[POKE_NOTE]} delay={NOTES_FIRST_DELAY + 1.2} />
      {item ? (
        <HeroNotes
          key={`${displayed}-${nudge.id}`}
          ref={notesRef}
          callouts={HERO_NOTES[displayed]}
          menuNote={item.note}
          delay={shown ? 0.2 : NOTES_FIRST_DELAY}
        />
      ) : null}

      {swipeable && item ? (
        /* Diumumkan ke pembaca layar hanya setelah pengunjung berganti varian */
        <p className="sr-only" aria-live="polite">
          {shown ? items.find((entry) => entry.variant === selected)?.name : ""}
        </p>
      ) : null}
    </>
  );
}

/** Lingkaran spidol yang tidak menutup rapi, seperti menandai pilihan di kertas menu. */
function MarkerRing() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute -inset-x-1.5 -inset-y-1">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" fill="none" className="size-full overflow-visible" focusable="false">
        <path
          d="M18 22C34 6 74 4 88 24 100 42 96 76 70 90 46 100 14 92 7 66 1 44 10 24 34 12 42 8 52 7 60 8"
          pathLength={1}
          stroke="currentColor"
          strokeWidth={2.6}
          strokeLinecap="round"
          className="animate-draw text-caramel-600 [animation-duration:0.6s] [stroke-dasharray:1] [stroke-dashoffset:1]"
        />
      </svg>
    </span>
  );
}

/**
 * Pilihan varian: tiga puding mini (ikon logo + topping-nya) dengan nama bertulisan tangan.
 * Yang dipilih dilingkari spidol & bergoyang; yang lain agak pudar dan bergoyang saat disorot.
 * Panah kiri/kanan di keyboard juga berganti varian.
 */
export function HeroVariantTabs({ items, className }: { items: HeroVariantItem[]; className?: string }) {
  const selected = useSelectedVariant();
  // useId() bisa berisi karakter yang tidak aman di url(#…) SVG
  const uid = useId().replace(/[^\w-]/g, "");
  if (items.length < 2) return null;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step: Direction | 0 = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const index = Math.max(
      0,
      items.findIndex((item) => item.variant === selected),
    );
    stepVariant(step);
    // Fokus ikut pindah ke puding yang baru dipilih
    event.currentTarget.querySelectorAll("button")[(index + step + items.length) % items.length]?.focus();
  };

  return (
    <div role="group" aria-label="Pilih varian puding" onKeyDown={onKeyDown} className={cn("items-end gap-1 sm:gap-3", className)}>
      {items.map((item) => {
        const active = item.variant === selected;
        return (
          <button
            key={item.variant}
            type="button"
            aria-pressed={active}
            aria-label={`${item.short}: ${item.name}`}
            onClick={() => selectVariant(item.variant)}
            className="group/tab relative flex w-[5.25rem] flex-col items-center rounded-3xl px-1 pt-1 pb-2 outline-none focus-visible:ring-2 focus-visible:ring-caramel-600 sm:w-[5.75rem]"
          >
            <PuddingMark
              id={`${uid}-${item.variant}`}
              topping={item.variant === "klasik" ? undefined : item.variant}
              className={cn(
                "size-14 origin-bottom transition-[scale,opacity] duration-500 ease-jelly motion-reduce:transition-none lg:size-16",
                active
                  ? "scale-110 animate-jelly"
                  : "scale-[0.86] opacity-75 group-hover/tab:scale-100 group-hover/tab:animate-jiggle-tap group-hover/tab:opacity-100",
              )}
            />
            <span
              className={cn(
                "font-hand text-[1.35rem] leading-none transition-colors duration-300",
                active ? "text-espresso" : "text-caramel-700/75 group-hover/tab:text-caramel-700",
              )}
            >
              {item.short}
            </span>
            {active ? <MarkerRing /> : null}
          </button>
        );
      })}
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

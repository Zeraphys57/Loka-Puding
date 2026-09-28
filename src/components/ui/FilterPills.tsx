"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/cn";
import { EASE, gsap, useGSAP } from "@/lib/gsap";

type Option = { id: string; label: string };

type FilterPillsProps = {
  options: Option[];
  active: string;
  onChange: (id: string) => void;
  label: string;
};

function measure(group: HTMLElement | null, id: string) {
  const button = group?.querySelector<HTMLElement>(`[data-filter="${id}"]`);
  return button
    ? { x: button.offsetLeft, y: button.offsetTop, width: button.offsetWidth, height: button.offsetHeight }
    : null;
}

/**
 * Tombol filter kategori. "Gumpalan" biru (indikator) meluncur kenyal ke tombol aktif.
 * Indikator berada di antara latar tombol dan teksnya (lihat z-index).
 */
export function FilterPills({ options, active, onChange, label }: FilterPillsProps) {
  const groupRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const activeRef = useRef(active);
  const hasPositioned = useRef(false);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      activeRef.current = active;
      const indicator = indicatorRef.current;
      const target = measure(groupRef.current, active);
      if (!indicator || !target) return;

      if (!hasPositioned.current || reducedMotion) {
        gsap.set(indicator, { ...target, autoAlpha: 1 });
        hasPositioned.current = true;
      } else {
        gsap.to(indicator, { ...target, autoAlpha: 1, duration: 0.75, ease: EASE.jelly, overwrite: true });
      }
      // Context di-revert saat unmount (termasuk mount ganda StrictMode) → posisikan ulang tanpa animasi
      return () => {
        hasPositioned.current = false;
      };
    },
    { dependencies: [active, reducedMotion], scope: groupRef },
  );

  // Ukuran tombol berubah saat font selesai dimuat atau layar diputar → posisikan ulang
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    const observer = new ResizeObserver(() => {
      const target = measure(group, activeRef.current);
      if (target && indicatorRef.current) gsap.set(indicatorRef.current, target);
    });
    observer.observe(group);
    group.querySelectorAll("[data-filter]").forEach((button) => observer.observe(button));
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={groupRef}
      role="group"
      aria-label={label}
      className="relative isolate flex flex-wrap justify-center gap-2"
    >
      <span
        ref={indicatorRef}
        aria-hidden="true"
        className="invisible absolute top-0 left-0 z-[1] rounded-full bg-[#c27a29] shadow-soft"
      />
      {options.map((option) => {
        const isActive = option.id === active;
        return (
          <button
            key={option.id}
            type="button"
            data-filter={option.id}
            aria-pressed={isActive}
            onClick={() => onChange(option.id)}
            className={cn(
              "h-11 rounded-full bg-white px-6 text-sm font-bold tracking-widest uppercase border border-[#c27a29]/20 transition-all duration-300 sm:text-xs",
              isActive ? "text-white border-transparent" : "text-ink-muted hover:text-[#c27a29] hover:bg-[#ffebd6]/20 hover:border-[#c27a29]/40",
            )}
          >
            <span className="relative z-[2]">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

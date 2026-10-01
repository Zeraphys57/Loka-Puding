"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import Lenis from "lenis";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { scrollToTarget, setLenis } from "@/lib/scroll";

/**
 * Smooth scroll global (Lenis) yang digerakkan ticker GSAP, sehingga
 * ScrollTrigger dan Lenis selalu membaca posisi scroll yang sama.
 * Tidak merender apa pun.
 */
export function SmoothScroll() {
  const reducedMotion = useReducedMotion();
  // Dapur (catatan toko) berisi form & daftar panjang: di sana pakai scroll bawaan browser
  const isDapur = usePathname().startsWith("/dapur");

  useEffect(() => {
    // Gerakan minimal → scroll bawaan browser saja
    if (reducedMotion || isDapur) return;

    const lenis = new Lenis({ autoRaf: false, lerp: 0.1, smoothWheel: true });
    const onTick = (time: number) => lenis.raf(time * 1000);

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);
    setLenis(lenis);

    return () => {
      gsap.ticker.remove(onTick);
      lenis.destroy();
      setLenis(null);
    };
  }, [reducedMotion, isDapur]);

  // Semua link "#..." : scroll halus dengan offset navbar, lalu pindahkan fokus
  // ke section tujuan supaya pengguna keyboard melanjutkan dari sana.
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const link = (event.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href^="#"]');
      const id = link ? decodeURIComponent(link.hash.slice(1)) : "";
      const target = id ? document.getElementById(id) : null;
      if (!target) return;

      event.preventDefault();
      scrollToTarget(target);
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}

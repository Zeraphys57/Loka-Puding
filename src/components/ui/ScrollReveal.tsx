"use client";

import { EASE, gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

/**
 * Animasi muncul saat di-scroll untuk semua elemen ber-atribut `data-reveal`,
 * supaya section tetap Server Component (cukup tambahkan atributnya).
 *   data-reveal        → naik perlahan (power3.out)
 *   data-reveal="pop"  → muncul sedikit memantul (back.out)
 * Tidak aktif jika pengguna memilih gerakan minimal.
 */
export function ScrollReveal() {
  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const rises = gsap.utils.toArray<HTMLElement>('[data-reveal]:not([data-reveal="pop"])');
      const pops = gsap.utils.toArray<HTMLElement>('[data-reveal="pop"]');

      gsap.set(rises, { autoAlpha: 0, y: 32 });
      gsap.set(pops, { autoAlpha: 0, y: 40, scale: 0.92 });

      ScrollTrigger.batch(rises, {
        start: "top 88%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08, ease: EASE.reveal, overwrite: true }),
      });

      ScrollTrigger.batch(pops, {
        start: "top 90%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, { autoAlpha: 1, y: 0, scale: 1, duration: 0.8, stagger: 0.1, ease: EASE.pop, overwrite: true }),
      });
    });
  });

  return null;
}

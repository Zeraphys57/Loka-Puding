import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

// Daftarkan plugin sekali saja, hanya di browser.
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, Flip, useGSAP);
}

/** Token easing: pakai yang sama di seluruh website agar gerakannya konsisten. */
export const EASE = {
  /** Reveal saat scroll */
  reveal: "power3.out",
  /** Momen playful: kartu & pop-up muncul dengan sedikit lewat */
  pop: "back.out(1.7)",
  /** Pantulan kenyal seperti puding */
  jelly: "elastic.out(1, 0.5)",
  /** Transisi netral dua arah */
  inOut: "power2.inOut",
} as const;

export { Flip, gsap, ScrollTrigger, useGSAP };

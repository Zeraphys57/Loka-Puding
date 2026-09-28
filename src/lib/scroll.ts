import type Lenis from "lenis";

/**
 * Satu instance Lenis untuk seluruh halaman. Disimpan di luar React
 * supaya komponen lain (puding 3D, dialog, menu) bisa membacanya tanpa re-render.
 */
let lenisInstance: Lenis | null = null;

export function setLenis(instance: Lenis | null): void {
  lenisInstance = instance;
}

export function getLenis(): Lenis | null {
  return lenisInstance;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Scroll ke elemen atau ke posisi Y tertentu.
 * Offset navbar berasal dari CSS `scroll-margin-top: var(--nav-h)` pada elemen ber-id,
 * yang dihormati baik oleh Lenis maupun `scrollIntoView` bawaan browser.
 */
export function scrollToTarget(target: HTMLElement | number): void {
  if (lenisInstance) {
    // `force`: tetap jalan walau Lenis sedang di-stop (mis. menu mobile baru ditutup)
    lenisInstance.scrollTo(target, { force: true, duration: 1.2 });
    return;
  }

  const behavior = prefersReducedMotion() ? "auto" : "smooth";
  if (typeof target === "number") window.scrollTo({ top: target, behavior });
  else target.scrollIntoView({ behavior, block: "start" });
}

let lockDepth = 0;

/** Kunci scroll halaman (dialog / menu mobile terbuka). Aman dipanggil bertumpuk. */
export function lockScroll(): void {
  lockDepth += 1;
  if (lockDepth > 1) return;
  lenisInstance?.stop();
  document.documentElement.style.overflow = "hidden";
}

export function unlockScroll(): void {
  if (lockDepth === 0) return;
  lockDepth -= 1;
  if (lockDepth > 0) return;
  document.documentElement.style.overflow = "";
  lenisInstance?.start();
}

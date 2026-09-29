"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { ArrowRightIcon, InstagramIcon, TikTokIcon, WhatsAppIcon } from "@/components/ui/Icons";
import { navLinks, siteConfig } from "@/config/site";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/cn";
import { dripMaskUrl } from "@/lib/drip";
import { EASE, gsap, useGSAP } from "@/lib/gsap";
import { lockScroll, unlockScroll } from "@/lib/scroll";
import { whatsappOrderLink } from "@/lib/whatsapp";

type MobileMenuProps = {
  open: boolean;
  activeId: string;
  /** `restoreFocus`: kembalikan fokus ke tombol menu (false saat pindah ke section lewat link) */
  onClose: (options: { restoreFocus: boolean }) => void;
};

export const MOBILE_MENU_ID = "menu-mobile";

// Tepi bawah panel: karamel yang meleleh (senada dengan navbar desktop)
const DRIP_MASK = dripMaskUrl({ width: 360, height: 48, band: 4, seed: 17, count: 5 });

export function MobileMenu({ open, activeId, onClose }: MobileMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const reducedMotion = useReducedMotion();

  // Satu timeline: diputar maju saat buka, mundur saat tutup
  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const panel = root.querySelector("[data-panel]");
      const overlay = root.querySelector("[data-overlay]");
      const items = root.querySelectorAll("[data-menu-item]");

      // Wadah disembunyikan lewat class `invisible`; setelah animasi tutup selesai kembali ke class itu
      timeline.current = gsap
        .timeline({ paused: true, onReverseComplete: () => root.style.removeProperty("visibility") })
        .fromTo(overlay, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: "power1.out" }, 0)
        // y ekstra: tetesan di bawah panel ikut tersembunyi di atas layar
        .fromTo(
          panel,
          { yPercent: -100, y: -56 },
          { yPercent: 0, y: 0, duration: 0.75, ease: "elastic.out(1, 0.8)" },
          0,
        )
        // opacity (bukan autoAlpha) agar link tetap bisa difokus sejak menu dibuka
        .fromTo(
          items,
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.45, stagger: 0.05, ease: EASE.pop },
          0.18,
        );
    },
    { scope: rootRef },
  );

  useEffect(() => {
    const tl = timeline.current;
    const root = rootRef.current;
    if (!tl || !root) return;

    if (!open) {
      if (reducedMotion) {
        tl.progress(0).pause();
        root.style.removeProperty("visibility");
      } else {
        tl.timeScale(1.8).reverse();
      }
      return;
    }

    // Ditulis langsung (bukan gsap.set yang bisa ditunda ke frame berikutnya)
    // agar link di dalamnya sudah bisa difokus saat itu juga.
    root.style.visibility = "visible";
    if (reducedMotion) tl.progress(1).pause();
    else tl.timeScale(1).play();

    lockScroll();
    const background = document.querySelectorAll<HTMLElement>("main, footer");
    background.forEach((element) => (element.inert = true));
    root.querySelector<HTMLElement>("[data-menu-item] a")?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose({ restoreFocus: true });
    };
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onDesktop = () => desktop.matches && onClose({ restoreFocus: false });

    document.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onDesktop);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onDesktop);
      background.forEach((element) => (element.inert = false));
      unlockScroll();
    };
  }, [open, reducedMotion, onClose]);

  return (
    <div ref={rootRef} className="invisible fixed inset-0 z-40 lg:hidden">
      <div
        data-overlay
        aria-hidden="true"
        onClick={() => onClose({ restoreFocus: true })}
        className="absolute inset-0 bg-espresso/40 backdrop-blur-[3px]"
      />

      <div data-panel className="relative [--focus-ring:var(--color-pudding-cream)]">
        <div
          id={MOBILE_MENU_ID}
          data-lenis-prevent
          className="relative max-h-[calc(100dvh-3rem)] overflow-y-auto bg-[linear-gradient(180deg,var(--color-pudding-caramel-500),var(--color-pudding-caramel-600)_35%,var(--color-pudding-caramel-700))] pt-[4.75rem] text-pudding-cream sm:pt-24"
        >
          <nav aria-label="Navigasi utama">
            <ul className="flex flex-col gap-1 px-3 pt-2 pb-2 sm:px-5">
              {navLinks.map((link, index) => {
                const active = activeId === link.href.slice(1);
                return (
                  <li key={link.href} data-menu-item>
                    <a
                      href={link.href}
                      aria-current={active ? "true" : undefined}
                      onClick={() => onClose({ restoreFocus: false })}
                      className={cn(
                        "flex items-center gap-4 rounded-3xl px-4 py-3 transition-colors",
                        active ? "bg-pudding-caramel-900/35 text-white" : "hover:bg-pudding-caramel-900/20",
                      )}
                    >
                      <span className="w-6 font-display text-sm font-semibold text-pudding-caramel-300 italic">
                        0{index + 1}
                      </span>
                      <span className="font-display text-[2rem] leading-tight font-bold">{link.label}</span>
                      <ArrowRightIcon className="ml-auto size-6 opacity-60" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div data-menu-item className="flex flex-col gap-5 px-6 pt-3 pb-8 sm:px-8">
            <a
              href={whatsappOrderLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-pudding-cream text-base font-bold text-pudding-caramel-800 shadow-[inset_0_-3px_0_rgb(90_44_13/0.18)] transition-[background-color,scale] duration-500 ease-jelly hover:bg-white active:scale-[0.97] sm:text-lg [&_svg]:size-[1.2em]"
            >
              <WhatsAppIcon />
              Pesan via WhatsApp
            </a>
            <div className="flex items-center justify-center gap-3">
              <a
                href={siteConfig.social.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Instagram ${siteConfig.social.instagram.handle}`}
                className="grid size-12 place-items-center rounded-full ring-1 ring-pudding-cream/30 transition-colors hover:bg-pudding-caramel-900/25"
              >
                <InstagramIcon className="size-5" />
              </a>
              <a
                href={siteConfig.social.tiktok.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`TikTok ${siteConfig.social.tiktok.handle}`}
                className="grid size-12 place-items-center rounded-full ring-1 ring-pudding-cream/30 transition-colors hover:bg-pudding-caramel-900/25"
              >
                <TikTokIcon className="size-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Tepi bawah: karamel yang meleleh ke halaman */}
        <div
          aria-hidden="true"
          className="drip-mask pointer-events-none absolute inset-x-0 top-full -mt-px h-12 bg-pudding-caramel-700"
          style={{ "--drip-mask": DRIP_MASK, "--drip-tile": "360px" } as CSSProperties}
        />
      </div>
    </div>
  );
}

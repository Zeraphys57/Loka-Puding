"use client";

import { useEffect, useRef } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowRightIcon, InstagramIcon, TikTokIcon, WhatsAppIcon } from "@/components/ui/Icons";
import { navLinks, siteConfig } from "@/config/site";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/cn";
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
        .fromTo(
          panel,
          { yPercent: -100 },
          { yPercent: 0, duration: 0.7, ease: "elastic.out(1, 0.85)" },
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
        className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]"
      />

      <div
        id={MOBILE_MENU_ID}
        data-panel
        data-lenis-prevent
        className="relative max-h-dvh overflow-y-auto rounded-b-[2rem] bg-cream pt-(--nav-h) shadow-pop"
      >
        <nav aria-label="Navigasi utama">
          <ul className="flex flex-col gap-1 px-4 pt-4 pb-2 sm:px-6">
            {navLinks.map((link) => {
              const active = activeId === link.href.slice(1);
              return (
                <li key={link.href} data-menu-item>
                  <a
                    href={link.href}
                    aria-current={active ? "true" : undefined}
                    onClick={() => onClose({ restoreFocus: false })}
                    className={cn(
                      "flex items-center justify-between rounded-2xl px-4 py-3.5 font-display text-3xl font-semibold transition-colors",
                      active ? "bg-primary-soft text-primary" : "text-ink hover:bg-primary-mist",
                    )}
                  >
                    {link.label}
                    <ArrowRightIcon className="size-6 opacity-60" />
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div data-menu-item className="flex flex-col gap-5 px-8 pt-3 pb-8 sm:px-10">
          <ButtonLink href={whatsappOrderLink()} external variant="accent" size="lg" className="w-full">
            <WhatsAppIcon />
            Pesan via WhatsApp
          </ButtonLink>
          <div className="flex items-center justify-center gap-3 text-ink-muted">
            <a
              href={siteConfig.social.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Instagram ${siteConfig.social.instagram.handle}`}
              className="grid size-11 place-items-center rounded-full ring-1 ring-line transition-colors hover:text-primary"
            >
              <InstagramIcon className="size-5" />
            </a>
            <a
              href={siteConfig.social.tiktok.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`TikTok ${siteConfig.social.tiktok.handle}`}
              className="grid size-11 place-items-center rounded-full ring-1 ring-line transition-colors hover:text-primary"
            >
              <TikTokIcon className="size-5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

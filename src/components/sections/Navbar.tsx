"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { Logo } from "@/components/ui/Logo";
import { MOBILE_MENU_ID, MobileMenu } from "@/components/ui/MobileMenu";
import { navLinks } from "@/config/site";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/cn";
import { dripMaskUrl } from "@/lib/drip";
import { whatsappOrderLink } from "@/lib/whatsapp";

/*
 * Navbar "tepi atas meleleh": pita karamel tipis menempel di tepi atas layar dengan tetesan kecil.
 * Menu berupa tulisan biasa (tanpa bar); menu aktif ditunjuk tetesan paling panjang,
 * tombol Pesan (desktop) & tombol menu (mobile) menggantung dari pita seperti tetes yang menggenang.
 * Warna tulisan menyesuaikan latar di bawahnya lewat atribut `data-nav-tone` pada section.
 */

const LINKS = navLinks.map((link) => ({ id: link.href.slice(1), href: link.href, label: link.label }));

type Tone = "light" | "dark" | "caramel";

// Pita + tetesan kecil acak (mask SVG berulang, proporsinya sama di layar mana pun).
// Pitanya 12px tapi 8px di antaranya berada di atas layar: garis setipis 4px akan terhapus filter "goo"
const EDGE_MASK = dripMaskUrl({ width: 560, height: 36, band: 12, seed: 31, count: 5, thickness: 0.65 });

// Posisi & ukuran dipakai bersama oleh elemen asli dan "cetakan"-nya di lapisan karamel,
// supaya tetesan selalu tepat di atas tulisannya
const ROW = "absolute top-9 left-1/2 -translate-x-1/2 items-center gap-1";
const LINK = "flex h-8 items-center px-3.5 text-[0.78rem] font-bold tracking-[0.16em] whitespace-nowrap uppercase";
const CTA_POS = "absolute top-[2.125rem] right-6 xl:right-10";
const CTA = "h-9 items-center gap-2 rounded-full pr-4 pl-3.5 text-[0.75rem] font-bold tracking-[0.12em] whitespace-nowrap uppercase";
const MENU_POS = "absolute top-[1.875rem] right-4 sm:right-6";

// Jarak tepi bawah pita (4px) ke atas baris menu (top-9 = 36px): tempat tetesan menggantung
const GAP = 32;
const HANG_ACTIVE = 26;
const HANG_HOVER = 10;

// Titik di pita tempat sesekali setetes karamel jatuh: jauh dari logo, tulisan menu, dan tombol
const DROP_SPOTS = ["left-[64%] lg:left-[21%]", "left-[76%] lg:left-[79%]", "left-[70%] lg:left-[26%]"];

const TEXT: Record<Tone, string> = {
  light: "text-espresso",
  dark: "text-pudding-cream",
  caramel: "text-pudding-cream",
};

const UNDERLINE: Record<Tone, string> = {
  light: "bg-pudding-caramel-600",
  dark: "bg-pudding-caramel-300",
  caramel: "bg-pudding-caramel-200",
};

// Tirai buram yang memudar ke bawah (hanya setelah digulir) agar tulisan tetap terbaca di atas foto & peta
const SCRIM: Record<Tone, string> = {
  light: "bg-milk/75",
  dark: "bg-espresso-900/70",
  caramel: "bg-pudding-caramel-700/60",
};

const LOGO_TONE = { light: "default", dark: "light", caramel: "cream" } as const;

export function Navbar() {
  const [activeId, setActiveId] = useState("home");
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [ctaHover, setCtaHover] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);
  const [tone, setTone] = useState<Tone>("light");
  const [drop, setDrop] = useState({ spot: 0, count: 0 });
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion();

  // Scroll-spy: section yang melewati tengah layar menjadi link aktif
  useEffect(() => {
    const sections = navLinks
      .map((link) => document.getElementById(link.href.slice(1)))
      .filter((section): section is HTMLElement => section !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  // Warna latar tepat di bawah baris menu (40–64px dari atas): terang, gelap, atau karamel
  useEffect(() => {
    const zones = document.querySelectorAll<HTMLElement>("[data-nav-tone]");
    const inside = new Map<Element, Tone>();
    let observer: IntersectionObserver | null = null;

    const observe = () => {
      observer?.disconnect();
      inside.clear();
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) inside.set(entry.target, (entry.target as HTMLElement).dataset.navTone as Tone);
            else inside.delete(entry.target);
          }
          const [current] = inside.values();
          setTone(current ?? "light");
        },
        { rootMargin: `-40px 0px -${Math.max(0, window.innerHeight - 64)}px 0px` },
      );
      zones.forEach((zone) => observer?.observe(zone));
    };
    observe();

    let timer = 0;
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(observe, 200);
    };
    window.addEventListener("resize", onResize);
    return () => {
      observer?.disconnect();
      window.clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Tombol "Pesan" melayang (mobile) muncul setelah hero; navbar & tombol itu minggir saat footer tersingkap.
  // Footer menempel (sticky) di belakang konten, jadi yang diamati adalah penanda di akhir <main>.
  useEffect(() => {
    const hero = document.getElementById("home");
    const sentinel = document.querySelector("[data-footer-sentinel]");
    const heroObserver = new IntersectionObserver(([entry]) => {
      setPastHero(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    if (hero) heroObserver.observe(hero);

    // Posisi dicek saat scroll (bukan IntersectionObserver): penanda setinggi 0 px bisa terlewat saat scroll cepat
    let frame = 0;
    const check = () => {
      frame = 0;
      setScrolled(window.scrollY > 24);
      if (sentinel) setFooterVisible(sentinel.getBoundingClientRect().top < window.innerHeight * 0.85);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      heroObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  // Sesekali setetes karamel lepas dari pita lalu jatuh
  useEffect(() => {
    if (reducedMotion || footerVisible) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setDrop(({ spot, count }) => ({ spot: (spot + 1) % DROP_SPOTS.length, count: count + 1 }));
    }, 6400);
    return () => window.clearInterval(timer);
  }, [reducedMotion, footerVisible]);

  const closeMenu = useCallback(({ restoreFocus }: { restoreFocus: boolean }) => {
    setMenuOpen(false);
    if (restoreFocus) menuButtonRef.current?.focus();
  }, []);

  const hangFor = (id: string) => (activeId === id ? HANG_ACTIVE : hoverId === id ? HANG_HOVER : 0);
  const hidden = footerVisible && !menuOpen;
  // Panel menu mobile berwarna karamel: selama terbuka, tulisan di atasnya ikut krem
  const shownTone: Tone = menuOpen ? "caramel" : tone;

  return (
    <>
      <div
        inert={hidden}
        className={cn(
          "pointer-events-none fixed inset-x-0 top-0 z-50 h-(--nav-h) transition-[translate,opacity] duration-700 ease-out-soft",
          hidden && "-translate-y-full opacity-0",
        )}
        style={shownTone === "light" ? undefined : ({ "--focus-ring": "var(--color-pudding-cream)" } as CSSProperties)}
      >
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-x-0 top-0 h-28 backdrop-blur-md transition-[opacity,background-color] duration-500 [mask-image:linear-gradient(to_bottom,black_45%,transparent)]",
            SCRIM[tone],
            scrolled && !menuOpen ? "opacity-100" : "opacity-0",
          )}
        />

        {/* Lapisan karamel cair (filter "goo"): pita, tetesan, dan cetakan tombol menyatu seperti lelehan */}
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[6.5rem] [filter:url(#caramel-goo)]">
          <div
            className="drip-mask absolute inset-x-0 -top-2 h-9 bg-[linear-gradient(180deg,var(--color-pudding-caramel-500)_8px,var(--color-pudding-caramel-600)_12px,var(--color-pudding-caramel-700))]"
            style={{ "--drip-mask": EDGE_MASK, "--drip-tile": "560px" } as CSSProperties}
          />

          <ul className={cn(ROW, "hidden lg:flex")}>
            {LINKS.map((link) => (
              <li key={link.id} className="relative">
                <span className={cn(LINK, "invisible")}>{link.label}</span>
                <Drip hang={hangFor(link.id)} />
              </li>
            ))}
          </ul>

          {/* Tombol Pesan = tetes yang menggenang jadi pil, tergantung dari pita */}
          <div className={cn(CTA_POS, "hidden lg:block")}>
            <span
              className="absolute left-1/2 w-2.5 -translate-x-1/2 bg-pudding-caramel-600 transition-[height] duration-700 ease-jelly"
              style={{ top: -32, height: ctaHover ? 44 : 38 }}
            />
            <span
              className={cn(
                CTA,
                "relative flex bg-[linear-gradient(180deg,var(--color-pudding-caramel-600),var(--color-pudding-caramel-700))] transition-[translate] duration-700 ease-jelly",
                ctaHover && "translate-y-1.5",
              )}
            >
              <span className="invisible flex items-center gap-2">
                <span className="size-4" />
                Pesan
              </span>
            </span>
          </div>

          {/* Tombol menu mobile = tetes bulat yang menggantung */}
          <div className={cn(MENU_POS, "lg:hidden")}>
            <span className="absolute -top-7 left-1/2 h-9 w-2.5 -translate-x-1/2 bg-pudding-caramel-600" />
            <span className="relative block size-11 rounded-full bg-[linear-gradient(180deg,var(--color-pudding-caramel-600),var(--color-pudding-caramel-700))]" />
          </div>

          {drop.count > 0 ? (
            <span
              key={drop.count}
              className={cn(
                "absolute top-[3px] size-[11px] -translate-x-1/2 animate-drip-fall rounded-full bg-pudding-caramel-700",
                DROP_SPOTS[drop.spot],
              )}
            />
          ) : null}
        </div>

        {/* Kilau tipis di sepanjang pita */}
        <span aria-hidden="true" className="absolute inset-x-0 top-px h-px bg-gradient-to-r from-white/0 via-white/40 to-white/0" />

        <a
          href="#home"
          aria-label="Loka Pudding, kembali ke atas"
          className="group/logo pointer-events-auto absolute top-[2.125rem] left-4 rounded-full sm:left-6 xl:left-10"
        >
          <Logo id="mark-nav" tone={LOGO_TONE[shownTone]} />
        </a>

        <nav aria-label="Navigasi utama" className="hidden lg:block">
          <ul className={cn(ROW, "pointer-events-auto flex")}>
            {LINKS.map((link) => {
              const active = activeId === link.id;
              return (
                <li key={link.id}>
                  <a
                    href={link.href}
                    aria-current={active ? "true" : undefined}
                    onMouseEnter={() => setHoverId(link.id)}
                    onMouseLeave={() => setHoverId(null)}
                    onFocus={() => setHoverId(link.id)}
                    onBlur={() => setHoverId(null)}
                    className={cn(LINK, "group/link relative rounded-full transition-colors duration-500", TEXT[tone])}
                  >
                    {link.label}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute inset-x-3.5 bottom-0.5 h-0.5 origin-left rounded-full transition-[scale,background-color] duration-500 ease-out-soft",
                        UNDERLINE[tone],
                        active ? "scale-x-100" : "scale-x-0 group-hover/link:scale-x-40",
                      )}
                    />
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <a
          href={whatsappOrderLink()}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Pesan via WhatsApp"
          onMouseEnter={() => setCtaHover(true)}
          onMouseLeave={() => setCtaHover(false)}
          onFocus={() => setCtaHover(true)}
          onBlur={() => setCtaHover(false)}
          className={cn(
            CTA_POS,
            CTA,
            "pointer-events-auto hidden text-pudding-cream transition-[translate] duration-700 ease-jelly lg:flex [&_svg]:size-4",
            ctaHover && "translate-y-1.5",
          )}
        >
          <WhatsAppIcon />
          Pesan
        </a>

        <button
          ref={menuButtonRef}
          type="button"
          aria-expanded={menuOpen}
          aria-controls={MOBILE_MENU_ID}
          aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
          onClick={() => setMenuOpen((open) => !open)}
          className={cn(
            MENU_POS,
            "pointer-events-auto grid size-11 place-items-center rounded-full text-pudding-cream [--focus-ring:var(--color-pudding-cream)] lg:hidden",
          )}
        >
          <span aria-hidden="true" className="relative block h-3 w-[1.1rem]">
            <span className={cn("absolute top-0 left-0 h-0.5 w-full rounded-full bg-current transition-[translate,rotate] duration-500 ease-jelly", menuOpen && "translate-y-[5px] rotate-45")} />
            <span className={cn("absolute top-[5px] left-0 h-0.5 w-full rounded-full bg-current transition-[scale,opacity] duration-300", menuOpen && "scale-x-0 opacity-0")} />
            <span className={cn("absolute top-2.5 left-0 h-0.5 w-full rounded-full bg-current transition-[translate,rotate] duration-500 ease-jelly", menuOpen && "-translate-y-[5px] -rotate-45")} />
          </span>
        </button>
      </div>

      {/* Tombol "Pesan" melayang (mobile & tablet) */}
      <a
        href={whatsappOrderLink()}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={pastHero && !footerVisible && !menuOpen ? undefined : -1}
        aria-hidden={pastHero && !footerVisible && !menuOpen ? undefined : true}
        aria-label="Pesan via WhatsApp"
        className={cn(
          "fixed right-4 bottom-4 z-40 flex size-14 items-center justify-center gap-2 rounded-full bg-caramel-600 font-bold text-white shadow-pop ring-4 ring-milk-50/70 transition-[translate,opacity] duration-500 ease-out-soft sm:w-auto sm:pr-6 sm:pl-5 lg:hidden [&_svg]:size-6",
          pastHero && !footerVisible && !menuOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-24 opacity-0",
        )}
      >
        <WhatsAppIcon />
        <span className="hidden sm:inline">Pesan</span>
      </a>

      {/* Filter "goo": blur lalu tajamkan tepi alfa → bentuk yang berdekatan menyatu seperti lelehan, plus bayangan */}
      <svg aria-hidden="true" focusable="false" className="pointer-events-none absolute size-0">
        <defs>
          <filter id="caramel-goo" x="-10%" y="-20%" width="120%" height="140%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -8" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" result="liquid" />
            <feDropShadow in="liquid" dx="0" dy="4" stdDeviation="4" floodColor="#3f1e08" floodOpacity="0.28" />
          </filter>
        </defs>
      </svg>

      <MobileMenu open={menuOpen} activeId={activeId} onClose={closeMenu} />
    </>
  );
}

/**
 * Satu tetesan yang menggantung dari tepi bawah pita: leher + bulatan di ujung.
 * Pangkalnya sedikit masuk ke pita agar menyatu tanpa sambungan (filter "goo").
 */
function Drip({ hang }: { hang: number }) {
  return (
    <span className="absolute left-1/2" style={{ top: -GAP }}>
      <span
        className="absolute -top-1 left-[-3.5px] w-[7px] rounded-b-full bg-[linear-gradient(180deg,var(--color-pudding-caramel-600),var(--color-pudding-caramel-700))] transition-[height] duration-700 ease-jelly"
        style={{ height: 4 + hang }}
      />
      <span
        className="absolute left-[-5.5px] size-[11px] rounded-full bg-pudding-caramel-700 transition-[top,scale] duration-700 ease-jelly"
        style={{ top: hang - 6.5, scale: hang > 2 ? 1 : 0.3 }}
      />
    </span>
  );
}

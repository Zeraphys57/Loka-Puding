"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType, type SVGProps } from "react";
import { BookHeartIcon, HomeIcon, MapPinIcon, PuddingIcon, WhatsAppIcon } from "@/components/ui/Icons";
import { Logo } from "@/components/ui/Logo";
import { MOBILE_MENU_ID, MobileMenu } from "@/components/ui/MobileMenu";
import { navLinks } from "@/config/site";
import { cn } from "@/lib/cn";
import { whatsappOrderLink } from "@/lib/whatsapp";

type NavIcon = ComponentType<SVGProps<SVGSVGElement>>;

const ICONS: Record<string, NavIcon> = {
  "#home": HomeIcon,
  "#tentang": BookHeartIcon,
  "#menu": PuddingIcon,
  "#lokasi": MapPinIcon,
};

type RailItem = { id: string; href: string; label: string; icon: NavIcon; external?: boolean };

const RAIL: RailItem[] = [
  ...navLinks.map((link) => ({ id: link.href.slice(1), href: link.href, label: link.label, icon: ICONS[link.href] })),
  { id: "pesan", href: whatsappOrderLink(), label: "Pesan", icon: WhatsAppIcon, external: true },
];

// Lebar "tetesan" karamel yang keluar dari dinding (px)
const BLOB_REST = 50;
const BLOB_ACTIVE = 62;
const BLOB_OPEN = 152;

export function Navbar() {
  const [activeId, setActiveId] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [pastHero, setPastHero] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

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

  // Tombol "Pesan" melayang (mobile) muncul setelah hero; nav karamel & tombol itu minggir saat footer tersingkap.
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
    const checkFooter = () => {
      frame = 0;
      if (sentinel) setFooterVisible(sentinel.getBoundingClientRect().top < window.innerHeight * 0.85);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(checkFooter);
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

  const closeMenu = useCallback(({ restoreFocus }: { restoreFocus: boolean }) => {
    setMenuOpen(false);
    if (restoreFocus) menuButtonRef.current?.focus();
  }, []);

  const blobWidth = (item: RailItem) =>
    openId === item.id ? BLOB_OPEN : activeId === item.id ? BLOB_ACTIVE : BLOB_REST;

  return (
    <>
      {/* Logo: pil kaca di kiri atas, terbaca di latar terang maupun gelap */}
      <div className="fixed top-3 left-3 z-50 sm:top-5 sm:left-5 lg:top-6 lg:left-6">
        <a
          href="#home"
          aria-label="Loka Pudding, kembali ke atas"
          className="group/logo flex items-center rounded-full bg-milk-50/85 py-1.5 pr-4 pl-2 shadow-soft ring-1 ring-espresso/5 backdrop-blur-xl transition-[scale,background-color] duration-500 ease-jelly hover:scale-[1.03] hover:bg-milk-50"
        >
          <Logo id="mark-nav" />
        </a>
      </div>

      {/* Tombol menu (mobile & tablet) */}
      <div className="fixed top-3 right-3 z-50 sm:top-5 sm:right-5 lg:hidden">
        <button
          ref={menuButtonRef}
          type="button"
          aria-expanded={menuOpen}
          aria-controls={MOBILE_MENU_ID}
          aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
          onClick={() => setMenuOpen((open) => !open)}
          className="grid size-[3.25rem] place-items-center rounded-full bg-espresso text-milk-50 shadow-pop ring-1 ring-milk-50/10 transition-[scale] duration-500 ease-jelly active:scale-90"
        >
          <span aria-hidden="true" className="relative block h-3.5 w-5">
            <span className={cn("absolute top-0 left-0 h-0.5 w-full rounded-full bg-current transition-[translate,rotate] duration-500 ease-jelly", menuOpen && "translate-y-1.5 rotate-45")} />
            <span className={cn("absolute top-1.5 left-0 h-0.5 w-full rounded-full bg-current transition-[scale,opacity] duration-300", menuOpen && "scale-x-0 opacity-0")} />
            <span className={cn("absolute top-3 left-0 h-0.5 w-full rounded-full bg-current transition-[translate,rotate] duration-500 ease-jelly", menuOpen && "-translate-y-1.5 -rotate-45")} />
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

      {/* Desktop: dinding karamel di tepi kanan, tiap link = tetesan yang meleleh keluar saat disorot */}
      <nav
        aria-label="Navigasi utama"
        inert={footerVisible}
        className={cn(
          "pointer-events-none fixed inset-y-0 right-0 z-40 hidden w-48 transition-transform duration-700 ease-out-soft lg:block",
          footerVisible && "translate-x-[calc(100%+1rem)]",
        )}
      >
        {/* Lapisan "goo": dinding + tetesan menyatu lewat filter SVG */}
        <div aria-hidden="true" className="absolute inset-0" style={{ filter: "url(#goo)" }}>
          <div className="absolute inset-y-0 right-0 w-3 bg-caramel-500" />
          <div className="absolute top-1/2 right-0 flex -translate-y-1/2 flex-col items-end gap-4">
            {RAIL.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "h-12 rounded-full transition-[width,background-color] duration-[650ms] ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]",
                  activeId === item.id || openId === item.id ? "bg-caramel-600" : "bg-caramel-500",
                )}
                style={{ width: blobWidth(item) }}
              />
            ))}
          </div>
        </div>

        {/* Lapisan interaktif (tidak kena filter) */}
        <ul className="absolute top-1/2 right-0 flex -translate-y-1/2 flex-col items-end gap-4">
          {RAIL.map((item) => {
            const Icon = item.icon;
            const open = openId === item.id;
            const active = activeId === item.id;
            return (
              <li key={item.id} className="flex h-12 items-center">
                <a
                  href={item.href}
                  {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : null)}
                  aria-current={active ? "true" : undefined}
                  onMouseEnter={() => setOpenId(item.id)}
                  onMouseLeave={() => setOpenId(null)}
                  onFocus={() => setOpenId(item.id)}
                  onBlur={() => setOpenId(null)}
                  className="pointer-events-auto flex h-12 items-center justify-end gap-2.5 rounded-full pr-[1.35rem] text-white outline-none focus-visible:shadow-[0_0_0_2px_var(--color-milk-50),0_0_0_4px_var(--color-espresso)]"
                  style={{ width: blobWidth(item) }}
                >
                  {/* Selalu ada di DOM (hanya transparan) → tetap jadi nama link untuk pembaca layar */}
                  <span
                    className={cn(
                      "text-[0.8rem] font-bold tracking-[0.14em] whitespace-nowrap uppercase transition-[opacity,translate] duration-300",
                      open ? "translate-x-0 opacity-100 delay-150" : "pointer-events-none translate-x-3 opacity-0",
                    )}
                  >
                    {item.label}
                  </span>
                  <span className="relative grid size-5 shrink-0 place-items-center">
                    <Icon className="size-5" />
                    {active && !open ? (
                      <span aria-hidden="true" className="absolute -bottom-2 size-1.5 rounded-full bg-caramel-200" />
                    ) : null}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Filter "goo": blur lalu tajamkan tepi alfa → bentuk-bentuk yang berdekatan menyatu seperti lelehan */}
      <svg aria-hidden="true" focusable="false" className="pointer-events-none absolute size-0">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <MobileMenu open={menuOpen} activeId={activeId} onClose={closeMenu} />
    </>
  );
}

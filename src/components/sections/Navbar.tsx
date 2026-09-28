"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { Logo } from "@/components/ui/Logo";
import { MOBILE_MENU_ID, MobileMenu } from "@/components/ui/MobileMenu";
import { navLinks } from "@/config/site";
import { cn } from "@/lib/cn";
import { whatsappOrderLink } from "@/lib/whatsapp";

export function Navbar() {
  const [activeId, setActiveId] = useState("beranda");
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
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

  const closeMenu = useCallback(({ restoreFocus }: { restoreFocus: boolean }) => {
    setMenuOpen(false);
    if (restoreFocus) menuButtonRef.current?.focus();
  }, []);

  return (
    <>
      {/* LOGO: Fixed Top Left with Frosted Glass so it's visible on dark and light backgrounds */}
      <div className="fixed top-6 left-6 sm:top-10 sm:left-10 z-50 pointer-events-auto">
        <a href="#beranda" className="flex items-center justify-center p-3 bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl shadow-xl hover:scale-105 hover:bg-white transition-all" aria-label="Loka Puding, kembali ke beranda">
          <Logo />
        </a>
      </div>

      {/* WHATSAPP: Fixed Bottom Left (Desktop) */}
      <div className="hidden lg:block fixed bottom-10 left-10 z-50 pointer-events-auto">
        <a href={whatsappOrderLink()} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-[#c27a29] text-white px-7 py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-white hover:text-[#c27a29] transition-all hover:scale-105 shadow-[0_10px_40px_rgba(194,122,41,0.4)]">
          <WhatsAppIcon className="w-5 h-5" /> Pesan Puding
        </a>
      </div>

      {/* MOBILE MENU BUTTON: Fixed Top Right */}
      <div className="fixed top-6 right-6 z-50 lg:hidden pointer-events-auto">
        <button
          ref={menuButtonRef}
          type="button"
          aria-expanded={menuOpen}
          aria-controls={MOBILE_MENU_ID}
          aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
          onClick={() => setMenuOpen((open) => !open)}
          className="grid size-12 place-items-center rounded-full bg-white/90 backdrop-blur-md text-ink ring-1 ring-black/5 shadow-xl transition-[scale] duration-500 ease-jelly active:scale-90"
        >
          <span aria-hidden="true" className="relative block h-3.5 w-5">
            <span className={cn("absolute top-0 left-0 h-0.5 w-full rounded-full bg-current transition-[translate,rotate] duration-500 ease-jelly", menuOpen && "translate-y-1.5 rotate-45")} />
            <span className={cn("absolute top-1.5 left-0 h-0.5 w-full rounded-full bg-current transition-[scale,opacity] duration-300", menuOpen && "scale-x-0 opacity-0")} />
            <span className={cn("absolute top-3 left-0 h-0.5 w-full rounded-full bg-current transition-[translate,rotate] duration-500 ease-jelly", menuOpen && "-translate-y-1.5 -rotate-45")} />
          </span>
        </button>
      </div>

      {/* DESKTOP GOOEY RIGHT NAV (CARAMEL DRIP) */}
      <nav className="hidden lg:flex fixed right-0 top-0 h-screen w-64 z-40 pointer-events-none items-center justify-end overflow-visible">
        
        {/* Gooey Layer */}
        <div className="absolute inset-0 w-full h-full pointer-events-none" style={{ filter: "url(#goo)" }}>
           {/* The solid dripping line on the extreme right */}
           <div className="absolute right-[-20px] top-0 w-[40px] h-full bg-[#c27a29]" />
           
           <div className="w-full h-full flex flex-col justify-center items-end gap-6 pr-6">
             {navLinks.map((link) => {
               const id = link.href.slice(1);
               const isActive = activeId === id;
               const isHovered = hoveredId === id;
               
               let translateX = "translate-x-6"; // mostly hidden in wall
               let width = "w-10";
               
               if (isHovered || isActive) {
                 translateX = "translate-x-0"; // pull away just enough
                 width = "w-36"; // shorter stretch! (was w-44)
               } 

               return (
                 <div 
                   key={link.href} 
                   className={cn(
                     "h-12 bg-[#c27a29] rounded-full transition-all duration-[600ms] ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]",
                     translateX,
                     width
                   )}
                 />
               );
             })}
           </div>
        </div>

        {/* Interactive / Text Layer (Above Gooey Layer) */}
        <div className="absolute inset-0 w-full h-full flex flex-col justify-center items-end gap-6 pr-6 pointer-events-none">
           {navLinks.map((link) => {
             const id = link.href.slice(1);
             const isActive = activeId === id;
             const isHovered = hoveredId === id;

             return (
               <div key={link.href} className="relative flex items-center justify-end w-full h-12">
                  {/* Fixed Text Label */}
                  {/* mix-blend-difference makes it beautifully contrast with ANY background when not inside the caramel */}
                  <span className={cn(
                    "absolute right-10 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-[600ms] z-20 pointer-events-none whitespace-nowrap",
                    (isHovered || isActive) 
                      ? "text-white opacity-100 scale-100" 
                      : "text-white mix-blend-difference opacity-50 scale-95"
                  )}>
                    {link.label}
                  </span>

                  {/* Invisible Hover Hitbox covering the text and blob */}
                  <a 
                    href={link.href}
                    onMouseEnter={() => setHoveredId(id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className="absolute right-[-24px] w-[200px] h-full pointer-events-auto z-30 outline-none"
                    aria-label={link.label}
                  />
               </div>
             );
           })}
        </div>
      </nav>

      {/* SVG Defs for Gooey Effect */}
      <svg style={{ visibility: "hidden", position: "absolute", width: 0, height: 0 }}>
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
          </filter>
        </defs>
      </svg>

      <MobileMenu open={menuOpen} activeId={activeId} onClose={closeMenu} />
    </>
  );
}

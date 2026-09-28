"use client";

import { useRef } from "react";
import { ClockIcon, MapPinIcon, WhatsAppIcon } from "@/components/ui/Icons";
import { siteConfig } from "@/config/site";
import { formatTime } from "@/lib/format";
import { whatsappOrderLink } from "@/lib/whatsapp";
import { Playfair_Display } from "next/font/google";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

export function Location() {
  const { address, openingHours, maps, delivery } = siteConfig;
  
  const containerRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Only apply scroll jacking on desktop to avoid weird mobile behavior
    const mm = gsap.matchMedia();
    
    mm.add("(min-width: 768px)", () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=1500", // Dikembalikan ke jarak yang pas
          pin: true,
          scrub: 0.8, // Scrubbing yang lebih responsif
        }
      });

      // 1. Expand mask (Starts after a very short 0.15 delay)
      tl.to(maskRef.current, {
        clipPath: "circle(150vw at 50% 50%)",
        ease: "none", // Linear ease is mandatory for smooth scroll-scrub animations
        duration: 1
      }, 0.15); 

      // 2. Fade and scale out background text
      tl.to(textRef.current, {
        opacity: 0,
        scale: 1.1,
        duration: 0.4
      }, 0.15);

      // 3. Bring in the floating glass info card (No bounce, very smooth power3)
      tl.fromTo(contentRef.current, {
        autoAlpha: 0,
        y: 80,
        scale: 0.95
      }, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: "power3.out"
      }, 0.6); 
      
      return () => {
        // cleanup if needed
      };
    });
    
    // For mobile, just show the final state
    mm.add("(max-width: 767px)", () => {
      gsap.set(maskRef.current, { clipPath: "circle(150% at 50% 50%)" });
      gsap.set(textRef.current, { display: "none" });
      gsap.set(contentRef.current, { autoAlpha: 1, y: 0, scale: 1 });
    });

  }, { scope: containerRef });

  return (
    <section ref={containerRef} id="lokasi" aria-labelledby="lokasi-title" className="relative h-screen bg-ink overflow-hidden flex items-center justify-center">
      
      {/* BACKGROUND TEXT (Visible initially) */}
      <div ref={textRef} className="absolute inset-0 z-10 pointer-events-none">
         <h2 className={`absolute top-[15%] left-1/2 -translate-x-1/2 text-[18vw] sm:text-[10rem] lg:text-[12rem] font-black text-white leading-none tracking-tighter text-center`}>
           DAPUR
         </h2>
         <h2 className={`absolute bottom-[20%] left-1/2 -translate-x-1/2 text-[18vw] sm:text-[10rem] lg:text-[12rem] text-[#c27a29] italic font-normal leading-none text-center ${playfair.className}`}>
           kami
         </h2>
         <p className="absolute bottom-[8%] left-1/2 -translate-x-1/2 text-white/40 tracking-[0.4em] sm:tracking-[0.5em] uppercase text-[10px] sm:text-xs font-bold animate-pulse w-full text-center">
           Scroll ke bawah
         </p>
      </div>

      {/* THE MASKED MAP CONTAINER */}
      <div 
        ref={maskRef} 
        className="absolute inset-0 z-20 will-change-[clip-path]"
        style={{ clipPath: "circle(10vw at 50% 50%)" }}
      >
        {/* Fullscreen Map */}
        <iframe
          src={maps.embedUrl}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 size-full border-0 filter grayscale-[0.3] contrast-125 sepia-[0.2]"
        />

        {/* Overlay gradient so the map isn't too bright */}
        <div className="absolute inset-0 bg-ink/60 pointer-events-none" />

        {/* FLOATING INFO PANEL (Inside the mask so it only appears when revealed) */}
        <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-8 pointer-events-none">
           <div 
             ref={contentRef}
             className="w-full max-w-5xl bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 sm:p-12 shadow-2xl shadow-black/80 pointer-events-auto flex flex-col lg:flex-row gap-8 lg:gap-16 invisible"
           >
              {/* Left: Address & Hours */}
              <div className="flex-1 flex flex-col gap-8">
                 <div>
                   <h3 className="text-[#c27a29] text-[10px] font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                     <MapPinIcon className="w-5 h-5" /> Lokasi
                   </h3>
                   <p className="text-white text-2xl sm:text-4xl font-black leading-[1.1] mb-3">
                     {address.street}
                   </p>
                   <p className="text-white/60 text-sm sm:text-lg leading-relaxed">
                     {address.locality}, {address.city} <br/> {address.region} {address.postalCode}
                   </p>
                 </div>

                 <div className="w-full h-[1px] bg-white/10" />

                 <div>
                   <h3 className="text-[#c27a29] text-[10px] font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                     <ClockIcon className="w-5 h-5" /> Jam Operasional
                   </h3>
                   <div className="flex flex-col gap-3">
                     {openingHours.map((slot) => (
                       <div key={slot.label} className="flex justify-between items-end text-sm sm:text-base border-b border-white/5 pb-2">
                         <span className="text-white/50">{slot.label}</span>
                         <span className="text-white font-bold">{formatTime(slot.opens)} - {formatTime(slot.closes)}</span>
                       </div>
                     ))}
                   </div>
                 </div>
              </div>

              {/* Right: Actions */}
              <div className="flex-1 flex flex-col gap-4 justify-center">
                 <a href={whatsappOrderLink()} target="_blank" rel="noreferrer" className="w-full bg-[#25D366] text-white p-6 sm:p-8 rounded-[2rem] flex items-center justify-between group hover:scale-[1.02] transition-transform shadow-xl shadow-[#25D366]/20">
                    <div>
                      <h4 className="font-black text-2xl sm:text-3xl mb-1">WhatsApp</h4>
                      <p className="text-white/80 text-[10px] uppercase tracking-[0.2em] font-bold">Pesan Langsung</p>
                    </div>
                    <WhatsAppIcon className="w-10 h-10 sm:w-12 sm:h-12 group-hover:rotate-12 transition-transform" />
                 </a>
                 
                 <a href={maps.link} target="_blank" rel="noreferrer" className="w-full bg-white/5 border border-white/10 text-white p-6 rounded-[2rem] flex items-center justify-between group hover:bg-white/10 transition-colors">
                    <div>
                      <h4 className="font-bold text-lg sm:text-xl mb-1">Buka di Maps</h4>
                      <p className="text-white/50 text-[10px] uppercase tracking-[0.2em] font-bold">Navigasi ke dapur</p>
                    </div>
                    <MapPinIcon className="w-8 h-8 text-white/50 group-hover:text-white transition-colors" />
                 </a>
              </div>
           </div>
        </div>

      </div>
    </section>
  );
}

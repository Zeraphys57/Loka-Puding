"use client";

import { useState } from "react";
import Image from "next/image";
import type { ComponentType, SVGProps } from "react";
import { Container } from "@/components/ui/Container";
import { SparkleIcon, HomeHeartIcon, MilkIcon, StoreIcon } from "@/components/ui/Icons";
import { WaveDivider } from "@/components/ui/WaveDivider";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

type Value = {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  text: string;
  image: string;
};

const values: Value[] = [
  {
    icon: MilkIcon,
    title: "Bahan Premium",
    text: "Susu sapi segar dan gula karamel murni pilihan. Rasanya jujur, kaya, dan tanpa perisa buatan.",
    image: "/images/about/bahan-premium-v2.jpg",
  },
  {
    icon: HomeHeartIcon,
    title: "Dibuat Tiap Pagi",
    text: "Dimasak setiap subuh dalam batch kecil, puding selalu dalam kondisi paling segar saat sampai ke tanganmu.",
    image: "/images/about/dibuat-pagi.jpg",
  },
  {
    icon: SparkleIcon,
    title: "Tekstur Sempurna",
    text: "Goyangan super kenyal, padat namun langsung lumer dan meleleh manis di suapan pertama.",
    image: "/images/about/tekstur-sempurna.jpg",
  },
  {
    icon: StoreIcon,
    title: "Resep Autentik",
    text: "Murni dari dapur rumahan, dikembangkan perlahan hingga menemukan keseimbangan manis yang mutlak pas.",
    image: "/images/about/resep-autentik.jpg",
  },
];

export function About() {
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <section id="tentang" aria-labelledby="tentang-title" className="relative bg-[#fffdfa] overflow-hidden">
      <style>{`
        .expandable-grid {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.7s cubic-bezier(0.87, 0, 0.13, 1);
        }
        .group\\/item:hover .expandable-grid,
        .group\\/item:focus-within .expandable-grid {
          grid-template-rows: 1fr;
        }
        .expandable-inner {
          overflow: hidden;
        }
        @keyframes marquee-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee-left 25s linear infinite;
        }
      `}</style>

      {/* Background Decorators */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#ffebd6] rounded-full mix-blend-multiply filter blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#fff3e0] rounded-full mix-blend-multiply filter blur-[100px] opacity-70 pointer-events-none" />

      {/* Top Header Section */}
      <Container className="relative pt-24 sm:pt-32 pb-12 z-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-4">
          <div className="max-w-3xl" data-reveal>
            <div className="flex items-center gap-3 mb-8">
               <div className="h-[1px] w-12 bg-[#c27a29]"></div>
               <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#c27a29]">Kisah Kami</span>
            </div>
            
            <h2 id="tentang-title" className="text-[clamp(3.5rem,8vw,6rem)] font-black text-ink leading-[0.95] tracking-tighter">
              DARI DAPUR <br />
              <span className={`text-[#c27a29] font-normal italic ${playfair.className} text-[clamp(4.5rem,10vw,7.5rem)]`}>rumahan</span>
            </h2>
          </div>
          
          <div className="lg:max-w-sm lg:pb-4" data-reveal>
            <p className="text-lg sm:text-xl leading-relaxed text-ink-muted border-l-2 border-[#c27a29]/20 pl-6">
              Berawal dari resep andalan keluarga yang selalu ludes setiap kumpul acara, kini kami membagikan kebahagiaan manis ini langsung ke piringmu.
            </p>
          </div>
        </div>
      </Container>

      {/* Main Interactive Grid */}
      <Container className="relative grid gap-12 lg:gap-24 pb-24 sm:pb-32 lg:grid-cols-[1fr_1.3fr] lg:items-start z-10">
        
        {/* Left: Dedicated Massive Image Gallery (Sticky on Desktop) */}
        <div className="hidden lg:block lg:sticky lg:top-24 h-[calc(100vh-6rem)] max-h-[750px] w-full rounded-[2.5rem] overflow-hidden shadow-2xl shadow-[#c27a29]/10 relative border-[8px] border-white ring-1 ring-black/5" data-reveal="rise">
           {values.map((val, idx) => (
              <Image 
                key={idx}
                src={val.image}
                alt={val.title}
                fill
                priority={idx === 0}
                sizes="(min-width: 1024px) 45vw, 0vw"
                className={`object-cover transition-all duration-1000 ease-[cubic-bezier(0.87,0,0.13,1)] ${activeIdx === idx ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 z-0'}`}
              />
           ))}
           {/* Subtle gradient overlay to make it look cinematic */}
           <div className="absolute inset-0 bg-gradient-to-t from-[#c27a29]/20 via-transparent to-transparent mix-blend-multiply pointer-events-none z-20" />
        </div>

        {/* Right: Ultra Interactive Sweep Accordion */}
        <div className="relative flex flex-col w-full group/accordion">
          <div className="border-t border-[#c27a29]/20" />
          
          {values.map(({ title, text, icon: Icon, image }, index) => (
            <div 
              key={title} 
              data-reveal="rise"
              onMouseEnter={() => setActiveIdx(index)}
              onFocus={() => setActiveIdx(index)}
              className="group/item border-b border-[#c27a29]/20 transition-all duration-700 ease-[cubic-bezier(0.87,0,0.13,1)] group-hover/accordion:[&:not(:hover)]:opacity-25 relative cursor-pointer overflow-hidden rounded-xl my-1"
            >
              {/* SLIDING CARAMEL BACKGROUND WITH MARQUEE */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#d97700] to-[#b55e10] translate-y-[101%] group-hover/item:translate-y-0 transition-transform duration-700 pointer-events-none z-0 ease-[cubic-bezier(0.87,0,0.13,1)] flex items-center justify-center">
                 <div className="flex whitespace-nowrap animate-marquee text-[10rem] font-black italic text-white opacity-[0.05] select-none pointer-events-none">
                   <span>KARAMEL LUMER • 100% FRESH • LOKA PUDDING • KARAMEL LUMER • 100% FRESH • LOKA PUDDING • </span>
                   <span>KARAMEL LUMER • 100% FRESH • LOKA PUDDING • KARAMEL LUMER • 100% FRESH • LOKA PUDDING • </span>
                 </div>
              </div>
              
              <div className="py-8 sm:py-10 px-4 sm:px-6 flex flex-col justify-center relative z-10">
                
                {/* Header (Always visible) */}
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl sm:text-4xl lg:text-[2.75rem] font-black text-ink uppercase tracking-tighter transition-colors duration-700 group-hover/item:text-white flex items-center">
                    <span className={`text-ink/10 mr-4 sm:mr-8 font-normal italic ${playfair.className} text-4xl sm:text-6xl transition-colors duration-700 group-hover/item:text-white/30`}>
                      0{index+1}
                    </span>
                    {title}
                  </h3>
                  
                  {/* Morphing Icon Button */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/50 border border-[#c27a29]/20 flex items-center justify-center text-[#c27a29]/60 transition-all duration-700 group-hover/item:bg-white group-hover/item:text-[#c27a29] group-hover/item:scale-110 group-hover/item:-rotate-[15deg] group-hover/item:border-transparent group-hover/item:shadow-2xl group-hover/item:shadow-black/10 flex-shrink-0 ease-[cubic-bezier(0.87,0,0.13,1)]">
                    <Icon className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>
                </div>
                
                {/* Body (Expands dynamically on hover via CSS Grid trick) */}
                <div className="expandable-grid">
                  <div className="expandable-inner">
                    <div className="pt-6 sm:pt-8 pb-2 opacity-0 transform translate-y-4 transition-all duration-700 ease-[cubic-bezier(0.87,0,0.13,1)] group-hover/item:opacity-100 group-hover/item:translate-y-0 delay-[50ms]">
                      
                      <p className="text-lg sm:text-xl text-ink-muted transition-colors duration-700 group-hover/item:text-white/90 leading-relaxed pl-[3rem] sm:pl-[5.5rem] pr-4 sm:pr-20 font-medium">
                        {text}
                      </p>

                      {/* Mobile Only Image Reveal */}
                      <div className="pl-[3rem] sm:pl-[5.5rem] pr-4 mt-6 lg:hidden">
                        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-xl border-4 border-white/20">
                           <Image src={image} alt={title} fill className="object-cover" />
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>

      </Container>

      <WaveDivider className="text-cream relative z-10" />
    </section>
  );
}

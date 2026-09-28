import { Container } from "@/components/ui/Container";
import { MenuBrowser } from "@/components/ui/MenuBrowser";
import { WaveDivider } from "@/components/ui/WaveDivider";
import { getMenuCategories, getMenuItems } from "@/lib/menu";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

export function MenuCatalog() {
  const items = getMenuItems();
  const categories = getMenuCategories(items);

  return (
    <section id="menu" aria-labelledby="menu-title" className="relative bg-[#fffdfa] pt-24 sm:pt-32">
      {/* Background Decorator */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-[#ffebd6] rounded-full mix-blend-multiply filter blur-[120px] opacity-40 pointer-events-none" />

      <Container className="relative z-10 flex flex-col gap-16 sm:gap-20 pb-24 sm:pb-32">
        
        {/* Massive Editorial Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto" data-reveal>
          <div className="flex items-center gap-3 mb-6">
             <div className="h-[1px] w-8 bg-[#c27a29]"></div>
             <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#c27a29]">Katalog Kami</span>
             <div className="h-[1px] w-8 bg-[#c27a29]"></div>
          </div>
          
          <h2
            id="menu-title"
            className="text-[clamp(3.5rem,8vw,5.5rem)] font-black text-ink leading-[0.95] tracking-tighter"
          >
            MENU <span className={`text-[#c27a29] font-normal italic ${playfair.className}`}>Karamel</span>
          </h2>
          <p className="mt-8 text-lg sm:text-xl text-ink-muted leading-relaxed">
            Puding sutra yang dibuat selalu fresh setiap hari. Pilih menu favoritmu untuk melihat detail teksturnya dan memesan langsung.
          </p>
        </div>

        {/* Menu Browser (Filters + Grid) */}
        <MenuBrowser items={items} categories={categories} />
        
      </Container>

      <WaveDivider className="text-ink" />
    </section>
  );
}

import type { CSSProperties } from "react";
import { Container } from "@/components/ui/Container";
import { MenuBrowser } from "@/components/ui/MenuBrowser";
import { FlourSpill, WaterSpill, Whisk } from "@/components/ui/TableProps";
import { siteConfig } from "@/config/site";
import { dripMaskUrl } from "@/lib/drip";
import { getMenuCategories, getMenuItems } from "@/lib/menu";

// Tetesan "susu" dari section ini ke section Lokasi yang gelap di bawahnya
const MILK_DRIP = dripMaskUrl({ width: 460, height: 60, band: 4, seed: 7, count: 5 });

export function MenuCatalog() {
  const items = getMenuItems();
  const categories = getMenuCategories(items);

  return (
    <section id="menu" aria-labelledby="menu-title" className="relative z-10 bg-milk">
      {/* Latar sama dengan Hero: butiran 70% + dua cahaya karamel lembut. Cahaya tidak menyentuh tepi atas, supaya sambungan dengan Kisah Kami tak terlihat (satu meja) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden select-none">
        <div className="bg-grain absolute inset-0 opacity-70" />
        <div className="absolute top-[18%] -right-40 size-[40rem] rounded-full bg-[radial-gradient(closest-side,var(--color-caramel-100),transparent)]" />
        <div className="absolute top-[45%] -left-64 size-[36rem] rounded-full bg-[radial-gradient(closest-side,var(--color-caramel-50),transparent)]" />
      </div>
      {/* Air tumpah di samping judul, pengocok di atas tepung tumpah di samping kotak paket */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block">
        <WaterSpill className="top-44 left-[4%] w-52" />
        <FlourSpill className="bottom-[21rem] -left-20 hidden w-80 xl:block" />
        <Whisk className="bottom-[10rem] left-[3%] hidden w-28 -rotate-[28deg] xl:block" />
      </div>

      <Container className="relative flex flex-col gap-16 overflow-x-clip pt-28 pb-28 sm:gap-24 sm:pt-36 sm:pb-36">
        <header className="mx-auto flex max-w-3xl flex-col items-center text-center" data-reveal>
          <h2 id="menu-title" className="leading-[0.9] tracking-[-0.03em] text-espresso">
            <span className="text-[clamp(3rem,9vw,5.75rem)] font-black uppercase">Menu </span>
            <span className="font-wonky text-[clamp(3.4rem,10.5vw,6.5rem)] font-medium text-caramel-500 italic">
              Karamel
            </span>
          </h2>
        </header>

        <MenuBrowser items={items} categories={categories} instagram={siteConfig.social.instagram} />
      </Container>

      <div
        aria-hidden="true"
        className="drip-mask pointer-events-none absolute inset-x-0 top-full -mt-px h-10 bg-milk sm:h-14"
        style={{ "--drip-mask": MILK_DRIP, "--drip-tile": "460px" } as CSSProperties}
      />
    </section>
  );
}

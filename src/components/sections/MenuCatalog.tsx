import type { CSSProperties } from "react";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { MenuBrowser } from "@/components/ui/MenuBrowser";
import { siteConfig } from "@/config/site";
import { upcomingMenus } from "@/data/menu";
import { dripMaskUrl } from "@/lib/drip";
import { getMenuCategories, getMenuItems } from "@/lib/menu";

// Tetesan "susu" dari section ini ke section Lokasi yang gelap di bawahnya
const MILK_DRIP = dripMaskUrl({ width: 460, height: 60, band: 4, seed: 7, count: 5 });

export function MenuCatalog() {
  const items = getMenuItems();
  const categories = getMenuCategories(items);

  return (
    <section id="menu" aria-labelledby="menu-title" className="relative z-10 bg-milk">
      <div aria-hidden="true" className="bg-grain pointer-events-none absolute inset-0 opacity-50" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 h-[28rem] w-full max-w-5xl -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,var(--color-caramel-100),transparent)] opacity-70"
      />

      <Container className="relative flex flex-col gap-16 overflow-x-clip pt-28 pb-28 sm:gap-24 sm:pt-36 sm:pb-36">
        <header className="mx-auto flex max-w-3xl flex-col items-center text-center" data-reveal>
          <Eyebrow centered className="mb-6">
            Katalog kami
          </Eyebrow>
          <h2 id="menu-title" className="leading-[0.9] tracking-[-0.03em] text-espresso">
            <span className="text-[clamp(3rem,9vw,5.75rem)] font-black uppercase">Menu </span>
            <span className="font-wonky text-[clamp(3.4rem,10.5vw,6.5rem)] font-medium text-caramel-500 italic">
              Karamel
            </span>
          </h2>
          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-ink-muted sm:text-xl">
            Puding sutra yang dibuat fresh setiap hari. Pilih favoritmu, buka detailnya, lalu tekan{" "}
            <strong className="font-bold text-espresso">Pesan</strong>: WhatsApp langsung terbuka dengan pesananmu.
          </p>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-caramel-50 px-4 py-2 text-sm font-semibold text-caramel-700 ring-1 ring-caramel-200">
            <WhatsAppIcon className="size-4" />
            Tanpa daftar akun, cukup chat WhatsApp
          </p>
        </header>

        <MenuBrowser items={items} categories={categories} upcoming={upcomingMenus} instagram={siteConfig.social.instagram} />
      </Container>

      <div
        aria-hidden="true"
        className="drip-mask pointer-events-none absolute inset-x-0 top-full -mt-px h-10 bg-milk sm:h-14"
        style={{ "--drip-mask": MILK_DRIP, "--drip-tile": "460px" } as CSSProperties}
      />
    </section>
  );
}

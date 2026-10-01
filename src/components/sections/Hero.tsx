import { HeroOrderButton, HeroPudding, HeroVariantTabs } from "@/components/sections/HeroPudding";
import { HERO_VARIANTS, VARIANT_INFO, type HeroVariantItem } from "@/components/three/variants";
import { ButtonLink } from "@/components/ui/Button";
import { Eyebrow, EyebrowMark } from "@/components/ui/Eyebrow";
import { ArrowDownIcon } from "@/components/ui/Icons";
import { getMenuItems } from "@/lib/menu";
import { whatsappItemLink } from "@/lib/whatsapp";

/*
 * Hero editorial: "LEMBUT Lumer — [puding 3D] — BIKIN Nagih".
 * Teks besar hanya visual (aria-hidden); judul untuk pembaca layar & mesin pencari ada di <h1> tersembunyi.
 * Ukuran puding & huruf mengikuti tinggi layar (svh), jadi tombol tetap terlihat di laptop 1280×720.
 */

const WORD = "block font-display font-black leading-[0.82] tracking-[-0.035em] text-espresso uppercase";
const ACCENT =
  "block font-display font-wonky font-medium italic leading-[0.9] tracking-[-0.02em] text-caramel-500 normal-case";

/** Satu entri per varian puding (Klasik, Regal, Popcorn): nama, catatan & link pesan dari data menu. */
function getHeroItems(): HeroVariantItem[] {
  const menu = getMenuItems();
  return HERO_VARIANTS.flatMap((variant) => {
    const { menuId, short, alt } = VARIANT_INFO[variant];
    const item = menu.find((entry) => entry.id === menuId);
    return item
      ? [{ variant, short, alt, name: item.name, note: item.note, orderHref: whatsappItemLink(item) }]
      : [];
  });
}

export function Hero() {
  const heroItems = getHeroItems();

  return (
    <section id="home" aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-milk">
      <h1 id="hero-title" className="sr-only">
        Loka Pudding: puding karamel homemade yang lembut, lumer, dan bikin nagih
      </h1>

      <HeroBackdrop />

      <div className="relative mx-auto flex min-h-svh w-full max-w-[90rem] flex-col px-4 pt-[calc(var(--nav-h)+0.75rem)] pb-10 sm:px-8 lg:px-14 lg:pt-[calc(var(--nav-h)+0.25rem)] lg:pb-12">
        {/* Baris utama: teks kiri, puding, teks kanan */}
        <div className="relative grid flex-1 grid-cols-1 items-center lg:grid-cols-[1fr_auto_1fr]">
          <p
            aria-hidden="true"
            className="relative z-20 -mb-[clamp(1.5rem,6svh,3rem)] animate-rise text-center mix-blend-multiply lg:mb-0 lg:-mr-[4.5vw] lg:text-left"
          >
            <span className="mb-4 hidden items-center gap-2.5 text-xs font-bold tracking-[0.22em] text-caramel-700 uppercase lg:flex">
              <EyebrowMark className="text-caramel-500" />
              Signature dish
            </span>
            <span className={`${WORD} text-[clamp(3.1rem,15vw,4.6rem)] lg:text-[clamp(4.25rem,min(7.2vw,13svh),7.5rem)]`}>
              Lembut
            </span>
            <span className={`${ACCENT} text-[clamp(3.5rem,17vw,5.25rem)] lg:text-[clamp(4.75rem,min(8.2vw,15svh),8.5rem)]`}>
              Lumer
            </span>
          </p>

          {/* Puding 3D (atau ilustrasi): bisa digeser untuk melihat varian lain */}
          <div className="relative z-10 mx-auto w-[min(100%,25rem,44svh)] sm:w-[min(100%,30rem,48svh)] lg:w-[min(40vw,60svh,42rem)]">
            <HeroPudding items={heroItems} />
            <HeroVariantTabs
              items={heroItems}
              className="absolute top-full left-1/2 z-20 -mt-8 hidden -translate-x-1/2 animate-rise [animation-delay:650ms] lg:flex"
            />
          </div>

          <p
            aria-hidden="true"
            className="relative z-20 -mt-[clamp(1.5rem,6svh,3rem)] animate-rise text-center mix-blend-multiply [animation-delay:150ms] lg:mt-0 lg:-ml-[4.5vw] lg:text-right"
          >
            <span className={`${WORD} text-[clamp(3.1rem,15vw,4.6rem)] lg:text-[clamp(4.25rem,min(7.2vw,13svh),7.5rem)]`}>
              Bikin
            </span>
            <span className={`${ACCENT} text-[clamp(3.5rem,17vw,5.25rem)] lg:text-[clamp(4.75rem,min(8.2vw,15svh),8.5rem)]`}>
              <span className="relative inline-block">
                Nagih
                {/* Coretan toffee tepat di bawah kata */}
                <svg
                  viewBox="0 0 120 14"
                  preserveAspectRatio="none"
                  className="absolute inset-x-[4%] -bottom-[0.08em] h-[0.2em] w-[92%] overflow-visible"
                  focusable="false"
                >
                  <path
                    d="M3 9c12-7 22-7 30 0s18 7 28 0 18-7 28 0 18 7 28 0"
                    pathLength={1}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="7"
                    strokeLinecap="round"
                    className="animate-draw text-caramel-300 [animation-delay:0.9s] [stroke-dasharray:1] [stroke-dashoffset:1]"
                  />
                </svg>
              </span>
            </span>
            <span className="mt-5 hidden items-center justify-end gap-2.5 text-xs font-bold tracking-[0.22em] text-caramel-700 uppercase lg:flex">
              Resep keluarga
              <EyebrowMark className="text-caramel-500" />
            </span>
          </p>
        </div>

        {/* HP & tablet: pilihan varian di bawah judul (di desktop letaknya tepat di bawah puding) */}
        <HeroVariantTabs
          items={heroItems}
          className="relative z-20 mt-4 flex justify-center animate-rise [animation-delay:350ms] lg:hidden"
        />

        {/* Baris bawah: cerita singkat + tombol */}
        <div className="relative z-20 mt-5 flex flex-col items-center gap-6 text-center md:mt-8 md:flex-row md:items-end md:justify-between md:text-left lg:mt-4">
          <div className="flex max-w-md flex-col items-center gap-3 md:items-start">
            {/* Di HP disembunyikan: tempatnya dipakai pilihan varian di atas */}
            <div className="hidden animate-rise [animation-delay:350ms] md:block">
              <Eyebrow>Premium &amp; fresh</Eyebrow>
            </div>
            <p className="animate-rise text-[0.98rem] leading-relaxed text-ink-muted [animation-delay:450ms] sm:text-lg">
              Dibuat segar setiap pagi pakai susu asli dan saus karamel pilihan.
              <span className="hidden sm:inline"> Sekali suap, dijamin susah berhenti!</span>
            </p>
          </div>

          <div className="flex w-full animate-rise gap-3 [animation-delay:550ms] sm:w-auto">
            <ButtonLink href="#menu" variant="dark" size="lg" className="flex-1 sm:flex-none">
              Lihat Menu
              <ArrowDownIcon />
            </ButtonLink>
            {/* Hanya di HP & tablet: di desktop tombol Pesan sudah selalu ada di navbar */}
            <HeroOrderButton items={heroItems} className="flex-1 sm:flex-none lg:hidden" />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Latar: cahaya karamel lembut, butiran halus, kata "KARAMEL" bergaris luar, dan stiker berputar. */
function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 select-none">
      <div className="bg-grain absolute inset-0 opacity-70" />
      <div className="absolute -top-48 -right-40 size-[40rem] rounded-full bg-[radial-gradient(closest-side,var(--color-caramel-100),transparent)]" />
      <div className="absolute top-[45%] -left-64 size-[36rem] rounded-full bg-[radial-gradient(closest-side,var(--color-caramel-50),transparent)]" />
      <div className="absolute inset-x-0 top-[46%] hidden -translate-y-1/2 justify-center overflow-hidden lg:flex">
        <span className="text-outline font-display text-[21vw] leading-none font-black tracking-[-0.04em] whitespace-nowrap text-caramel-200 [--outline-width:1.5px]">
          KARAMEL
        </span>
      </div>

      {/* Tetesan karamel yang melayang */}
      <span className="absolute top-[24%] left-[7%] hidden size-7 animate-float rounded-[45%_55%_60%_40%] bg-gradient-to-br from-caramel-300 to-caramel-600 opacity-60 motion-reduce:animate-none lg:block" />
      <span className="absolute top-[70%] right-[12%] hidden size-10 animate-float rounded-[60%_40%_45%_55%] bg-gradient-to-br from-caramel-200 to-caramel-500 opacity-50 [animation-delay:-3s] motion-reduce:animate-none sm:block" />
      <span className="absolute bottom-[17%] left-[36%] hidden size-3 rounded-full bg-caramel-400/50 lg:block" />

      {/* Stiker berputar */}
      <div className="absolute top-[13%] right-[8%] hidden size-32 animate-spin-slow text-caramel-600 motion-reduce:animate-none lg:block xl:right-[11%]">
        <svg viewBox="0 0 100 100" className="size-full" focusable="false">
          <path id="hero-badge-circle" d="M50 50m-37 0a37 37 0 1 1 74 0a37 37 0 1 1-74 0" fill="none" />
          {/* textLength = keliling lingkaran (2π·37): huruf diberi jarak otomatis agar pas satu putaran */}
          <text className="fill-current text-[9.5px] font-bold uppercase">
            <textPath href="#hero-badge-circle" textLength="230" lengthAdjust="spacing">
              100% homemade • dibuat tiap pagi •
            </textPath>
          </text>
          <path d="M50 38l3.2 8.8L62 50l-8.8 3.2L50 62l-3.2-8.8L38 50l8.8-3.2z" className="fill-caramel-400" />
        </svg>
      </div>
    </div>
  );
}

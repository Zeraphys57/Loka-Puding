"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ComponentType, type SVGProps } from "react";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { HandNote } from "@/components/ui/HandNote";
import { HomeHeartIcon, MilkIcon, SparkleIcon, StoreIcon } from "@/components/ui/Icons";
import { cn } from "@/lib/cn";

type Value = {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  text: string;
  image: string;
  alt: string;
};

const values: Value[] = [
  {
    icon: MilkIcon,
    title: "Bahan Premium",
    text: "Susu sapi segar dan gula karamel murni pilihan. Rasanya jujur, kaya, dan tanpa perisa buatan.",
    image: "/images/about/bahan-premium-v2.jpg",
    alt: "Saus karamel mengalir dari sendok kayu ke mangkuk, di samping botol susu segar, gula aren, dan vanila",
  },
  {
    icon: HomeHeartIcon,
    title: "Dibuat Tiap Pagi",
    text: "Dimasak setiap subuh dalam batch kecil, puding selalu dalam kondisi paling segar saat sampai ke tanganmu.",
    image: "/images/about/dibuat-pagi.jpg",
    alt: "Meja dapur kayu diterangi cahaya pagi dari jendela, dengan toples saus karamel dan cangkir",
  },
  {
    icon: SparkleIcon,
    title: "Tekstur Sempurna",
    text: "Goyangan super kenyal, padat namun langsung lumer dan meleleh manis di suapan pertama.",
    image: "/images/about/tekstur-sempurna.jpg",
    alt: "Close-up puding karamel mengilap dengan saus karamel yang meleleh di piring keramik",
  },
  {
    icon: StoreIcon,
    title: "Resep Autentik",
    text: "Murni dari dapur rumahan, dikembangkan perlahan hingga menemukan keseimbangan manis yang mutlak pas.",
    image: "/images/about/resep-autentik.jpg",
    alt: "Buku resep tulisan tangan terbuka di meja dapur, ditemani secangkir teh dan lilin",
  },
];

export function About() {
  const [active, setActive] = useState(0);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  // Desktop: poin yang melewati tengah layar menjadi aktif (fotonya ikut berganti)
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    let observer: IntersectionObserver | null = null;
    const setup = () => {
      observer?.disconnect();
      observer = null;
      if (!desktop.matches) return;
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index));
          }
        },
        { rootMargin: "-46% 0px -46% 0px" },
      );
      for (const item of itemRefs.current) if (item) observer.observe(item);
    };
    setup();
    desktop.addEventListener("change", setup);
    return () => {
      observer?.disconnect();
      desktop.removeEventListener("change", setup);
    };
  }, []);

  return (
    <section id="tentang" aria-labelledby="tentang-title" className="relative overflow-x-clip bg-milk-50">
      <div aria-hidden="true" className="bg-grain pointer-events-none absolute inset-0 opacity-50" />
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 -right-40 size-[34rem] rounded-full bg-[radial-gradient(closest-side,var(--color-caramel-50),transparent)]" />

      {/* Judul */}
      <Container className="relative pt-28 pb-12 sm:pt-36 lg:pb-16">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div data-reveal>
            <Eyebrow className="mb-6">Kisah kami</Eyebrow>
            <h2 id="tentang-title" className="leading-[0.9] tracking-[-0.03em] text-espresso">
              <span className="block text-[clamp(3rem,9vw,6rem)] font-black uppercase">Dari dapur</span>
              <span className="font-wonky block text-[clamp(3.5rem,11vw,7.25rem)] font-medium text-caramel-500 italic">
                rumahan
              </span>
            </h2>
          </div>
          <div data-reveal className="relative lg:max-w-sm lg:pb-5">
            <p className="border-l-2 border-caramel-300 pl-5 text-lg leading-relaxed text-ink-muted sm:text-xl">
              Berawal dari resep andalan keluarga yang selalu ludes setiap kumpul acara, kini kami bagikan
              kebahagiaan manis ini langsung ke piringmu.
            </p>
            <HandNote arrow="up-left" arrowSide="start" className="mt-3 ml-6 -rotate-3 text-[1.5rem] sm:ml-10">
              dibuat pakai hati ♡
            </HandNote>
          </div>
        </div>
      </Container>

      <Container className="relative grid gap-10 pb-28 sm:pb-36 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 xl:gap-24">
        {/* Desktop: bingkai foto lengket yang berganti sesuai poin aktif */}
        <div className="hidden lg:block">
          <div className="sticky top-[max(6.5rem,calc(50svh-19rem))] h-[min(38rem,calc(100svh-9rem))]">
            <div className="relative size-full overflow-hidden rounded-[2.75rem] bg-custard shadow-card ring-8 ring-white">
              {values.map((value, index) => (
                <Image
                  key={value.image}
                  src={value.image}
                  alt={index === active ? value.alt : ""}
                  aria-hidden={index === active ? undefined : true}
                  fill
                  sizes="(min-width: 1280px) 34rem, 42vw"
                  className={cn(
                    "object-cover transition-[opacity,scale] duration-1000 ease-silk",
                    index === active ? "scale-100 opacity-100" : "scale-105 opacity-0",
                  )}
                />
              ))}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-espresso/45 via-transparent to-transparent" />
              <p className="absolute bottom-5 left-5 flex items-center gap-3 rounded-full bg-milk-50/90 py-2 pr-5 pl-2 text-sm font-bold text-espresso shadow-sticker backdrop-blur-md">
                <span className="grid size-8 place-items-center rounded-full bg-caramel-600 font-display text-white italic">
                  {active + 1}
                </span>
                {values[active].title}
              </p>
            </div>
          </div>
        </div>

        {/* Daftar nilai: selalu terbaca (tidak bergantung hover) */}
        <ol className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:flex lg:flex-col lg:gap-0">
          {values.map(({ title, text, icon: Icon, image, alt }, index) => {
            const isActive = index === active;
            return (
              <li
                key={title}
                ref={(element) => {
                  itemRefs.current[index] = element;
                }}
                data-index={index}
                data-reveal
                onMouseEnter={() => setActive(index)}
                className="group/item relative flex lg:min-h-[max(15rem,34svh)] lg:items-center lg:border-b lg:border-sand lg:first:border-t"
              >
                {/* Sapuan karamel di poin aktif (desktop) */}
                <div
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-0 hidden origin-bottom overflow-hidden rounded-[2rem] bg-gradient-to-br from-caramel-600 to-caramel-700 transition-[scale,opacity] duration-700 ease-silk lg:block",
                    isActive ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0",
                  )}
                >
                  <span className="font-wonky absolute -right-6 -bottom-10 font-display text-[11rem] leading-none font-black text-white/[0.07] italic">
                    0{index + 1}
                  </span>
                </div>

                <article
                  className={cn(
                    "relative w-full overflow-hidden rounded-[2rem] bg-white shadow-card ring-1 ring-sand/70 lg:rounded-none lg:bg-transparent lg:px-8 lg:py-10 lg:shadow-none lg:ring-0 xl:px-10",
                  )}
                >
                  {/* Mobile & tablet: foto di atas setiap kartu */}
                  <div className="relative aspect-[16/10] lg:hidden">
                    <Image src={image} alt={alt} fill sizes="(min-width: 640px) 90vw, 100vw" className="object-cover" />
                    <span className="absolute top-4 left-4 grid size-11 place-items-center rounded-full bg-milk-50/90 font-display text-lg font-bold text-caramel-700 italic shadow-sticker backdrop-blur">
                      0{index + 1}
                    </span>
                  </div>

                  <div className="flex items-start gap-5 p-6 sm:p-8 lg:p-0">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "font-wonky hidden w-16 shrink-0 pt-1 font-display text-5xl leading-none font-medium italic transition-colors duration-700 lg:block",
                        isActive ? "text-caramel-200" : "text-caramel-400",
                      )}
                    >
                      0{index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3
                        className={cn(
                          "text-[1.65rem] leading-tight font-black tracking-tight uppercase transition-colors duration-700 sm:text-3xl xl:text-[2.4rem]",
                          isActive ? "lg:text-white" : "text-espresso",
                        )}
                      >
                        {title}
                      </h3>
                      <p
                        className={cn(
                          "mt-3 max-w-xl leading-relaxed text-ink-muted transition-colors duration-700 sm:text-lg",
                          isActive && "lg:text-caramel-50",
                        )}
                      >
                        {text}
                      </p>
                    </div>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "grid size-12 shrink-0 place-items-center rounded-full ring-1 transition-all duration-700 ease-silk sm:size-14",
                        isActive
                          ? "bg-caramel-100 text-caramel-700 ring-transparent lg:-rotate-12 lg:bg-white lg:shadow-sticker"
                          : "bg-caramel-50 text-caramel-600 ring-sand",
                      )}
                    >
                      <Icon className="size-6 sm:size-7" />
                    </span>
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      </Container>
    </section>
  );
}

"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode, type Ref } from "react";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { GoyangMeter } from "@/components/ui/GoyangMeter";
import { HandNote } from "@/components/ui/HandNote";
import { ArrowDownIcon } from "@/components/ui/Icons";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/cn";
import { gsap, useGSAP } from "@/lib/gsap";

/*
 * Kisah Kami = penampang satu gelas puding Loka yang diperbesar.
 * Pengunjung menggulir menembus lapisannya persis seperti di foto produk:
 * karamel → susu → dasar gelas → piring keramik → taplak meja.
 * Tiap lapisan membawa satu bagian cerita. Semua teks tetap teks biasa (terbaca pembaca layar
 * & mesin pencari); hiasan (dinding gelas, gelembung, piring) disembunyikan dengan aria-hidden.
 * Warnanya memakai warna produk (pudding-*), jadi lapisan puding tetap karamel di palet mana pun.
 */

type Layer = "karamel" | "susu" | "gelas" | "meja";

// Penanda "kamu di …" (desktop lebar) dan warnanya di tiap lapisan
const LAYERS: Record<Layer, { label: string; tag: string }> = {
  karamel: { label: "lapisan karamel", tag: "bg-pudding-cream text-pudding-caramel-800" },
  susu: { label: "lapisan susu", tag: "bg-pudding-caramel-700 text-pudding-cream" },
  gelas: { label: "dasar gelas", tag: "bg-white text-pudding-ink" },
  meja: { label: "atas meja", tag: "bg-caramel-600 text-white" },
};

type Chapter = {
  no: string;
  title: string;
  text: string;
  facts: string[];
  image: string;
  alt: string;
};

const BAHAN: Chapter = {
  no: "01",
  title: "Bahan premium",
  text: "Susu sapi segar dan gula karamel murni pilihan. Rasanya jujur, kaya, dan tanpa perisa buatan.",
  facts: ["Susu sapi segar", "Gula karamel murni", "Tanpa perisa buatan"],
  image: "/images/about/bahan-premium-v2.jpg",
  alt: "Saus karamel mengalir dari sendok kayu ke mangkuk, di samping botol susu segar, gula aren, dan vanila",
};

const PAGI: Chapter = {
  no: "02",
  title: "Dibuat tiap pagi",
  text: "Dimasak setiap subuh dalam batch kecil, jadi puding selalu dalam kondisi paling segar saat sampai ke tanganmu.",
  facts: ["Dimasak tiap subuh", "Batch kecil"],
  image: "/images/about/dibuat-pagi.jpg",
  alt: "Meja dapur kayu diterangi cahaya pagi dari jendela, dengan toples saus karamel dan cangkir",
};

const TEKSTUR: Chapter = {
  no: "03",
  title: "Tekstur sempurna",
  text: "Goyangan super kenyal, padat namun langsung lumer dan meleleh manis di suapan pertama.",
  facts: ["Kenyal", "Lumer di suapan pertama"],
  image: "/images/about/tekstur-sempurna.jpg",
  alt: "Close-up puding karamel mengilap dengan saus karamel yang meleleh di piring keramik",
};

const RESEP = {
  no: "04",
  title: "Resep autentik",
  text: "Murni dari dapur rumahan, dikembangkan perlahan hingga menemukan keseimbangan manis yang mutlak pas.",
  image: "/images/about/resep-autentik-v2.jpg",
  alt: "Buku resep tulisan tangan terbuka di meja dapur kayu tua, ditemani secangkir teh dan lilin menyala dengan latar cahaya pagi",
};

// Gelembung udara kecil yang terperangkap di puding: [kiri, atas, ukuran (px), jeda animasi (s)]
type Bubble = [left: string, top: string, size: number, delay: number];

const CARAMEL_BUBBLES: Bubble[] = [
  ["5%", "20%", 15, 0],
  ["13%", "63%", 9, -3],
  ["41%", "9%", 7, -6],
  ["55%", "80%", 12, -1.5],
  ["47%", "38%", 9, -4],
  ["89%", "57%", 17, -7],
  ["94%", "16%", 8, -2],
];

const MILK_BUBBLES: Bubble[] = [
  ["7%", "12%", 11, -1],
  ["18%", "47%", 7, -5],
  ["46%", "30%", 14, -2.5],
  ["52%", "72%", 8, -6],
  ["81%", "18%", 9, -3.5],
  ["92%", "44%", 16, 0],
  ["86%", "86%", 10, -7],
];

export function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const [layer, setLayer] = useState<Layer>("karamel");

  // Lapisan yang melewati garis tengah layar = lapisan tempat pengunjung "berada"
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setLayer((entry.target as HTMLElement).dataset.layer as Layer);
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    section.querySelectorAll("[data-layer]").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  // Foto-foto melayang dengan kecepatan berbeda, seperti gelembung yang tersuspensi di puding
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>("[data-float]").forEach((element) => {
          const distance = Number(element.dataset.float) * 70;
          gsap.fromTo(
            element,
            { y: distance },
            {
              y: -distance,
              ease: "none",
              scrollTrigger: { trigger: element, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        });
      });
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      id="tentang"
      aria-labelledby="tentang-title"
      className="relative isolate overflow-x-clip bg-milk"
    >
      <DepthTag layer={layer} />

      {/* Gelas: dindingnya membingkai lapisan puding sampai dasar gelas */}
      <div className="relative">
        <GlassWall side="left" />
        <GlassWall side="right" />

        {/* Udara di bawah bibir gelas */}
        <div aria-hidden="true" className="bg-grain h-10 opacity-70 sm:h-14" />
        <CaramelSurface />

        {/* 1 · Lapisan karamel */}
        <div
          data-layer="karamel"
          data-nav-tone="caramel"
          className="relative -mt-px bg-[linear-gradient(180deg,var(--color-pudding-caramel-500),var(--color-pudding-caramel-600)_4rem,#8c4d1c_62%,var(--color-pudding-caramel-700)_88%,var(--color-pudding-caramel-800))] text-pudding-cream"
        >
          <Bubbles items={CARAMEL_BUBBLES} className="bg-pudding-caramel-300/15 ring-1 ring-pudding-cream/25" />
          <Ticks className="bg-[repeating-linear-gradient(180deg,transparent_0_23px,rgb(255_243_224/0.35)_23px_24px)]" />

          <Container className="relative pt-12 pb-24 sm:pt-16 sm:pb-32 lg:pb-40">
            <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-10">
              <div className="lg:col-span-7" data-reveal>
                <Eyebrow tone="caramel" className="mb-6">
                  Kisah kami
                </Eyebrow>
                <h2 id="tentang-title" className="leading-[0.86] tracking-[-0.035em]">
                  <span className="block text-[clamp(3.1rem,10.5vw,7.25rem)] font-black uppercase">Lapis demi</span>
                  <span className="font-wonky block text-[clamp(3.7rem,12.5vw,8.5rem)] font-medium text-pudding-caramel-200 italic">
                    lapis.
                  </span>
                </h2>
              </div>
              <div className="relative lg:col-span-5 lg:pb-3" data-reveal>
                <p className="text-lg leading-relaxed sm:text-xl">
                  Berawal dari resep andalan keluarga yang selalu ludes setiap kumpul acara. Kini, dari dapur rumahan
                  kami, kebahagiaan manis itu kami bagikan langsung ke piringmu.
                </p>
                <HandNote
                  arrow="up-left"
                  arrowSide="start"
                  className="mt-4 ml-2 -rotate-3 text-[1.6rem] text-pudding-caramel-200 sm:ml-8"
                >
                  dibuat dengan penuh hati ♡
                </HandNote>
              </div>
            </div>

            {/* Bab 01 */}
            <article
              aria-labelledby={`kisah-${BAHAN.no}`}
              className="mt-28 grid items-center gap-12 sm:mt-36 lg:grid-cols-12 lg:gap-10"
            >
              <div className="lg:col-span-5" data-float="0.5">
                <PhotoBubble
                  chapter={BAHAN}
                  tone="caramel"
                  sizes="(min-width: 1024px) 27rem, 80vw"
                  className="mx-auto w-[min(80vw,23rem)] lg:w-full lg:max-w-[27rem]"
                />
              </div>
              <div className="lg:col-span-6 lg:col-start-7" data-reveal>
                <ChapterBody chapter={BAHAN} tone="caramel" />
              </div>
            </article>
          </Container>
        </div>

        <LayerSeam />

        {/* 2 · Lapisan susu */}
        <div
          data-layer="susu"
          className="relative bg-[linear-gradient(180deg,var(--color-pudding-milk),#f3e8d4_55%,var(--color-pudding-milk-deep))] text-pudding-ink"
        >
          {/* Karamel sedikit meresap ke susu tepat di bawah batasnya */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[rgb(176_105_44/0.14)] to-transparent" />
          <Bubbles
            items={MILK_BUBBLES}
            className="bg-white/70 shadow-[inset_-2px_-3px_5px_rgb(107_84_67/0.14)] ring-1 ring-white"
          />
          <Ticks className="bg-[repeating-linear-gradient(180deg,transparent_0_23px,rgb(122_64_22/0.22)_23px_24px)]" />

          <Container className="relative grid gap-24 pt-20 pb-28 sm:pt-28 md:grid-cols-2 md:gap-x-10 lg:gap-x-20 lg:pb-36">
            <article aria-labelledby={`kisah-${PAGI.no}`}>
              <div data-float="0.8">
                <PhotoBubble
                  chapter={PAGI}
                  tone="milk"
                  sizes="(min-width: 1024px) 26rem, (min-width: 768px) 42vw, 80vw"
                  className="mx-auto w-[min(80vw,26rem)] md:mx-0 md:w-full md:max-w-[26rem]"
                />
              </div>
              <div className="mt-12" data-reveal>
                <ChapterBody chapter={PAGI} tone="milk" />
              </div>
            </article>

            <article aria-labelledby={`kisah-${TEKSTUR.no}`} className="md:mt-56">
              <div data-float="0.35">
                <TextureShowcase />
              </div>
              <div className="mt-12" data-reveal>
                <ChapterBody chapter={TEKSTUR} tone="milk" />
              </div>
            </article>
          </Container>
        </div>

        {/* 3 · Dasar gelas */}
        <GlassBase />
      </div>

      <Saucer />

      {/* 4 · Taplak meja + kartu resep keluarga */}
      <div data-layer="meja" className="relative">
        {/* Butiran halus sama seperti section Menu di bawahnya, supaya sambungannya tidak terlihat */}
        <div aria-hidden="true" className="bg-grain pointer-events-none absolute inset-0 opacity-50" />
        <div
          aria-hidden="true"
          className="bg-gingham absolute inset-0 [--gingham-base:var(--color-milk-50)] [--gingham-size:36px] [mask-image:linear-gradient(to_bottom,black_55%,transparent)]"
        />
        <Container className="relative flex flex-col items-center pt-20 pb-12 sm:pt-28 sm:pb-16">
          <RecipeCard />
          <a
            href="#menu"
            className="group mt-16 inline-flex items-center gap-2 rounded-full px-3 py-1 font-hand text-[1.8rem] leading-none text-caramel-700 transition-colors hover:text-caramel-800 sm:mt-20 sm:text-[2.1rem]"
          >
            sekarang, pilih favoritmu
            <ArrowDownIcon className="size-6 transition-transform duration-500 ease-jelly group-hover:translate-y-1" />
          </a>
        </Container>
      </div>
    </section>
  );
}

/** Penunjuk kedalaman yang menempel di sisi kiri (desktop lebar): "kamu di lapisan …". */
function DepthTag({ layer }: { layer: Layer }) {
  const { label, tag } = LAYERS[layer];
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-6 z-30 hidden xl:block">
      <div className="sticky top-[calc(50svh-5.5rem)] pt-28">
        <span
          className={cn(
            "flex rotate-180 items-center gap-2.5 rounded-full px-2.5 py-4 text-[0.68rem] font-bold tracking-[0.2em] whitespace-nowrap uppercase shadow-[0_10px_24px_-12px_rgb(43_26_16/0.6)] transition-colors duration-500 [writing-mode:vertical-rl]",
            tag,
          )}
        >
          <span className="size-1.5 shrink-0 rounded-full bg-current" />
          kamu di {label}
        </span>
      </div>
    </div>
  );
}

/** Dinding kaca tipis di tepi layar, dari bibir gelas sampai dasarnya. */
function GlassWall({ side }: { side: "left" | "right" }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-y-0 z-20 w-2 rounded-t-full bg-[linear-gradient(90deg,rgb(255_255_255/0.92),rgb(222_234_245/0.6)_45%,rgb(255_255_255/0.85))] ring-1 ring-[rgb(110_130_160/0.25)] sm:w-3 xl:w-4",
        side === "left" ? "left-0" : "right-0",
      )}
    >
      <span className={cn("absolute inset-y-8 w-px bg-white", side === "left" ? "left-[35%]" : "right-[35%]")} />
    </div>
  );
}

/** Garis takaran di dinding kiri, seperti gelas ukur. */
function Ticks({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-y-0 left-3 hidden w-2 lg:block xl:left-4 xl:w-3", className)}
    />
  );
}

/** Permukaan karamel: rata di tengah, sedikit naik di dekat dinding gelas (meniskus), dengan kilau. */
function CaramelSurface() {
  return (
    <div aria-hidden="true" className="relative h-8 sm:h-12">
      <svg viewBox="0 0 1440 48" preserveAspectRatio="none" focusable="false" className="absolute inset-0 size-full">
        <defs>
          <linearGradient id="kisah-surface" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#cf8a45" />
            <stop offset="1" stopColor="#b0692c" />
          </linearGradient>
        </defs>
        <path d="M0 0C14 20 46 30 120 32H1320C1394 30 1426 20 1440 0V48H0Z" fill="url(#kisah-surface)" />
      </svg>
      <span className="absolute inset-x-[10%] bottom-[16%] h-[3px] rounded-full bg-gradient-to-r from-transparent via-[rgb(255_236_205/0.65)] to-transparent" />
    </div>
  );
}

/** Batas karamel → susu: pita karamel tergelap dengan tepi sedikit bergelombang. */
function LayerSeam() {
  return (
    <div aria-hidden="true" data-nav-tone="caramel" className="relative h-5 bg-pudding-milk sm:h-7">
      <svg viewBox="0 0 1440 28" preserveAspectRatio="none" focusable="false" className="absolute inset-0 size-full">
        <path
          d="M0 0H1440V9C1300 17 1180 22 1040 16S760 6 620 13 340 24 200 17 60 7 0 11Z"
          className="fill-pudding-caramel-800"
        />
      </svg>
    </div>
  );
}

/** Dasar gelas yang tebal, dengan kilau kaca. */
function GlassBase() {
  return (
    <div
      data-layer="gelas"
      aria-hidden="true"
      className="relative h-11 overflow-hidden bg-[linear-gradient(180deg,#d3e0ec,#eef4f9_42%,#dce7f1_80%,#c9d8e6)] sm:h-16"
    >
      <span className="absolute inset-x-0 top-0 h-3 bg-gradient-to-b from-[rgb(122_90_50/0.28)] to-transparent" />
      <span className="absolute top-[38%] left-[7%] h-[3px] w-[26%] rounded-full bg-white/90" />
      <span className="absolute top-[60%] left-[37%] h-0.5 w-[10%] rounded-full bg-white/70" />
      <span className="absolute top-[42%] right-[9%] h-[3px] w-[17%] rounded-full bg-white/80" />
    </div>
  );
}

/** Piring keramik berbintik tempat gelas berdiri. */
function Saucer() {
  return (
    <div
      data-layer="gelas"
      aria-hidden="true"
      className="bg-speckle relative z-10 h-9 shadow-[0_24px_32px_-20px_rgb(60_40_20/0.5)] sm:h-12"
    >
      <span className="absolute inset-x-0 top-0 h-px bg-white/70" />
      <span className="absolute inset-x-0 bottom-0 h-2.5 bg-gradient-to-t from-saucer-deep to-transparent" />
    </div>
  );
}

function Bubbles({ items, className }: { items: Bubble[]; className: string }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map(([left, top, size, delay]) => (
        <span
          key={`${left}-${top}`}
          className={cn("absolute animate-bubble rounded-full", className)}
          style={{ left, top, width: size, height: size, animationDelay: `${delay}s` }}
        />
      ))}
    </div>
  );
}

type Tone = "caramel" | "milk";

type PhotoBubbleProps = {
  chapter: Chapter;
  tone: Tone;
  sizes: string;
  className?: string;
  /** Lingkaran fotonya (mis. untuk digoyangkan) */
  photoRef?: Ref<HTMLDivElement>;
  /** Hiasan yang menempel di pinggir foto */
  children?: ReactNode;
};

/** Foto bundar seperti gelembung/lensa yang melayang di dalam lapisan. */
function PhotoBubble({ chapter, tone, sizes, className, photoRef, children }: PhotoBubbleProps) {
  return (
    <div className={cn("relative aspect-square", className)}>
      <div
        ref={photoRef}
        className={cn(
          "relative size-full overflow-hidden rounded-full shadow-[0_30px_60px_-26px_rgb(43_26_16/0.6)] ring-[6px]",
          tone === "caramel" ? "ring-pudding-cream/15" : "ring-white/90",
        )}
      >
        <Image src={chapter.image} alt={chapter.alt} fill sizes={sizes} className="object-cover" />
        {/* Kilau lensa */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_22%,rgb(255_255_255/0.32),transparent_40%)] shadow-[inset_0_-24px_48px_-18px_rgb(43_26_16/0.45)]"
        />
      </div>
      {children}
    </div>
  );
}

// Jarum goyang-meter: dari "cair", terayun lewat "keras", lalu mereda di "pas!" (derajat)
const NEEDLE_SWING = [-78, 38, -24, 14, -7, 3.5, -1.5, 0];
// Foto memendek-memanjang dari dasarnya seperti puding yang digoyang: [skala x, skala y]
const PHOTO_JELLY = [
  [1, 1],
  [1.07, 0.93],
  [0.95, 1.05],
  [1.025, 0.975],
  [0.99, 1.01],
  [1, 1],
];

/**
 * Bab 03 "Tekstur sempurna": foto yang benar-benar bergoyang (saat pertama terlihat, disentuh, atau disorot
 * mouse), ditemani goyang-meter yang jarumnya ikut terayun lalu berhenti di "pas!".
 */
function TextureShowcase() {
  const photoRef = useRef<HTMLDivElement>(null);
  const needleRef = useRef<SVGGElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const photo = photoRef.current;
    const needle = needleRef.current;
    if (!photo || !needle || reducedMotion) return;

    const wobble = () => {
      needle.getAnimations().forEach((animation) => animation.cancel());
      photo.getAnimations().forEach((animation) => animation.cancel());
      needle.animate(
        NEEDLE_SWING.map((deg) => ({ transform: `rotate(${deg}deg)`, easing: "ease-in-out" })),
        { duration: 1700 },
      );
      photo.animate(
        PHOTO_JELLY.map(([x, y]) => ({ transform: `scale(${x}, ${y})` })),
        { duration: 950, easing: "cubic-bezier(0.3, 0.7, 0.4, 1)" },
      );
    };

    // Sekali saat foto cukup terlihat, lalu setiap kali disentuh/disorot
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        wobble();
        observer.disconnect();
      },
      { threshold: 0.6 },
    );
    observer.observe(photo);
    const onEnter = (event: PointerEvent) => {
      if (event.pointerType === "mouse") wobble();
    };
    photo.addEventListener("pointerdown", wobble);
    photo.addEventListener("pointerenter", onEnter);
    return () => {
      observer.disconnect();
      photo.removeEventListener("pointerdown", wobble);
      photo.removeEventListener("pointerenter", onEnter);
    };
  }, [reducedMotion]);

  return (
    <PhotoBubble
      chapter={TEKSTUR}
      tone="milk"
      sizes="(min-width: 1024px) 26rem, (min-width: 768px) 42vw, 80vw"
      className="mx-auto w-[min(80vw,26rem)] md:mx-0 md:w-full md:max-w-[26rem]"
      photoRef={photoRef}
    >
      <GoyangMeter
        needleRef={needleRef}
        className="absolute -right-[7%] -bottom-[8%] z-10 rotate-[5deg] md:top-[2%] md:-right-[3%] md:bottom-auto xl:-right-[30%]"
      />
    </PhotoBubble>
  );
}

function ChapterBody({ chapter, tone }: { chapter: Chapter; tone: Tone }) {
  const onCaramel = tone === "caramel";
  return (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "text-outline block font-display text-[4.5rem] leading-[0.8] font-black [--outline-width:1.5px] sm:text-[5.5rem]",
          onCaramel ? "text-pudding-caramel-200" : "text-pudding-caramel-500",
        )}
      >
        {chapter.no}
      </span>
      <h3
        id={`kisah-${chapter.no}`}
        className="mt-4 text-[clamp(2.1rem,5vw,3.5rem)] leading-[0.95] font-black tracking-[-0.02em] uppercase"
      >
        {chapter.title}
      </h3>
      <p className={cn("mt-4 max-w-md text-lg leading-relaxed sm:text-xl", onCaramel ? "text-pudding-cream" : "text-pudding-ink-muted")}>
        {chapter.text}
      </p>
      <ul className="mt-6 flex flex-wrap gap-2">
        {chapter.facts.map((fact) => (
          <li
            key={fact}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-bold tracking-[0.12em] uppercase ring-1",
              onCaramel
                ? "bg-pudding-caramel-900/35 text-pudding-cream ring-pudding-cream/20"
                : "bg-white/75 text-pudding-caramel-700 ring-pudding-caramel-700/15",
            )}
          >
            {fact}
          </li>
        ))}
      </ul>
    </>
  );
}

/** Bab terakhir: kartu resep keluarga di atas taplak, dengan foto polaroid berselotip. */
function RecipeCard() {
  return (
    <div className="relative w-full max-w-[46rem]">
      <figure
        data-reveal="pop"
        className="relative z-10 mx-auto -mb-10 w-[min(70vw,15rem)] rotate-[4deg] bg-white p-2.5 pb-12 shadow-[0_24px_50px_-24px_rgb(43_26_16/0.55)] sm:absolute sm:-top-16 sm:-right-6 sm:mb-0 sm:w-60 lg:-right-24"
      >
        <div className="relative aspect-[4/3.4] overflow-hidden bg-custard">
          <Image src={RESEP.image} alt={RESEP.alt} fill sizes="15rem" className="object-cover" />
        </div>
        <figcaption className="absolute inset-x-0 bottom-3 text-center font-hand text-[1.35rem] leading-none text-pudding-ink">
          buku resep keluarga
        </figcaption>
        <span aria-hidden="true" className="absolute -top-3 left-1/2 h-7 w-24 -translate-x-1/2 -rotate-3 bg-caramel-200/75 shadow-sm" />
      </figure>

      <article
        aria-labelledby={`kisah-${RESEP.no}`}
        data-reveal
        className="relative -rotate-1 rounded-[1.75rem] bg-[#fffdf8] px-6 pt-16 pb-10 text-pudding-ink shadow-[0_30px_60px_-30px_rgb(43_26_16/0.5)] ring-1 ring-black/5 [background-image:repeating-linear-gradient(180deg,transparent_0_2.25rem,color-mix(in_srgb,var(--color-caramel-300)_40%,transparent)_2.25rem_calc(2.25rem+1px))] [background-position:0_5rem] sm:px-12 sm:pt-12 sm:pb-12"
      >
        <div className="sm:pr-52 lg:pr-24">
          <p className="flex items-center gap-3 text-xs font-bold tracking-[0.22em] text-pudding-caramel-700 uppercase">
            <span
              aria-hidden="true"
              className="text-outline font-display text-4xl leading-none tracking-normal text-pudding-caramel-500 [--outline-width:1.2px]"
            >
              {RESEP.no}
            </span>
            Resep keluarga
          </p>
          <h3
            id={`kisah-${RESEP.no}`}
            className="mt-5 text-[clamp(2.1rem,5vw,3.5rem)] leading-[0.95] font-black tracking-[-0.02em] uppercase"
          >
            {RESEP.title}
          </h3>
        </div>
        <p className="mt-4 max-w-lg text-lg leading-relaxed text-pudding-ink-muted sm:text-xl">{RESEP.text}</p>
        <p className="mt-8 -rotate-2 font-hand text-[1.9rem] leading-none text-pudding-caramel-700">salam manis, Dapur Loka ♡</p>
      </article>
    </div>
  );
}

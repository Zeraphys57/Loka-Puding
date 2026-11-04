import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { HandNote } from "@/components/ui/HandNote";
import { ArrowDownIcon } from "@/components/ui/Icons";
import { cn } from "@/lib/cn";

/*
 * Kisah Kami = buku resep keluarga yang terbuka di atas taplak kotak-kotak.
 * Tiap bab satu halaman kertas bergaris dengan foto polaroid berselotip.
 * Semua warnanya token palet (caramel-*, milk, ink), jadi ikut palet aktif di src/config/theme.ts.
 */

type Chapter = {
  no: string;
  title: string;
  text: string;
  image: string;
  alt: string;
  /** Tulisan tangan di bawah foto polaroid */
  caption: string;
  facts?: string[];
  signoff?: string;
};

const CHAPTERS: Chapter[] = [
  {
    no: "01",
    title: "Bahan premium",
    text: "Susu sapi segar dan gula karamel murni pilihan. Rasanya jujur, kaya, dan tanpa perisa buatan.",
    image: "/images/about/bahan-premium-v2.jpg",
    alt: "Saus karamel mengalir dari sendok kayu ke mangkuk, di samping botol susu segar, gula aren, dan vanila",
    caption: "bahan pilihan",
    facts: ["Susu sapi segar", "Gula karamel murni", "Tanpa perisa buatan"],
  },
  {
    no: "02",
    title: "Dibuat tiap pagi",
    text: "Dimasak setiap subuh dalam batch kecil, jadi puding selalu dalam kondisi paling segar saat sampai ke tanganmu.",
    image: "/images/about/dibuat-pagi.jpg",
    alt: "Meja dapur kayu diterangi cahaya pagi dari jendela, dengan toples saus karamel dan cangkir",
    caption: "subuh di dapur",
    facts: ["Dimasak tiap subuh", "Batch kecil"],
  },
  {
    no: "03",
    title: "Tekstur sempurna",
    text: "Goyangan super kenyal, padat namun langsung lumer dan meleleh manis di suapan pertama.",
    image: "/images/about/tekstur-sempurna.jpg",
    alt: "Close-up puding karamel mengilap dengan saus karamel yang meleleh di piring keramik",
    caption: "kenyal & lumer",
    facts: ["Kenyal", "Lumer di suapan pertama"],
  },
  {
    no: "04",
    title: "Resep autentik",
    text: "Murni dari dapur rumahan, dikembangkan perlahan hingga menemukan keseimbangan manis yang mutlak pas.",
    image: "/images/about/resep-autentik-v2.jpg",
    alt: "Buku resep tulisan tangan terbuka di meja dapur kayu tua, ditemani secangkir teh dan lilin menyala dengan latar cahaya pagi",
    caption: "buku resep keluarga",
    signoff: "salam manis, Dapur Loka ♡",
  },
];

export function About() {
  return (
    <section id="tentang" aria-labelledby="tentang-title" className="relative isolate overflow-x-clip bg-milk">
      {/* Butiran halus sama seperti Hero & Menu, supaya sambungan antar-section tidak terlihat */}
      <div aria-hidden="true" className="bg-grain pointer-events-none absolute inset-0 opacity-50" />

      <Container className="relative pt-24 sm:pt-32">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-10">
          <div className="lg:col-span-7" data-reveal>
            <Eyebrow className="mb-6">Kisah kami</Eyebrow>
            <h2 id="tentang-title" className="leading-[0.86] tracking-[-0.035em] text-espresso">
              <span className="block text-[clamp(3.1rem,10.5vw,7.25rem)] font-black uppercase">Lapis demi</span>
              <span className="font-wonky block text-[clamp(3.7rem,12.5vw,8.5rem)] font-medium text-caramel-500 italic">
                lapis.
              </span>
            </h2>
          </div>
          <div className="relative lg:col-span-5 lg:pb-3" data-reveal>
            <p className="text-lg leading-relaxed text-ink-muted sm:text-xl">
              Berawal dari resep andalan keluarga yang selalu ludes setiap kumpul acara. Kini, dari dapur rumahan kami,
              kebahagiaan manis itu kami bagikan langsung ke piringmu.
            </p>
            <HandNote arrow="up-left" arrowSide="start" className="mt-4 ml-2 -rotate-3 sm:ml-8">
              dibuat dengan penuh hati ♡
            </HandNote>
          </div>
        </div>
      </Container>

      {/* Taplak kotak-kotak tempat buku resep terbuka; memudar di atas & bawah */}
      <div className="relative mt-16 sm:mt-24">
        <div
          aria-hidden="true"
          className="bg-gingham absolute inset-0 [--gingham-base:var(--color-milk-50)] [--gingham-size:36px] [mask-image:linear-gradient(to_bottom,transparent,black_10rem,black_80%,transparent)]"
        />
        <Container className="relative flex flex-col items-center gap-24 pt-28 pb-12 sm:gap-36 sm:pt-40 sm:pb-16">
          {CHAPTERS.map((chapter, index) => (
            <RecipePage key={chapter.no} chapter={chapter} flip={index % 2 === 1} />
          ))}
          <a
            href="#menu"
            className="group -mt-8 inline-flex items-center gap-2 rounded-full px-3 py-1 font-hand text-[1.8rem] leading-none text-caramel-700 transition-colors hover:text-caramel-800 sm:-mt-16 sm:text-[2.1rem]"
          >
            sekarang, pilih favoritmu
            <ArrowDownIcon className="size-6 transition-transform duration-500 ease-jelly group-hover:translate-y-1" />
          </a>
        </Container>
      </div>
    </section>
  );
}

/** Satu halaman buku resep: kertas bergaris + foto polaroid berselotip. `flip` memindah fotonya ke kiri. */
function RecipePage({ chapter, flip }: { chapter: Chapter; flip: boolean }) {
  const titleId = `kisah-${chapter.no}`;
  return (
    <div className={cn("relative w-full max-w-[46rem]", flip ? "lg:-translate-x-12" : "lg:translate-x-12")}>
      <figure
        data-reveal="pop"
        className={cn(
          "relative z-10 mx-auto -mb-10 w-[min(70vw,15rem)] bg-white p-2.5 pb-12 shadow-pop sm:absolute sm:-top-16 sm:mb-0 sm:w-60",
          flip ? "-rotate-[4deg] sm:-left-6 lg:-left-24" : "rotate-[4deg] sm:-right-6 lg:-right-24",
        )}
      >
        <div className="relative aspect-[4/3.4] overflow-hidden bg-custard">
          <Image src={chapter.image} alt={chapter.alt} fill sizes="15rem" className="object-cover" />
        </div>
        <figcaption className="absolute inset-x-0 bottom-3 text-center font-hand text-[1.35rem] leading-none text-ink">
          {chapter.caption}
        </figcaption>
        <span aria-hidden="true" className="absolute -top-3 left-1/2 h-7 w-24 -translate-x-1/2 -rotate-3 bg-caramel-200/75 shadow-sm" />
      </figure>

      <article
        aria-labelledby={titleId}
        data-reveal
        className={cn(
          "relative rounded-[1.75rem] bg-milk-50 px-6 pt-16 pb-10 text-ink shadow-card ring-1 ring-black/5 [background-image:repeating-linear-gradient(180deg,transparent_0_2.25rem,color-mix(in_srgb,var(--color-caramel-300)_40%,transparent)_2.25rem_calc(2.25rem+1px))] [background-position:0_5rem] sm:px-12 sm:pt-12 sm:pb-12",
          flip ? "rotate-1" : "-rotate-1",
        )}
      >
        <div className={flip ? "sm:pl-52 lg:pl-24" : "sm:pr-52 lg:pr-24"}>
          <span
            aria-hidden="true"
            className="text-outline block font-display text-[3.5rem] leading-[0.8] font-black text-caramel-400 [--outline-width:1.2px]"
          >
            {chapter.no}
          </span>
          <h3
            id={titleId}
            className="mt-4 text-[clamp(2.1rem,5vw,3.5rem)] leading-[0.95] font-black tracking-[-0.02em] uppercase"
          >
            {chapter.title}
          </h3>
        </div>
        <p className="mt-4 max-w-lg text-lg leading-relaxed text-ink-muted sm:text-xl">{chapter.text}</p>
        {chapter.facts ? (
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-1 font-hand text-[1.6rem] leading-tight text-caramel-700">
            {chapter.facts.map((fact) => (
              <li key={fact} className="flex items-center gap-1.5">
                <svg
                  aria-hidden="true"
                  focusable="false"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-5 shrink-0"
                >
                  <path d="M3 11l4.5 4.5L17 4" />
                </svg>
                {fact}
              </li>
            ))}
          </ul>
        ) : null}
        {chapter.signoff ? (
          <p className="mt-8 -rotate-2 font-hand text-[1.9rem] leading-none text-caramel-700">{chapter.signoff}</p>
        ) : null}
      </article>
    </div>
  );
}

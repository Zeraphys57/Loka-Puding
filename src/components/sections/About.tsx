import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { HandNote } from "@/components/ui/HandNote";
import { ArrowDownIcon } from "@/components/ui/Icons";
import { cn } from "@/lib/cn";

/*
 * Kisah Kami = satu buku resep keluarga yang terbuka.
 * Halaman kiri: dua foto asli berselotip. Halaman kanan: kertas bergaris berisi cerita & checklist.
 * Semua warnanya token palet (caramel-*, milk, ink), jadi ikut palet aktif di src/config/theme.ts.
 */

const STORY =
  "Berawal dari resep andalan keluarga yang selalu ludes setiap kumpul acara. Kini, dari dapur rumahan kami, kebahagiaan manis itu kami bagikan langsung ke piringmu.";

const CHECKLIST = [
  { item: "susu sapi segar & karamel murni", detail: "Tanpa perisa buatan." },
  { item: "dimasak tiap subuh", detail: "Batch kecil, jadi selalu segar saat sampai di tanganmu." },
  { item: "kenyal, lalu lumer", detail: "Meleleh manis di suapan pertama." },
  { item: "resep dapur rumahan", detail: "Dikembangkan pelan-pelan sampai manisnya pas." },
];

// Garis kertas tiap 2.25rem; semua teks di halaman kanan memakai leading & jarak kelipatan 2.25rem supaya duduk di garis
const RULED_PAPER =
  "[background-image:repeating-linear-gradient(180deg,transparent_0_calc(2.25rem-1px),color-mix(in_srgb,var(--color-caramel-300)_45%,transparent)_calc(2.25rem-1px)_2.25rem)]";

export function About() {
  return (
    <section id="tentang" aria-labelledby="tentang-title" className="relative isolate overflow-x-clip bg-milk">
      {/* Butiran halus sama seperti Hero & Menu, supaya sambungan antar-section tidak terlihat */}
      <div aria-hidden="true" className="bg-grain pointer-events-none absolute inset-0 opacity-50" />

      <Container className="relative pt-24 pb-20 sm:pt-32 sm:pb-28">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end" data-reveal>
          <div className="lg:col-span-7">
            <Eyebrow className="mb-6">Kisah kami</Eyebrow>
            <h2 id="tentang-title" className="leading-[0.86] tracking-[-0.035em] text-espresso">
              <span className="block text-[clamp(3.1rem,10.5vw,7.25rem)] font-black uppercase">Lapis demi</span>
              <span className="font-wonky block text-[clamp(3.7rem,12.5vw,8.5rem)] font-medium text-caramel-500 italic">
                lapis.
              </span>
            </h2>
          </div>
          <HandNote
            arrow="down-left"
            arrowSide="start"
            className="ml-4 -rotate-3 lg:col-span-5 lg:mb-2 lg:ml-0 lg:justify-self-center"
          >
            dibuat dengan penuh hati ♡
          </HandNote>
        </div>

        {/* Buku terbuka: HP satu kolom (foto di atas), desktop dua halaman dengan punggung buku di tengah */}
        <div className="relative mx-auto mt-12 max-w-6xl sm:mt-16" data-reveal>
          <div className="relative grid rounded-[1.75rem] bg-milk-50 shadow-card ring-1 ring-black/5 lg:-rotate-1 lg:grid-cols-2">
            <div
              aria-hidden="true"
              className="absolute inset-y-0 left-1/2 hidden w-6 -translate-x-1/2 bg-caramel-100/70 lg:block"
            />

            {/* Foto kedua turun lewat margin (bukan translate: animasi GSAP data-reveal menimpa translate) */}
            <div className="flex items-start justify-center px-6 pt-10 pb-6 sm:px-10 lg:items-center lg:px-10 lg:py-14">
              <Polaroid
                src="/images/about/kisah-tuang-karamel.jpg"
                alt="Tangan menuang saus karamel dari cangkir ke puding susu dalam cup bening"
                caption="lumernya dari sini"
                className="w-[58%] max-w-[17rem] -rotate-3 lg:w-[60%] lg:max-w-none"
              />
              <Polaroid
                src="/images/about/kisah-tiga-varian.jpg"
                alt="Tiga puding karamel di piring putih dilihat dari atas: topping Regal, topping popcorn karamel, dan klasik"
                caption="klasik, regal, popcorn"
                className="mt-[28%] -ml-[2%] w-[46%] sm:-ml-[10%] max-w-[13.5rem] rotate-[5deg] lg:mt-[30%] lg:w-[48%] lg:max-w-none"
              />
            </div>

            <article
              aria-label="Catatan resep Dapur Loka"
              className={cn(
                "relative rounded-b-[1.75rem] px-6 pt-9 pb-9 text-ink sm:px-12 lg:rounded-r-[1.75rem] lg:rounded-bl-none lg:pt-[4.5rem] lg:pb-[4.5rem]",
                RULED_PAPER,
              )}
            >
              <p className="font-hand text-[2rem] leading-[2.25rem] text-caramel-700">Puding karamel keluarga</p>
              <p className="mt-[2.25rem] text-lg leading-[2.25rem] sm:text-xl sm:leading-[2.25rem]">{STORY}</p>
              <ul className="mt-[2.25rem]">
                {CHECKLIST.map(({ item, detail }) => (
                  <li key={item} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-2">
                    <svg
                      aria-hidden="true"
                      focusable="false"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.4}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mt-2 size-5 text-caramel-600"
                    >
                      <path d="M3 11l4.5 4.5L17 4" />
                    </svg>
                    <span className="font-hand text-[1.65rem] leading-[2.25rem] text-caramel-700">{item}</span>
                    <span className="col-start-2 text-base leading-[2.25rem] text-ink-muted">{detail}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-[2.25rem] -rotate-2 font-hand text-[1.9rem] leading-[2.25rem] text-caramel-700">
                salam manis, Dapur Loka ♡
              </p>
            </article>
          </div>
        </div>

        <div className="mt-12 flex justify-center sm:mt-16">
          <a
            href="#menu"
            className="group inline-flex items-center gap-2 rounded-full px-3 py-1 font-hand text-[1.8rem] leading-none text-caramel-700 transition-colors hover:text-caramel-800 sm:text-[2.1rem]"
          >
            sekarang, pilih favoritmu
            <ArrowDownIcon className="size-6 transition-transform duration-500 ease-jelly group-hover:translate-y-1" />
          </a>
        </div>
      </Container>
    </section>
  );
}

/** Foto polaroid berselotip dengan keterangan tulisan tangan. Lebar & kemiringan diatur lewat `className`. */
function Polaroid({ src, alt, caption, className }: { src: string; alt: string; caption: string; className?: string }) {
  return (
    <figure data-reveal="pop" className={cn("relative shrink-0 bg-white p-2 pb-10 shadow-pop sm:p-2.5 sm:pb-12", className)}>
      <div className="relative aspect-[4/5] overflow-hidden bg-custard">
        <Image src={src} alt={alt} fill sizes="(min-width: 1024px) 20rem, 45vw" className="object-cover" />
      </div>
      <figcaption className="absolute inset-x-1 bottom-2.5 text-center font-hand text-[1.15rem] leading-none text-ink sm:bottom-3 sm:text-[1.35rem]">
        {caption}
      </figcaption>
      <span aria-hidden="true" className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 -rotate-3 bg-caramel-200/75 shadow-sm" />
    </figure>
  );
}

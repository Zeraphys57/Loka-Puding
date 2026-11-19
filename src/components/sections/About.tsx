import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { HandNote, ScribbleArrow } from "@/components/ui/HandNote";
import { ArrowDownIcon } from "@/components/ui/Icons";
import { Pencil, Twine } from "@/components/ui/TableProps";
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

// Bayangan lipatan kain serbet: garis kerut gelap-terang di kiri, kanan & bawah, plus kain menumpuk di dua sudut
const shade = (percent: number) => `color-mix(in srgb, var(--color-espresso) ${percent}%, transparent)`;
const CLOTH_FOLDS = [
  `linear-gradient(118deg, transparent 0 6%, ${shade(10)} 9%, rgb(255 255 255 / 0.45) 11%, transparent 15%)`,
  `linear-gradient(62deg, transparent 0 84%, rgb(255 255 255 / 0.4) 88%, ${shade(10)} 90.5%, transparent 94%)`,
  `linear-gradient(160deg, transparent 0 88%, ${shade(9)} 93%, rgb(255 255 255 / 0.3) 95%, transparent 98%)`,
  `radial-gradient(ellipse 22% 30% at 2% 98%, ${shade(14)}, transparent)`,
  `radial-gradient(ellipse 18% 26% at 99% 2%, ${shade(10)}, transparent)`,
].join(", ");

export function About() {
  return (
    <section id="tentang" aria-labelledby="tentang-title" className="relative isolate overflow-x-clip bg-milk">
      {/* Latar sama dengan Hero: butiran 70% + dua cahaya karamel lembut */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 select-none">
        <div className="bg-grain absolute inset-0 opacity-70" />
        <div className="absolute -top-48 -right-40 size-[40rem] rounded-full bg-[radial-gradient(closest-side,var(--color-caramel-100),transparent)]" />
        <div className="absolute top-[45%] -left-64 size-[36rem] rounded-full bg-[radial-gradient(closest-side,var(--color-caramel-50),transparent)]" />
      </div>
      {/* Alat di meja (layar lebar): tali kue keluar dari bawah serbet & menyambung ke section Menu, pensil penulis resep di bawah serbet */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block">
        <Twine className="right-[6%] bottom-0 h-[42%] w-36" />
        <Pencil className="bottom-24 left-24 hidden w-[22rem] -rotate-[9deg] xl:block" />
      </div>

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
        <div className="relative mx-auto mt-14 max-w-6xl sm:mt-24" data-reveal>
          {/*
            Serbet kotak-kotak di bawah buku, sedikit lebih besar & miring; di HP melebar sampai tepi layar.
            Filter SVG membengkokkan kotak-kotak & pinggirannya (kain asli), lapisan CLOTH_FOLDS memberi bayangan kerut.
          */}
          <svg aria-hidden="true" focusable="false" className="absolute size-0">
            <filter id="kisah-kain-kerut" x="-3%" y="-3%" width="106%" height="106%">
              <feTurbulence type="fractalNoise" baseFrequency="0.004 0.009" numOctaves={2} seed={7} result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale={16} xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </svg>
          <div
            aria-hidden="true"
            className="bg-gingham absolute -inset-x-6 -inset-y-6 rotate-[2.5deg] rounded-[10px] shadow-card [filter:url(#kisah-kain-kerut)] [--gingham-size:24px] sm:-inset-x-[3.25rem] sm:-inset-y-[2.75rem] sm:[--gingham-size:30px]"
          >
            <div className="absolute inset-0 rounded-[inherit]" style={{ backgroundImage: CLOTH_FOLDS }} />
          </div>
          {/* Halaman putih dengan tepi sampul biru muda tipis, supaya terbaca sebagai buku di atas latar; semua warna token palet */}
          <div className="relative rounded-[2rem] bg-caramel-200 p-1.5 shadow-pop lg:-rotate-1">
            <div className="relative grid rounded-[1.6rem] bg-milk-50 lg:grid-cols-2">
              <div
                aria-hidden="true"
                className="absolute inset-y-0 left-1/2 hidden w-6 -translate-x-1/2 bg-caramel-100 lg:block"
              />

              {/*
                Sketsa pensil langsung di halaman (dari foto asli), diagonal: satu dari kiri atas, satu dari kanan bawah,
                bertemu di tengah. Desktop: kotak setinggi halaman (ikut baris grid); HP: kotak 4:5.
                Posisi lewat top/left, bukan translate: animasi GSAP data-reveal menimpa translate.
              */}
              <div className="relative aspect-[4/5] w-full lg:aspect-auto">
                <Sketch
                  src="/images/about/sketsa-tuang-karamel.webp"
                  alt="Sketsa pensil: tangan menuang saus karamel dari cangkir ke puding susu dalam cup bening"
                  caption="lumernya dari sini"
                  className="absolute top-[4%] left-[3%] w-[60%] -rotate-3"
                />
                <Sketch
                  src="/images/about/sketsa-tiga-varian.webp"
                  alt="Sketsa pensil: tiga puding karamel di piring dilihat dari atas, topping Regal, topping popcorn karamel, dan klasik"
                  caption="klasik, regal, popcorn"
                  className="absolute right-[3%] bottom-[4%] w-[56%] rotate-[4deg]"
                />
                {/*
                  Coretan langkah membuat di dua pojok yang kosong (dekorasi). Sengaja tanpa bahan & takaran, supaya tidak
                  jadi klaim resep; hanya urutan puding dua lapis: puding susu → siram karamel → topping.
                */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute top-[5%] right-[5%] rotate-[4deg] font-hand text-[0.95rem] leading-[1.1] text-caramel-700 sm:text-[1.3rem] lg:text-[1.45rem]"
                >
                  <p className="text-[1.15em] text-caramel-800">cara buat:</p>
                  <ol>
                    <li>1. masak puding susu</li>
                    <li>2. tuang ke cup</li>
                    <li>3. dinginkan</li>
                    <li>4. siram karamel</li>
                  </ol>
                  <span className="mt-1 block pl-[15%] text-[1.25em]">
                    <ScribbleArrow direction="down-left" />
                  </span>
                </div>
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-[8%] left-[5%] -rotate-3 font-hand text-[0.95rem] leading-[1.1] text-caramel-700 sm:text-[1.3rem] lg:text-[1.45rem]"
                >
                  <p className="flex items-end gap-1">
                    5. tambah topping
                    <span className="text-[1.25em]">
                      <ScribbleArrow direction="up-right" />
                    </span>
                  </p>
                  <p className="text-[1.15em] text-caramel-800">selesai! ♡</p>
                </div>
              </div>

              <article
                aria-label="Catatan resep Dapur Loka"
                className={cn(
                  "relative rounded-b-[1.6rem] px-6 pt-9 pb-9 text-ink sm:px-12 lg:rounded-r-[1.6rem] lg:rounded-bl-none lg:pt-[4.5rem] lg:pb-[4.5rem]",
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
        </div>

        <div className="mt-14 flex justify-center sm:mt-24">
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

/**
 * Sketsa pensil (dibuat dari foto asli, pinggirnya memudar ke kertas) yang digambar langsung di halaman buku,
 * dengan keterangan tulisan tangan. Lebar & kemiringan diatur lewat `className`.
 */
function Sketch({ src, alt, caption, className }: { src: string; alt: string; caption: string; className?: string }) {
  return (
    <figure data-reveal="pop" className={cn("shrink-0", className)}>
      <div className="relative aspect-[4/5]">
        <Image src={src} alt={alt} fill sizes="(min-width: 1024px) 20rem, 45vw" className="object-cover" />
      </div>
      <figcaption className="-mt-2 text-center font-hand text-[1.05rem] leading-none whitespace-nowrap text-caramel-700 sm:text-[1.4rem]">
        {caption}
      </figcaption>
    </figure>
  );
}

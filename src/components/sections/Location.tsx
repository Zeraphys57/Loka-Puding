"use client";

import { useRef } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { HandNote } from "@/components/ui/HandNote";
import { ArrowUpRightIcon, ClockIcon, MapPinIcon } from "@/components/ui/Icons";
import { siteConfig } from "@/config/site";
import { formatTime } from "@/lib/format";
import { gsap, useGSAP } from "@/lib/gsap";

/*
 * Desktop (≥1024px & gerakan diizinkan): section menempel di layar, lingkaran peta membesar
 * mengikuti scroll lalu kartu info muncul. Mobile, tablet, atau "kurangi gerakan":
 * tata letak biasa (judul → peta → kartu info), tanpa scroll-jacking.
 * Peta tidak bisa di-scroll/di-drag (pointer-events: none) supaya scroll halaman tidak "nyangkut";
 * untuk navigasi ada tombol "Buka di Google Maps".
 */
export function Location() {
  const { address, openingHours, maps } = siteConfig;

  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 1024px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)", () => {
        // Satuan awal & akhir harus sama (persen) agar GSAP bisa menginterpolasi clip-path dengan benar
        gsap.set(maskRef.current, { clipPath: "circle(12% at 50% 50%)" });
        gsap.set(cardRef.current, { autoAlpha: 0, y: 70, scale: 0.96 });
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "+=1100",
            pin: true,
            scrub: 0.8,
          },
        });
        // Lingkaran peta membesar (linear: wajib untuk animasi yang di-scrub)
        tl.to(maskRef.current, { clipPath: "circle(75% at 50% 50%)", ease: "none", duration: 1 }, 0.1);
        tl.to(titleRef.current, { autoAlpha: 0, scale: 1.08, duration: 0.45, ease: "power1.in" }, 0.1);
        tl.to(cardRef.current, { autoAlpha: 1, y: 0, scale: 1, duration: 0.55, ease: "power3.out" }, 0.62);
      });

      // Desktop tanpa animasi: langsung tampilkan keadaan akhir
      mm.add("(min-width: 1024px) and (min-height: 600px) and (prefers-reduced-motion: reduce)", () => {
        gsap.set(maskRef.current, { clipPath: "circle(75% at 50% 50%)" });
        gsap.set(titleRef.current, { autoAlpha: 0 });
      });

      // Layar desktop yang pendek: peta langsung terbuka penuh, tanpa efek menempel
      mm.add("(min-width: 1024px) and (max-height: 599px)", () => {
        gsap.set(maskRef.current, { clipPath: "circle(75% at 50% 50%)" });
        gsap.set(titleRef.current, { autoAlpha: 0 });
      });
    },
    { scope: sectionRef },
  );

  const mapFrame = (
    <iframe
      src={maps.embedUrl}
      title={`Peta lokasi ${siteConfig.name}`}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      tabIndex={-1}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 size-full border-0 [filter:var(--map-filter)]"
    />
  );

  return (
    <section
      ref={sectionRef}
      id="lokasi"
      aria-labelledby="lokasi-title"
      data-nav-tone="dark"
      className="on-dark relative overflow-hidden bg-espresso-900 text-milk-50 lg:h-svh"
    >
      <div aria-hidden="true" className="bg-grain pointer-events-none absolute inset-0 opacity-60" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 size-[48rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-caramel-500)_28%,transparent),transparent)]"
      />

      {/* Judul besar: di desktop menjadi layar pembuka sebelum peta terbuka */}
      <div
        ref={titleRef}
        className="relative z-10 flex flex-col items-center px-4 pt-28 text-center sm:pt-36 lg:pointer-events-none lg:absolute lg:inset-0 lg:justify-center lg:pt-0"
      >
        <Eyebrow centered tone="dark" className="mb-5">
          Lokasi
        </Eyebrow>
        <h2 id="lokasi-title" className="leading-[0.85] tracking-[-0.035em]">
          <span className="block text-[clamp(4rem,17vw,11rem)] font-black uppercase">Dapur</span>
          <span className="font-wonky -mt-1 block text-[clamp(4.25rem,18vw,12rem)] font-medium text-caramel-400 italic">
            kami
          </span>
        </h2>
        <p className="mt-6 hidden text-xs font-bold tracking-[0.3em] text-milk-50/60 uppercase motion-safe:lg:block">
          Scroll untuk membuka peta
        </p>
      </div>

      <div className="relative mx-auto w-full max-w-5xl px-4 pt-12 pb-28 sm:px-6 sm:pb-36 lg:static lg:max-w-none lg:p-0">
        {/* Peta: kartu di mobile, layar penuh bertopeng lingkaran di desktop */}
        <div
          ref={maskRef}
          className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-pop ring-1 ring-milk-50/10 sm:aspect-[16/9] lg:absolute lg:inset-0 lg:aspect-auto lg:rounded-none lg:shadow-none lg:ring-0 lg:[clip-path:circle(12%_at_50%_50%)]"
        >
          {mapFrame}
          <div className="pointer-events-none absolute inset-0 bg-espresso-900/25 lg:bg-espresso-900/55" />
          <a
            href={maps.link}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute right-4 bottom-4 inline-flex items-center gap-2 rounded-full bg-milk-50 px-5 py-3 text-sm font-bold text-espresso shadow-sticker transition-transform duration-500 ease-jelly hover:-translate-y-0.5 lg:hidden"
          >
            <MapPinIcon className="size-4 text-caramel-600" />
            Buka di Google Maps
          </a>
        </div>

        {/* Kartu info */}
        <div
          ref={cardRef}
          className="relative z-10 mt-6 lg:pointer-events-none lg:absolute lg:inset-0 lg:mt-0 lg:flex lg:items-center lg:justify-center lg:p-8"
        >
          <div className="relative flex flex-col gap-8 rounded-[2.25rem] bg-espresso-800/95 p-6 shadow-pop ring-1 ring-milk-50/10 sm:p-10 lg:pointer-events-auto lg:w-full lg:max-w-4xl lg:flex-row lg:gap-12 lg:bg-espresso-900/80 lg:p-10 lg:backdrop-blur-xl xl:p-12">
            <HandNote arrow="down-left" arrowSide="start" className="absolute -top-9 right-6 rotate-3 text-caramel-300 sm:right-10">
              mampir yuk!
            </HandNote>

            <div className="flex flex-1 flex-col gap-7">
              <div>
                <h3 className="mb-3 flex items-center gap-2.5 font-sans text-xs font-bold tracking-[0.22em] text-caramel-300 uppercase">
                  <MapPinIcon className="size-5" /> Alamat
                </h3>
                <p className="font-display text-[1.7rem] leading-[1.1] font-bold sm:text-4xl">{address.street}</p>
                <p className="mt-2 leading-relaxed text-milk-50/75 sm:text-lg">
                  {address.locality}, {address.city}
                  <br />
                  {address.region} {address.postalCode}
                </p>
              </div>
              <div className="h-px w-full bg-milk-50/10" />
              <div>
                <h3 className="mb-4 flex items-center gap-2.5 font-sans text-xs font-bold tracking-[0.22em] text-caramel-300 uppercase">
                  <ClockIcon className="size-5" /> Jam buka
                </h3>
                <dl className="flex flex-col gap-3">
                  {openingHours.map((slot) => (
                    <div key={slot.label} className="flex items-end justify-between gap-4 border-b border-milk-50/10 pb-2.5">
                      <dt className="text-milk-50/75">{slot.label}</dt>
                      <dd className="font-bold tabular-nums">
                        {formatTime(slot.opens)} – {formatTime(slot.closes)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {/* Satu aksi saja di sini: petunjuk arah. Tombol pesan ada di navbar, tiap menu, dan footer. */}
            <div className="flex flex-1 flex-col justify-center gap-4">
              <a
                href={maps.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-4 rounded-[1.75rem] bg-caramel-600 p-6 text-white shadow-sticker transition-transform duration-500 ease-jelly hover:-translate-y-1 sm:p-7"
              >
                <span>
                  <span className="block font-display text-2xl font-bold sm:text-3xl">Petunjuk arah</span>
                  <span className="mt-1 block text-xs font-bold tracking-[0.18em] text-caramel-50 uppercase">
                    Buka di Google Maps
                  </span>
                </span>
                <ArrowUpRightIcon className="size-9 shrink-0 transition-transform duration-500 ease-jelly group-hover:translate-x-1 group-hover:-translate-y-1 sm:size-10" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

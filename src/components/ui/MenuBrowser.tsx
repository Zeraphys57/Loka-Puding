"use client";

import Image from "next/image";
import { Fragment, useRef, useState } from "react";
import { BundlePhotos } from "@/components/ui/BundlePhotos";
import { EmptyImage } from "@/components/ui/EmptyImage";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FilterPills } from "@/components/ui/FilterPills";
import { HandNote } from "@/components/ui/HandNote";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { MenuDialog } from "@/components/ui/MenuDialog";
import { cn } from "@/lib/cn";
import type { MenuCategoryView, MenuItemView } from "@/lib/menu";

const ALL = "semua";

type MenuBrowserProps = {
  items: MenuItemView[];
  categories: MenuCategoryView[];
  instagram: { url: string; handle: string };
};

type OpenItem = (item: MenuItemView, trigger: HTMLButtonElement) => void;

export function MenuBrowser({ items, categories, instagram }: MenuBrowserProps) {
  const [active, setActive] = useState<string>(ALL);
  const [selected, setSelected] = useState<MenuItemView | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const options = [{ id: ALL, label: "Semua" }, ...categories];
  const visibleItems = items.filter((item) => active === ALL || item.category === active);
  const singles = visibleItems.filter((item) => item.contents.length === 0);
  const bundles = visibleItems.filter((item) => item.contents.length > 0);

  const openItem: OpenItem = (item, trigger) => {
    triggerRef.current = trigger;
    setSelected(item);
  };

  function handleClosed() {
    setSelected(null);
    triggerRef.current?.focus({ preventScroll: true });
  }

  return (
    <div className="flex w-full flex-col items-center">
      {/* Filter kategori: hanya tampil jika ada lebih dari satu kategori */}
      {categories.length > 1 ? (
        <div className="z-10 mb-12 flex flex-col items-center gap-4 sm:mb-14" data-reveal>
          <FilterPills label="Filter kategori menu" options={options} active={active} onChange={setActive} />
        </div>
      ) : null}

      {/*
        "Satu meja, naik level": puding berdiri berjejer di satu taplak, dengan panah "+ topping" di antaranya.
        Desktop: grid [puding][panah][puding]…; tiap puding memakai subgrid 3 baris (catatan, foto, teks)
        supaya foto sejajar dan taplak bisa diletakkan di baris foto. HP: tersusun ke bawah, panah menunjuk turun.
      */}
      {singles.length > 0 ? (
        <div
          className="flex w-full max-w-6xl flex-col gap-2 lg:grid lg:grid-rows-[auto_auto_auto] lg:[--step:5.5rem] xl:[--step:7.5rem]"
          style={{ gridTemplateColumns: singles.map((_, i) => (i ? "var(--step) minmax(0,1fr)" : "minmax(0,1fr)")).join(" ") }}
        >
          <div
            aria-hidden="true"
            className="bg-gingham hidden rounded-[2rem] shadow-card [--gingham-size:32px] lg:col-span-full lg:row-start-2 lg:-mx-6 lg:-mb-6 lg:block lg:h-[40%] lg:self-end"
          />
          {singles.map((item, index) => (
            <Fragment key={item.id}>
              {index > 0 ? <StepArrow topping={item.topping} column={index * 2} /> : null}
              <article
                aria-labelledby={`menu-${item.id}`}
                data-reveal
                style={{ gridColumn: index * 2 + 1 }}
                className="group relative z-10 grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-x-5 sm:grid-cols-[9rem_minmax(0,1fr)] lg:row-span-3 lg:row-start-1 lg:grid-cols-1 lg:grid-rows-subgrid lg:text-center"
              >
                <div className="col-start-2 row-start-1 self-end lg:col-start-1 lg:pb-3">
                  {item.note ? (
                    <HandNote className="text-[1.3rem] sm:text-[1.5rem] lg:-rotate-3 lg:text-[1.7rem]">{item.note}</HandNote>
                  ) : null}
                </div>

                <div className="relative col-start-1 row-span-2 row-start-1 self-center lg:row-span-1 lg:row-start-2 lg:px-5">
                  {/* Di HP tiap puding punya alas taplak sendiri; di desktop alasnya taplak bersama */}
                  <div
                    aria-hidden="true"
                    className="bg-gingham absolute -inset-x-2 -bottom-2 h-2/5 rounded-xl shadow-card [--gingham-size:16px] lg:hidden"
                  />
                  <div className="relative aspect-[4/5] overflow-hidden rounded-t-full rounded-b-[1.25rem] bg-custard shadow-pop ring-4 ring-white lg:rounded-b-[2rem] lg:ring-[6px]">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.imageAlt}
                        fill
                        sizes="(min-width: 1024px) 20rem, 9rem"
                        className={cn(
                          "object-cover transition-transform duration-1000 ease-silk group-hover:scale-105",
                          !item.available && "opacity-80 grayscale-[0.7]",
                        )}
                      />
                    ) : (
                      <EmptyImage name={item.name} />
                    )}
                    <StatusPills item={item} className="absolute bottom-3 left-1/2 -translate-x-1/2 items-center" />
                  </div>
                </div>

                <div className="col-start-2 row-start-2 self-start pt-1 lg:col-start-1 lg:row-start-3 lg:flex lg:flex-col lg:items-center lg:self-stretch lg:px-3 lg:pt-12">
                  <h3
                    id={`menu-${item.id}`}
                    className="font-display text-xl leading-[1.1] font-bold tracking-[-0.01em] text-espresso sm:text-2xl xl:text-[1.75rem]"
                  >
                    {item.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted sm:text-base lg:mx-auto lg:max-w-[18rem]">
                    {item.description}
                  </p>
                  <PriceTag item={item} onOpen={openItem} />
                </div>
              </article>
            </Fragment>
          ))}
        </div>
      ) : null}

      {/* Paket hemat: satu lembar berisi baris-baris paket, di atas "serbet" kotak-kotak */}
      {bundles.length > 0 ? (
        <div className={cn("w-full max-w-4xl", singles.length > 0 && "mt-16 sm:mt-20")} data-reveal>
          <div className="bg-gingham rounded-[2.5rem] p-2.5 shadow-card [--gingham-size:28px] sm:p-3.5">
            <div className="rounded-[2rem] bg-milk-50 px-5 pt-7 pb-3 sm:px-9 sm:pt-9 sm:pb-5">
              <Eyebrow>Paket bundling</Eyebrow>
              <h3 className="mt-3 text-[clamp(1.75rem,4vw,2.5rem)] leading-none font-black tracking-[-0.02em] text-espresso uppercase">
                Makin rame,{" "}
                <span className="font-wonky font-medium text-caramel-500 normal-case italic">makin hemat</span>
              </h3>

              <ul className="mt-5 divide-y divide-line">
                {bundles.map((item) => (
                  <li key={item.id}>
                    <article
                      aria-labelledby={`menu-${item.id}`}
                      className="relative flex flex-col gap-3 py-5 sm:grid sm:grid-cols-[10.5rem_minmax(0,1fr)_auto] sm:items-center sm:gap-6"
                    >
                      <BundlePhotos parts={item.contents} className="[--bundle-photo:3.5rem] sm:[--bundle-photo:4rem]" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                          <h4 id={`menu-${item.id}`} className="font-display text-xl font-bold text-espresso sm:text-2xl">
                            {item.name}
                          </h4>
                          {item.savingsLabel ? (
                            <span className="-rotate-2 rounded-full bg-caramel-300 px-3 py-1 text-[0.7rem] font-bold tracking-[0.12em] text-espresso uppercase">
                              Hemat {item.savingsLabel}
                            </span>
                          ) : null}
                          <StatusPills item={item} />
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-ink-muted sm:text-base">{item.description}</p>
                      </div>
                      <PriceButton item={item} onOpen={openItem} />
                    </article>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}

      <a
        href={instagram.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group mt-14 rounded-full px-3 py-1 text-center font-hand text-[1.5rem] leading-tight text-caramel-700 transition-colors hover:text-caramel-800 sm:mt-16 sm:text-[1.8rem]"
      >
        menu baru menyusul, ikuti{" "}
        <span className="whitespace-nowrap">
          {instagram.handle}
          <ArrowRightIcon className="ml-1.5 inline-block size-5 align-[-0.1em] transition-transform duration-500 ease-jelly group-hover:translate-x-1" />
        </span>
      </a>

      <MenuDialog item={selected} onClosed={handleClosed} />
    </div>
  );
}

/**
 * Harga + panah. Satu-satunya tombol di kartu, tapi bidang kliknya (::after) menutupi seluruh kartu,
 * jadi kartu mana pun yang disentuh membuka detail (tempat tombol pesan WhatsApp).
 */
function PriceButton({ item, onOpen, className }: { item: MenuItemView; onOpen: OpenItem; className?: string }) {
  return (
    <button
      type="button"
      onClick={(event) => onOpen(item, event.currentTarget)}
      className={cn(
        "group/price flex items-center justify-between gap-4 rounded-full text-left after:absolute after:inset-0 sm:justify-start",
        className,
      )}
    >
      <span className="sr-only">Lihat detail {item.name},</span>
      <span
        className={cn(
          "font-display text-xl font-black tracking-tight sm:text-2xl",
          item.available ? "text-caramel-700" : "text-ink-muted line-through",
        )}
      >
        {item.priceLabel}
      </span>
      <span
        aria-hidden="true"
        className="grid size-10 shrink-0 place-items-center rounded-full bg-caramel-600 text-white shadow-sticker transition-transform duration-500 ease-jelly group-hover/price:translate-x-1"
      >
        <ArrowRightIcon className="size-5" />
      </span>
    </button>
  );
}

/** Harga di label gantung (berlubang tali) + panah. Bidang kliknya menutupi seluruh puding, seperti PriceButton. */
function PriceTag({ item, onOpen }: { item: MenuItemView; onOpen: OpenItem }) {
  return (
    <button
      type="button"
      onClick={(event) => onOpen(item, event.currentTarget)}
      className="group/price mt-4 inline-flex items-center gap-3 after:absolute after:inset-0 lg:mt-auto lg:pt-6"
    >
      <span className="sr-only">Lihat detail {item.name},</span>
      {/* drop-shadow di pembungkus, karena clip-path memotong box-shadow */}
      <span className="-rotate-3 drop-shadow-[0_6px_8px_rgb(0_0_0/0.18)] transition-transform duration-500 ease-jelly group-hover/price:rotate-3">
        <span
          className={cn(
            "relative block py-1.5 pr-4 pl-7 font-display text-lg font-black tracking-tight text-white [clip-path:polygon(0.9rem_0,100%_0,100%_100%,0.9rem_100%,0_50%)] sm:text-xl",
            item.available ? "bg-caramel-600" : "bg-ink-muted line-through",
          )}
        >
          <span aria-hidden="true" className="absolute top-1/2 left-[0.7rem] size-2 -translate-y-1/2 rounded-full bg-milk" />
          {item.priceLabel}
        </span>
      </span>
      <span
        aria-hidden="true"
        className="grid size-9 shrink-0 place-items-center rounded-full bg-milk-50 text-caramel-700 shadow-sticker ring-1 ring-line transition-transform duration-500 ease-jelly group-hover/price:translate-x-1"
      >
        <ArrowRightIcon className="size-4" />
      </span>
    </button>
  );
}

/** Panah coretan tangan "+ topping" di antara dua puding. Desktop: ke kanan; HP: ke bawah. */
function StepArrow({ topping, column }: { topping?: string; column: number }) {
  return (
    <div
      aria-hidden="true"
      style={{ gridColumn: column }}
      className="flex items-center gap-1 pl-9 sm:pl-[3.25rem] lg:row-start-2 lg:flex-col-reverse lg:gap-2 lg:self-center lg:pb-[30%] lg:pl-0"
    >
      <svg
        viewBox="0 0 80 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        focusable="false"
        className="h-6 w-10 shrink-0 rotate-90 text-caramel-500 lg:h-7 lg:w-20 lg:rotate-0"
      >
        <path d="M4 14c10-8 20 6 32-1s22-6 36 0" />
        <path d="M63 6l9 7-10 6" />
      </svg>
      {topping ? (
        <span className="font-hand text-[1.35rem] leading-none text-caramel-700 lg:-rotate-6 lg:text-center lg:text-[1.5rem]">
          + {topping}
        </span>
      ) : null}
    </div>
  );
}

/** Label "Best Seller"/"Baru" dan "Habis" (jika ada). */
function StatusPills({ item, className }: { item: MenuItemView; className?: string }) {
  if (!item.badge && item.available) return null;
  return (
    <span className={cn("flex flex-col gap-1.5", className)}>
      {item.badge ? (
        <span className="-rotate-3 rounded-full bg-caramel-300 px-3 py-1 text-[0.7rem] font-bold tracking-[0.12em] text-espresso uppercase shadow-sticker">
          {item.badge}
        </span>
      ) : null}
      {!item.available ? (
        <span className="rotate-2 rounded-full bg-espresso px-3 py-1 text-[0.7rem] font-bold tracking-[0.12em] text-milk-50 uppercase shadow-sticker">
          Habis
        </span>
      ) : null}
    </span>
  );
}

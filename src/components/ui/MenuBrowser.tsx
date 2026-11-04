"use client";

import Image from "next/image";
import { useRef, useState } from "react";
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

      {/* Etalase: semua puding berdampingan supaya mudah dibandingkan. Di HP jadi daftar ringkas. */}
      {singles.length > 0 ? (
        <ul className="grid w-full max-w-6xl gap-4 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          {singles.map((item) => (
            <li key={item.id} data-reveal>
              <article
                aria-labelledby={`menu-${item.id}`}
                className="group relative flex h-full items-center gap-4 rounded-[2rem] bg-milk-50 p-3 shadow-card ring-1 ring-black/5 transition-transform duration-500 ease-out-soft hover:-translate-y-1 sm:gap-6 lg:flex-col lg:items-stretch lg:gap-0"
              >
                <div className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-[1.5rem] bg-custard sm:w-40 lg:aspect-[4/5] lg:w-full">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.imageAlt}
                      fill
                      sizes="(min-width: 1024px) 24rem, 10rem"
                      className={cn(
                        "object-cover transition-transform duration-1000 ease-silk group-hover:scale-105",
                        !item.available && "opacity-80 grayscale-[0.7]",
                      )}
                    />
                  ) : (
                    <EmptyImage name={item.name} />
                  )}
                  <StatusPills item={item} className="absolute top-2 left-2 lg:top-4 lg:left-4" />
                </div>

                <div className="flex min-w-0 flex-1 flex-col lg:px-4 lg:pt-5 lg:pb-3">
                  {item.note ? <HandNote className="text-[1.3rem] sm:text-[1.5rem]">{item.note}</HandNote> : null}
                  <h3
                    id={`menu-${item.id}`}
                    className="mt-1 font-display text-xl leading-[1.1] font-bold tracking-[-0.01em] text-espresso sm:text-2xl"
                  >
                    {item.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted sm:text-base">{item.description}</p>
                  <PriceButton item={item} onOpen={openItem} className="mt-4 lg:mt-auto lg:pt-6" />
                </div>
              </article>
            </li>
          ))}
        </ul>
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

/** Label "Best Seller"/"Baru" dan "Habis" (jika ada). */
function StatusPills({ item, className }: { item: MenuItemView; className?: string }) {
  if (!item.badge && item.available) return null;
  return (
    <span className={cn("flex flex-col items-start gap-1.5", className)}>
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

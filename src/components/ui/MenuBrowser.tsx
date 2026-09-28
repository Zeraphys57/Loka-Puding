"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyImage } from "@/components/ui/EmptyImage";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FilterPills } from "@/components/ui/FilterPills";
import { HandNote } from "@/components/ui/HandNote";
import { InstagramIcon, WhatsAppIcon } from "@/components/ui/Icons";
import { MenuDialog } from "@/components/ui/MenuDialog";
import { PriceSticker } from "@/components/ui/PriceSticker";
import type { UpcomingMenu } from "@/data/menu";
import { cn } from "@/lib/cn";
import type { MenuCategoryView, MenuItemView } from "@/lib/menu";
import { whatsappItemLink } from "@/lib/whatsapp";

const ALL = "semua";

type MenuBrowserProps = {
  items: MenuItemView[];
  categories: MenuCategoryView[];
  /** Slot "menu lainnya menyusul" (lihat data/menu.ts) */
  upcoming: UpcomingMenu[];
  instagram: { url: string; handle: string };
};

export function MenuBrowser({ items, categories, upcoming, instagram }: MenuBrowserProps) {
  const [active, setActive] = useState<string>(ALL);
  const [selected, setSelected] = useState<MenuItemView | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const options = [{ id: ALL, label: "Semua" }, ...categories];
  const visibleItems = items.filter((item) => active === ALL || item.category === active);

  function openItem(item: MenuItemView, trigger: HTMLButtonElement) {
    triggerRef.current = trigger;
    setSelected(item);
  }

  function handleClosed() {
    setSelected(null);
    triggerRef.current?.focus({ preventScroll: true });
  }

  return (
    <div className="flex w-full flex-col">
      {/* Filter kategori: hanya tampil jika ada lebih dari satu kategori */}
      {categories.length > 1 ? (
        <div className="z-10 mb-16 flex flex-col items-center gap-4" data-reveal>
          <FilterPills label="Filter kategori menu" options={options} active={active} onChange={setActive} />
        </div>
      ) : null}

      {/* Zig-zag editorial: foto di atas "serbet" kotak-kotak, stiker harga, catatan tangan */}
      <ol className="flex w-full flex-col gap-24 sm:gap-32 lg:px-6">
        {visibleItems.map((item, index) => {
          const flip = index % 2 === 1;
          return (
            <li key={item.id}>
              <article
                aria-labelledby={`menu-${item.id}`}
                className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20"
              >
                {/* Foto */}
                <div className={cn("relative", flip && "lg:order-2")} data-reveal>
                  <div className="relative mx-auto w-[min(100%-2.5rem,31rem)] sm:w-[min(100%-4rem,31rem)]">
                    <div
                      aria-hidden="true"
                      className={cn(
                        "bg-gingham absolute -inset-3 rounded-[2.75rem] shadow-card sm:-inset-4",
                        flip ? "-rotate-3" : "rotate-3",
                      )}
                    />
                    <div className="group relative aspect-[4/5] overflow-hidden rounded-[2.5rem] bg-custard shadow-pop ring-[6px] ring-white">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.imageAlt}
                          fill
                          sizes="(min-width: 1024px) 31rem, (min-width: 640px) 70vw, 90vw"
                          className={cn(
                            "object-cover transition-transform duration-1000 ease-silk group-hover:scale-105",
                            !item.available && "opacity-80 grayscale-[0.7]",
                          )}
                        />
                      ) : (
                        <EmptyImage name={item.name} />
                      )}
                    </div>

                    <PriceSticker
                      label={item.priceLabel}
                      className={cn("absolute -bottom-5", flip ? "-left-4 rotate-[8deg]" : "-right-4 -rotate-[10deg]")}
                    />

                    {item.badge || !item.available ? (
                      <div className={cn("absolute top-5 flex flex-col gap-2", flip ? "right-5 items-end" : "left-5 items-start")}>
                        {item.badge ? (
                          <span className="-rotate-3 rounded-full bg-caramel-300 px-4 py-1.5 text-xs font-bold tracking-[0.14em] text-espresso uppercase shadow-sticker">
                            {item.badge}
                          </span>
                        ) : null}
                        {!item.available ? (
                          <span className="rotate-2 rounded-full bg-espresso px-4 py-1.5 text-xs font-bold tracking-[0.14em] text-milk-50 uppercase shadow-sticker">
                            Habis
                          </span>
                        ) : null}
                      </div>
                    ) : null}

                    {item.note ? (
                      <HandNote
                        arrow={flip ? "down-left" : "down-right"}
                        arrowSide={flip ? "start" : "end"}
                        className={cn(
                          "absolute -top-12 text-[1.55rem] sm:-top-14 sm:text-[1.8rem]",
                          flip ? "right-2 rotate-3 sm:right-6" : "left-2 -rotate-3 sm:left-6",
                        )}
                      >
                        {item.note}
                      </HandNote>
                    ) : null}
                  </div>
                </div>

                {/* Teks */}
                <div
                  className={cn(
                    "flex flex-col items-center text-center",
                    flip ? "lg:order-1 lg:items-end lg:text-right" : "lg:items-start lg:text-left",
                  )}
                  data-reveal
                >
                  <span
                    aria-hidden="true"
                    className="text-outline font-display text-[5.5rem] leading-[0.8] font-black text-caramel-400 [--outline-width:1.5px] sm:text-[7rem]"
                  >
                    0{index + 1}
                  </span>
                  <Eyebrow centered className={cn("mt-5 lg:justify-start lg:[&>span:last-child]:hidden", flip && "lg:flex-row-reverse")}>
                    {item.categoryLabel}
                  </Eyebrow>
                  <h3
                    id={`menu-${item.id}`}
                    className="mt-4 max-w-[14ch] text-[clamp(2.25rem,6vw,3.75rem)] leading-[1.02] font-bold tracking-[-0.02em] text-espresso"
                  >
                    {item.name}
                  </h3>
                  <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-muted sm:text-xl">{item.description}</p>

                  <div className={cn("mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-4", flip ? "lg:justify-end" : "lg:justify-start")}>
                    {item.available ? (
                      <ButtonLink href={whatsappItemLink(item)} external variant="primary" size="lg">
                        <WhatsAppIcon />
                        Pesan sekarang
                      </ButtonLink>
                    ) : null}
                    <button
                      type="button"
                      onClick={(event) => openItem(item, event.currentTarget)}
                      className="rounded-full px-1 py-2 font-bold text-caramel-700 underline decoration-caramel-300 decoration-2 underline-offset-[6px] transition-colors hover:text-caramel-800 hover:decoration-caramel-500"
                    >
                      {item.available ? "Lihat detail" : "Detail & info restock"}
                    </button>
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ol>

      {/* Menu lainnya menyusul: slot template dengan gambar kosong */}
      {upcoming.length > 0 ? (
        <div className="mt-32 flex w-full flex-col items-center gap-12 sm:mt-40 lg:px-6">
          <div className="flex max-w-2xl flex-col items-center text-center" data-reveal>
            <Eyebrow centered className="mb-6">
              Segera hadir
            </Eyebrow>
            <h3 className="text-[clamp(2.25rem,5.5vw,3.75rem)] leading-none font-black tracking-[-0.02em] text-espresso uppercase">
              Menu lainnya{" "}
              <span className="font-wonky font-medium text-caramel-500 normal-case italic">menyusul</span>
            </h3>
            <p className="mt-6 text-lg leading-relaxed text-ink-muted">
              Varian baru sedang kami siapkan di dapur. Pantau terus supaya kamu jadi yang pertama mencoba.
            </p>
          </div>

          <ul className="grid w-full grid-cols-2 gap-x-4 gap-y-10 sm:gap-8 lg:grid-cols-3">
            {upcoming.map((menu, index) => (
              <li key={menu.id} data-reveal>
                <article className="flex h-full flex-col items-center text-center">
                  <div
                    className={cn(
                      "relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] shadow-card ring-4 ring-white sm:rounded-[2.5rem]",
                      index % 2 === 0 ? "-rotate-1" : "rotate-1",
                    )}
                  >
                    {menu.image ? (
                      <Image
                        src={menu.image}
                        alt={`Foto ${menu.name}`}
                        fill
                        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 50vw"
                        className="object-cover"
                      />
                    ) : (
                      <EmptyImage name={menu.name} label="Segera hadir" />
                    )}
                  </div>
                  <h4 className="mt-5 font-display text-xl font-bold text-espresso sm:mt-6 sm:text-2xl">{menu.name}</h4>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-muted sm:text-base">{menu.teaser}</p>
                </article>
              </li>
            ))}

            <li data-reveal className="col-span-2 lg:col-span-1">
              <a
                href={instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="on-dark group relative flex h-full min-h-[20rem] flex-col items-center justify-center gap-5 overflow-hidden rounded-[2rem] bg-espresso p-8 text-center text-milk-50 shadow-pop transition-transform duration-500 ease-out-soft hover:-translate-y-1 sm:rounded-[2.5rem]"
              >
                <span aria-hidden="true" className="bg-grain pointer-events-none absolute inset-0 opacity-40" />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-24 -right-20 size-64 rounded-full bg-[radial-gradient(closest-side,rgb(212_138_56/0.35),transparent)]"
                />
                <span className="relative grid size-16 place-items-center rounded-full bg-caramel-600 text-white shadow-sticker transition-transform duration-500 ease-jelly group-hover:-rotate-12">
                  <InstagramIcon className="size-7" />
                </span>
                <span className="font-wonky relative font-display text-3xl font-medium italic">Jadi yang pertama tahu</span>
                <span className="relative max-w-xs leading-relaxed text-milk-50/80">
                  Ikuti {instagram.handle} untuk kabar menu baru &amp; promo.
                </span>
                <span className="relative rounded-full bg-caramel-300 px-6 py-3 text-sm font-bold tracking-[0.14em] text-espresso uppercase">
                  Ikuti Instagram
                </span>
              </a>
            </li>
          </ul>
        </div>
      ) : null}

      <MenuDialog item={selected} onClosed={handleClosed} />
    </div>
  );
}

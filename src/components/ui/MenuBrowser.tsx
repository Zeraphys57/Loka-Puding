"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { FilterPills } from "@/components/ui/FilterPills";
import { MenuDialog } from "@/components/ui/MenuDialog";
import { cn } from "@/lib/cn";
import type { MenuCategoryView, MenuItemView } from "@/lib/menu";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const ALL = "semua";

type MenuBrowserProps = {
  items: MenuItemView[];
  categories: MenuCategoryView[];
};

export function MenuBrowser({ items, categories }: MenuBrowserProps) {
  const [active, setActive] = useState<string>(ALL);
  const [selected, setSelected] = useState<MenuItemView | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const options = [{ id: ALL, label: "Semua" }, ...categories];
  const isVisible = (item: MenuItemView) => active === ALL || item.category === active;
  const visibleItems = items.filter(isVisible);

  function openItem(item: MenuItemView, trigger: HTMLButtonElement) {
    triggerRef.current = trigger;
    setSelected(item);
  }

  function handleClosed() {
    setSelected(null);
    triggerRef.current?.focus({ preventScroll: true });
  }

  return (
    <div className="flex flex-col w-full">
      
      {/* Category Filters (Optional, kept for functionality) */}
      <div className="flex flex-col items-center gap-4 z-10 mb-16" data-reveal>
        <FilterPills label="Filter kategori menu" options={options} active={active} onChange={setActive} />
      </div>

      {/* ZIG-ZAG EDITORIAL LAYOUT */}
      <div className="flex flex-col gap-24 sm:gap-32 w-full lg:px-8">
        {visibleItems.map((item, index) => {
          // index 0: Image Left, index 1: Image Right
          const isEven = index % 2 !== 0; 
          
          return (
            <div 
              key={item.id} 
              className={cn(
                "flex flex-col lg:flex-row gap-10 lg:gap-20 items-center justify-between group",
                isEven ? "lg:flex-row-reverse" : ""
              )}
            >
              
              {/* Massive Image Half */}
              <div className="w-full lg:w-1/2 relative" data-reveal="rise">
                <div className="relative w-full aspect-[4/5] sm:aspect-square lg:aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-[#c27a29]/10 border-8 border-white/50">
                  <Image
                    src={item.image}
                    alt={item.imageAlt}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className={cn(
                      "object-cover transition-transform duration-1000 ease-[cubic-bezier(0.87,0,0.13,1)] group-hover:scale-105",
                      !item.available && "opacity-80 grayscale-[0.7]"
                    )}
                  />
                  
                  {/* Tags */}
                  {(item.badge || !item.available) && (
                    <div className="absolute top-6 left-6 flex flex-wrap gap-2 z-20">
                      {item.badge ? (
                        <div className="px-4 py-1.5 text-xs font-bold tracking-widest uppercase rounded-full bg-[#c27a29] text-white shadow-md backdrop-blur-sm border border-white/20">
                          {item.badge}
                        </div>
                      ) : null}
                      {!item.available ? (
                        <div className="px-4 py-1.5 text-xs font-bold tracking-widest uppercase rounded-full bg-red-600/90 text-white backdrop-blur-sm shadow-md border border-white/20">
                          Habis
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
                
                {/* Decorative Element Behind Image */}
                <div className={cn(
                  "absolute -z-10 w-full h-full bg-[#ffebd6]/40 rounded-[2.5rem] -bottom-6",
                  isEven ? "-left-6" : "-right-6"
                )} />
              </div>

              {/* Editorial Content Half */}
              <div 
                className={cn(
                  "w-full lg:w-1/2 flex flex-col items-center text-center",
                  isEven ? "lg:items-end lg:text-right" : "lg:items-start lg:text-left"
                )}
                data-reveal="rise"
              >
                <div className={cn(
                  "flex items-center gap-4 mb-6",
                  isEven ? "lg:flex-row-reverse" : ""
                )}>
                  <div className="h-[1px] w-12 bg-[#c27a29]/30"></div>
                  <p className="text-[#c27a29] uppercase tracking-[0.3em] font-bold text-xs">
                    {item.categoryLabel}
                  </p>
                  <div className="h-[1px] w-12 bg-[#c27a29]/30 lg:hidden"></div>
                </div>

                <h3 className={`text-4xl sm:text-5xl lg:text-[4rem] leading-[1.1] font-black text-ink mb-6 ${playfair.className}`}>
                  {item.name}
                </h3>
                
                <p className="text-lg sm:text-xl text-ink-muted leading-relaxed max-w-lg mb-10">
                  {item.description}
                </p>
                
                <div className={cn(
                  "flex flex-col sm:flex-row items-center gap-6 sm:gap-10",
                  isEven ? "lg:flex-row-reverse" : ""
                )}>
                  <p className="text-3xl sm:text-4xl font-bold text-[#c27a29]">
                    {item.priceLabel}
                  </p>
                  
                  <button
                    type="button"
                    onClick={(e) => openItem(item, e.currentTarget)}
                    className="px-8 py-4 bg-ink text-white rounded-full font-bold uppercase tracking-widest text-sm transition-all duration-300 hover:bg-[#c27a29] hover:shadow-xl hover:shadow-[#c27a29]/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#c27a29]/50 active:scale-95"
                  >
                    Detail & Pesan
                  </button>
                </div>
              </div>
              
            </div>
          );
        })}
      </div>

      <MenuDialog item={selected} onClosed={handleClosed} />
    </div>
  );
}

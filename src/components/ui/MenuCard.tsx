import Image from "next/image";
import { cn } from "@/lib/cn";
import type { MenuItemView } from "@/lib/menu";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

type MenuCardProps = {
  item: MenuItemView;
  onSelect: (item: MenuItemView, trigger: HTMLButtonElement) => void;
};

export function MenuCard({ item, onSelect }: MenuCardProps) {
  return (
    <article data-card className="group relative h-full flex flex-col">
      <div className="flex flex-col h-full rounded-[2.5rem] bg-transparent transition-all duration-500 group-hover:-translate-y-2">
        
        {/* Image Frame (Massive and Elegant) */}
        <div className="relative w-full aspect-[4/5] overflow-hidden rounded-[2.5rem] bg-[#ffebd6]/30 shadow-lg shadow-[#c27a29]/5 transition-shadow duration-500 group-hover:shadow-2xl group-hover:shadow-[#c27a29]/20 border border-white">
          <Image
            src={item.image}
            alt={item.imageAlt}
            fill
            sizes="(min-width: 1280px) 290px, (min-width: 768px) 31vw, 46vw"
            className={cn(
              "object-cover transition-transform duration-1000 ease-[cubic-bezier(0.87,0,0.13,1)] group-hover:scale-110",
              !item.available && "opacity-80 grayscale-[0.7]",
            )}
          />
          {/* Soft Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          
          {item.badge || !item.available ? (
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              {item.badge ? (
                <div className="px-4 py-1.5 text-[0.65rem] font-bold tracking-widest uppercase rounded-full bg-[#c27a29] text-white shadow-md backdrop-blur-sm border border-white/20">
                  {item.badge}
                </div>
              ) : null}
              {!item.available ? (
                <div className="px-4 py-1.5 text-[0.65rem] font-bold tracking-widest uppercase rounded-full bg-ink/70 text-white backdrop-blur-sm shadow-md border border-white/10">
                  Habis
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Content Section (Detached below image) */}
        <div className="flex flex-1 flex-col pt-6 pb-2 text-center items-center">
          <p className="text-[0.65rem] font-bold tracking-[0.3em] text-[#c27a29] uppercase mb-2">
            {item.categoryLabel}
          </p>
          <h3 className={`text-2xl sm:text-3xl leading-tight font-black text-ink mb-3 ${playfair.className}`}>
            <button
              type="button"
              onClick={(event) => onSelect(item, event.currentTarget)}
              className={cn(
                "focus-visible:outline-none transition-colors duration-300 group-hover:text-[#c27a29]",
                "after:absolute after:inset-0 after:z-10 after:rounded-[2.5rem] after:content-['']",
              )}
            >
              {item.name}
            </button>
          </h3>
          <p className="line-clamp-2 text-sm sm:text-base leading-relaxed text-ink-muted px-2">
            {item.description}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <span className="h-[1px] w-6 bg-[#c27a29]/30"></span>
            <p className="font-sans text-lg font-bold text-[#c27a29]">
              {item.priceLabel}
            </p>
            <span className="h-[1px] w-6 bg-[#c27a29]/30"></span>
          </div>
        </div>

      </div>
    </article>
  );
}

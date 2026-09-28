import Image from "next/image";
import { EmptyImage } from "@/components/ui/EmptyImage";
import { cn } from "@/lib/cn";
import type { MenuItemView } from "@/lib/menu";

type MenuCardProps = {
  item: MenuItemView;
  onSelect: (item: MenuItemView, trigger: HTMLButtonElement) => void;
};

export function MenuCard({ item, onSelect }: MenuCardProps) {
  return (
    <article data-card className="group relative h-full flex flex-col">
      <div className="flex flex-col h-full rounded-[2.5rem] bg-transparent transition-all duration-500 group-hover:-translate-y-2">
        
        {/* Image Frame (Massive and Elegant) */}
        <div className="relative w-full aspect-[4/5] overflow-hidden rounded-[2.5rem] bg-caramel-50 shadow-card transition-shadow duration-500 group-hover:shadow-pop border border-white">
          {item.image ? (
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
          ) : (
            <EmptyImage name={item.name} />
          )}
          {/* Soft Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          
          {item.badge || !item.available ? (
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              {item.badge ? (
                <div className="px-4 py-1.5 text-xs font-bold tracking-widest uppercase rounded-full bg-caramel-600 text-white shadow-md backdrop-blur-sm border border-white/20">
                  {item.badge}
                </div>
              ) : null}
              {!item.available ? (
                <div className="px-4 py-1.5 text-xs font-bold tracking-widest uppercase rounded-full bg-ink/70 text-white backdrop-blur-sm shadow-md border border-white/10">
                  Habis
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Content Section (Detached below image) */}
        <div className="flex flex-1 flex-col pt-6 pb-2 text-center items-center">
          <p className="text-xs font-bold tracking-[0.3em] text-caramel-700 uppercase mb-2">
            {item.categoryLabel}
          </p>
          <h3 className={`text-2xl sm:text-3xl leading-tight font-black text-ink mb-3 font-display`}>
            <button
              type="button"
              onClick={(event) => onSelect(item, event.currentTarget)}
              className={cn(
                "focus-visible:outline-none transition-colors duration-300 group-hover:text-caramel-700",
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
            <span className="h-[1px] w-6 bg-caramel-500/40"></span>
            <p className="font-sans text-lg font-bold text-caramel-700">
              {item.priceLabel}
            </p>
            <span className="h-[1px] w-6 bg-caramel-500/40"></span>
          </div>
        </div>

      </div>
    </article>
  );
}

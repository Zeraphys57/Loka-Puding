import { Fragment, type CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { dripMaskUrl } from "@/lib/drip";

const DRIP_MASK = dripMaskUrl({ width: 520, height: 72, band: 6, seed: 29, count: 7 });

type MarqueeProps = {
  items: readonly string[];
  className?: string;
};

/**
 * Pita karamel dengan teks berjalan, lalu "meleleh" ke section di bawahnya.
 * Dekoratif (aria-hidden); gerakannya berhenti otomatis untuk pengguna "kurangi gerakan".
 */
export function Marquee({ items, className }: MarqueeProps) {
  const row = (copy: number) => (
    <div className="flex shrink-0 items-center">
      {items.map((item, index) => (
        <Fragment key={`${copy}-${item}`}>
          <span
            className={cn(
              "px-5 font-display leading-none whitespace-nowrap sm:px-7",
              index % 2 === 0
                ? "text-[1.65rem] font-black tracking-tight uppercase sm:text-[2.1rem]"
                : "font-wonky text-[1.9rem] font-medium italic sm:text-[2.4rem]",
            )}
          >
            {item}
          </span>
          <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-caramel-300 sm:size-6" aria-hidden="true" focusable="false">
            <path d="M12 2.5l2.2 7.3L21.5 12l-7.3 2.2L12 21.5l-2.2-7.3L2.5 12l7.3-2.2z" fill="currentColor" />
          </svg>
        </Fragment>
      ))}
    </div>
  );

  return (
    <div aria-hidden="true" className={cn("relative z-20 select-none", className)}>
      <div className="relative overflow-hidden bg-caramel-600 py-3.5 text-milk-50 sm:py-4">
        <div className="flex w-max animate-marquee motion-reduce:animate-none">
          {row(0)}
          {row(1)}
        </div>
      </div>
      {/* Lelehan: lanjutan warna pita yang menetes ke section berikutnya */}
      <div
        className="drip-mask pointer-events-none absolute inset-x-0 top-full -mt-px h-12 bg-caramel-600 sm:h-16"
        style={{ "--drip-mask": DRIP_MASK, "--drip-tile": "520px" } as CSSProperties}
      />
    </div>
  );
}

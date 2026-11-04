import Image from "next/image";
import { cn } from "@/lib/cn";
import type { BundlePart } from "@/lib/menu";

const TILTS = ["-rotate-6", "rotate-3", "-rotate-2", "rotate-6"];

/**
 * Foto bulat puding-puding isi paket, saling menumpuk sedikit.
 * Ukuran tiap foto diatur pemanggil lewat `[--bundle-photo:…]` (default 4rem).
 */
export function BundlePhotos({ parts, className }: { parts: BundlePart[]; className?: string }) {
  return (
    <ul className={cn("flex items-center", className)}>
      {parts.map((part, index) => (
        <li
          key={`${part.name}-${index}`}
          className={cn(
            "relative -ml-[calc(var(--bundle-photo,4rem)*0.22)] size-[var(--bundle-photo,4rem)] shrink-0 overflow-hidden rounded-full bg-custard shadow-sticker ring-[3px] ring-white first:ml-0",
            TILTS[index % TILTS.length],
          )}
        >
          {part.image ? <Image src={part.image} alt={part.imageAlt} fill sizes="9rem" className="object-cover" /> : null}
        </li>
      ))}
    </ul>
  );
}

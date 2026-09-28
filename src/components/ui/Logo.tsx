import { cn } from "@/lib/cn";

/** Ikon puding dua lapis (biru-putih). Dipakai di navbar, footer, dan favicon. */
export function PuddingMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" focusable="false">
      <ellipse cx="24" cy="41" rx="20" ry="4" fill="#dcebff" />
      <path
        d="M10 38.6c.6-4.2 1.2-7.6 2-10.1h24c.8 2.5 1.4 5.9 2 10.1-4.1 1.5-8.8 2.1-14 2.1s-9.9-.6-14-2.1z"
        fill="#ffffff"
        stroke="#1e4fd8"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 28.5c.7-5.6 1.5-9.5 2.5-12.3.8-2.4 4.2-3.7 9.5-3.7s8.7 1.3 9.5 3.7c1 2.8 1.8 6.7 2.5 12.3z"
        fill="#1e4fd8"
      />
      <path
        d="M17.3 17.2c.5-1.3 1.9-2 3.8-2.3"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        opacity=".75"
      />
      <path
        d="M18.5 12.8c0-2.3 2.5-3.6 5.5-3.6s5.5 1.3 5.5 3.6c-1.6.7-3.4 1-5.5 1s-3.9-.3-5.5-1z"
        fill="#ffffff"
        stroke="#1e4fd8"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="7" r="2.6" fill="#0b1b3f" />
    </svg>
  );
}

/**
 * Logo teks "Loka Puding". Letakkan di dalam elemen ber-class `group/logo`
 * agar ikonnya bergoyang saat hover. `tone="light"` untuk latar biru.
 */
export function Logo({ className, tone = "default" }: { className?: string; tone?: "default" | "light" }) {
  const light = tone === "light";
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className={cn("grid shrink-0 place-items-center", light && "size-11 rounded-full bg-white")}>
        <PuddingMark className="size-9 origin-bottom group-hover/logo:animate-jiggle-tap" />
      </span>
      <span
        className={cn(
          "font-display text-[1.35rem] leading-none font-semibold tracking-tight whitespace-nowrap",
          light ? "text-white" : "text-ink",
        )}
      >
        Loka <span className={light ? "text-primary-soft" : "text-primary"}>Puding</span>
      </span>
    </span>
  );
}

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type ArrowDirection = "down-left" | "down-right" | "up-left" | "up-right";

type HandNoteProps = {
  children: ReactNode;
  /** Arah panah coretan tangan; kosongkan jika tanpa panah */
  arrow?: ArrowDirection;
  /** Panah di sisi mana dari teks */
  arrowSide?: "start" | "end";
  className?: string;
};

// Panah melengkung "coretan spidol" (dasar: menunjuk ke kanan-bawah), arah lain lewat flip
const FLIP: Record<ArrowDirection, string> = {
  "down-right": "",
  "down-left": "-scale-x-100",
  "up-right": "-scale-y-100",
  "up-left": "-scale-100",
};

function ScribbleArrow({ direction }: { direction: ArrowDirection }) {
  return (
    <svg
      viewBox="0 0 64 56"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-[1.6em] w-[1.8em] shrink-0", FLIP[direction])}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M6 6c10 2 22 9 28 19s8 17 20 22" />
      <path d="M40 48.5 54.5 47l-4-13" />
    </svg>
  );
}

/**
 * Catatan kecil bergaya tulisan tangan (font Caveat), seperti coretan di kartu resep.
 * Murni dekoratif: disembunyikan dari pembaca layar.
 */
export function HandNote({ children, arrow, arrowSide = "end", className }: HandNoteProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none inline-flex items-end gap-1 font-hand text-[1.6rem] leading-none text-caramel-700 select-none",
        arrowSide === "start" && "flex-row-reverse",
        className,
      )}
    >
      <span className="whitespace-nowrap">{children}</span>
      {arrow ? <ScribbleArrow direction={arrow} /> : null}
    </span>
  );
}

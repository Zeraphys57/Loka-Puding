import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "light" | "dark" | "caramel" | "milk";

type EyebrowProps = {
  children: ReactNode;
  /** Garis di kedua sisi (untuk judul rata tengah) */
  centered?: boolean;
  /**
   * light/dark: latar terang/gelap (warna palet aktif).
   * caramel/milk: di atas lapisan puding (warna produk, tidak ikut palet).
   */
  tone?: Tone;
  className?: string;
};

const TEXT: Record<Tone, string> = {
  light: "text-caramel-700",
  dark: "text-caramel-300",
  caramel: "text-pudding-cream",
  milk: "text-pudding-caramel-700",
};

const LINE: Record<Tone, string> = {
  light: "bg-caramel-500/60",
  dark: "bg-caramel-300/60",
  caramel: "bg-pudding-cream/50",
  milk: "bg-pudding-caramel-700/50",
};

/** Label kecil di atas judul section: huruf kapital renggang + garis tipis. */
export function Eyebrow({ children, centered, tone = "light", className }: EyebrowProps) {
  const line = cn("h-px w-10 shrink-0", LINE[tone]);
  return (
    <p
      className={cn(
        "flex items-center gap-3 text-xs font-bold tracking-[0.22em] uppercase",
        TEXT[tone],
        centered && "justify-center",
        className,
      )}
    >
      <span aria-hidden="true" className={line} />
      {children}
      {centered ? <span aria-hidden="true" className={line} /> : null}
    </p>
  );
}

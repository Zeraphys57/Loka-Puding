import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "light" | "dark" | "caramel" | "milk";

type EyebrowProps = {
  children: ReactNode;
  /** Bintang di kedua sisi (untuk judul rata tengah) */
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

const MARK: Record<Tone, string> = {
  light: "text-caramel-500",
  dark: "text-caramel-300",
  caramel: "text-pudding-caramel-200",
  milk: "text-pudding-caramel-500",
};

/**
 * Bintang kecil berujung empat (sama dengan bintang di stiker "100% homemade" pada hero).
 * Dipakai sebagai penanda label, menggantikan garis panjang.
 */
export function EyebrowMark({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("inline-flex shrink-0", className)}>
      <svg viewBox="0 0 12 12" focusable="false" className="size-[0.7rem] fill-current">
        <path d="M6 0l1.6 4.4L12 6 7.6 7.6 6 12 4.4 7.6 0 6l4.4-1.6z" />
      </svg>
    </span>
  );
}

/** Label kecil di atas judul section: huruf kapital renggang + bintang kecil. */
export function Eyebrow({ children, centered, tone = "light", className }: EyebrowProps) {
  return (
    <p
      className={cn(
        "flex items-center gap-2.5 text-xs font-bold tracking-[0.22em] uppercase",
        TEXT[tone],
        centered && "justify-center",
        className,
      )}
    >
      <EyebrowMark className={MARK[tone]} />
      {children}
      {centered ? <EyebrowMark className={MARK[tone]} /> : null}
    </p>
  );
}

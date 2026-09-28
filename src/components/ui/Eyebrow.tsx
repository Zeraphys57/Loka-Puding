import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type EyebrowProps = {
  children: ReactNode;
  /** Garis di kedua sisi (untuk judul rata tengah) */
  centered?: boolean;
  /** Latar gelap: teks & garis toffee */
  tone?: "light" | "dark";
  className?: string;
};

/** Label kecil di atas judul section: huruf kapital renggang + garis karamel. */
export function Eyebrow({ children, centered, tone = "light", className }: EyebrowProps) {
  const line = cn("h-px w-10 shrink-0", tone === "dark" ? "bg-caramel-300/60" : "bg-caramel-500/60");
  return (
    <p
      className={cn(
        "flex items-center gap-3 text-xs font-bold tracking-[0.22em] uppercase",
        tone === "dark" ? "text-caramel-300" : "text-caramel-700",
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

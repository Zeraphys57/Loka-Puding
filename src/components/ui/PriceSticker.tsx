import { cn } from "@/lib/cn";

/** Stiker harga bulat bergaya label toples: "Rp" kecil di atas, angka besar di bawah. */
export function PriceSticker({ label, className }: { label: string; className?: string }) {
  const amount = label.replace(/^Rp\s?/, "");
  return (
    <span
      className={cn(
        "grid size-[6.25rem] place-items-center rounded-full bg-caramel-600 text-white shadow-sticker ring-4 ring-milk-50 sm:size-28",
        className,
      )}
    >
      <span className="flex size-[85%] flex-col items-center justify-center rounded-full border-2 border-dashed border-white/40 leading-none">
        <span className="text-xs font-bold tracking-[0.18em] uppercase">Rp</span>
        <span className="mt-1 font-display text-[1.45rem] font-black tracking-tight sm:text-[1.65rem]">{amount}</span>
      </span>
    </span>
  );
}

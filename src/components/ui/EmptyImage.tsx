import { cn } from "@/lib/cn";

type EmptyImageProps = {
  /** Nama menu (untuk pembaca layar; judulnya sudah tampil di samping/bawah gambar) */
  name?: string;
  label?: string;
  className?: string;
};

/**
 * Template "gambar kosong": tampil otomatis selama foto menu belum ada.
 * Mengisi penuh wadah ber-`position: relative` (sama seperti <Image fill>).
 */
export function EmptyImage({ name, label = "Foto segera hadir", className }: EmptyImageProps) {
  return (
    <div
      role="img"
      aria-label={name ? `Foto ${name} segera hadir` : label}
      className={cn("bg-gingham absolute inset-0 grid place-items-center overflow-hidden [--gingham-size:22px]", className)}
    >
      <div
        aria-hidden="true"
        className="absolute inset-3 rounded-[1.5rem] border-2 border-dashed border-caramel-500/30 sm:inset-5 sm:rounded-[2rem]"
      />
      <div aria-hidden="true" className="relative flex flex-col items-center gap-3 px-4 text-center">
        <span className="font-wonky grid size-16 place-items-center rounded-full bg-milk-50 font-display text-4xl font-medium text-caramel-600 italic shadow-sticker ring-1 ring-sand sm:size-20 sm:text-5xl">
          ?
        </span>
        {/* Stempel "segera hadir"; karamel tua agar teks kecil tetap kontras (≥ 4.5:1) */}
        <span className="-rotate-6 rounded-md border-2 border-caramel-700 bg-milk-50/90 px-2.5 py-1 text-[0.7rem] font-bold tracking-[0.18em] text-caramel-700 uppercase sm:text-xs">
          {label}
        </span>
      </div>
    </div>
  );
}

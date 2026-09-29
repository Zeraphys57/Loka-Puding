/**
 * Palet warna website. Ganti `palette` untuk berpindah; seluruh website mengikuti
 * (nilai warnanya ada di src/app/globals.css).
 *
 * - "karamel": palet utama: krem susu, karamel, espresso
 * - "biru":    alternatif biru pastel, diambil dari taplak gingham di foto produk
 *
 * Warna produk (puding di hero, logo, navbar karamel, penampang puding di Kisah Kami)
 * sengaja tidak ikut berubah: pudingnya tetap karamel apa pun paletnya.
 */
export type Palette = "biru" | "karamel";

export const palette: Palette = "karamel";

/** Warna untuk browser (bilah alamat di HP) & manifest aplikasi. */
export const paletteColors: Record<Palette, { background: string; brand: string }> = {
  biru: { background: "#f3f7fc", brand: "#3c66a3" },
  karamel: { background: "#fbf6ee", brand: "#a0561a" },
};

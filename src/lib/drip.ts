/**
 * Mask SVG untuk tepi "lelehan karamel": pita tipis di atas + tetesan menggantung.
 * Dibuat sekali (deterministik, tanpa Math.random) sehingga hasil server & browser sama.
 * Dipakai lewat utilitas CSS `drip-mask` + variabel `--drip-mask` (lihat globals.css).
 */

type DripOptions = {
  /** Lebar satu ubin (px). Ubin diulang horizontal, jadi proporsi tetes sama di layar mana pun. */
  width?: number;
  height?: number;
  /** Tebal pita atas sebelum tetesan mulai */
  band?: number;
  seed?: number;
  count?: number;
  /** Pengali lebar tetesan (1 = normal, <1 = lebih ramping) */
  thickness?: number;
};

function random(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

export function dripPath({ width = 480, height = 64, band = 10, seed = 11, count = 6, thickness = 1 }: DripOptions = {}): string {
  const rand = random(seed);
  const slot = width / count;
  const drips = Array.from({ length: count }, (_, i) => {
    const half = (7 + rand() * 9) * thickness; // setengah lebar leher tetesan
    const bulb = half * (0.62 + rand() * 0.25); // jari-jari ujung tetesan (lebih ramping dari lehernya)
    const length = band + 8 + Math.pow(rand(), 1.6) * (height - band - 12);
    const center = slot * i + half + 4 + rand() * (slot - 2 * half - 8);
    return { center, half, bulb, length };
  });

  const f = (n: number) => Math.round(n * 10) / 10;
  let d = `M0 0H${width}V${band}`;
  // Telusuri tepi bawah pita dari kanan ke kiri, turun ke setiap tetesan lalu naik lagi
  for (const { center: c, half: w, bulb: r, length: l } of [...drips].reverse()) {
    d += `H${f(c + w)}`;
    d += `C${f(c + w * 0.35)} ${f(band + 1.5)} ${f(c + r)} ${f(band + (l - band) * 0.4)} ${f(c + r)} ${f(l - r)}`;
    d += `A${f(r)} ${f(r)} 0 0 1 ${f(c - r)} ${f(l - r)}`;
    d += `C${f(c - r)} ${f(band + (l - band) * 0.4)} ${f(c - w * 0.35)} ${f(band + 1.5)} ${f(c - w)} ${band}`;
  }
  return `${d}H0Z`;
}

/** Nilai `url(...)` siap pakai untuk `--drip-mask`. */
export function dripMaskUrl(options: DripOptions = {}): string {
  const { width = 480, height = 64 } = options;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none"><path d="${dripPath(options)}"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

import { cn } from "@/lib/cn";

/*
 * Alat dapur di "meja" (latar Kisah Kami → Menu dianggap satu meja putih panjang), dilihat dari atas.
 * Murni dekorasi: tersembunyi dari pembaca layar, tidak bisa diklik, hanya di layar lebar (pemanggil mengatur posisi).
 */

const SHADOW = "drop-shadow-[0_6px_8px_color-mix(in_srgb,var(--color-espresso)_22%,transparent)]";

/**
 * Tali kue biru-putih (baker's twine). Dua lapis garis: dasar putih + belang biru putus-putus = pilinan.
 * SVG-nya direntang mengikuti kotak pemanggil; `non-scaling-stroke` menjaga tebal & belang tetap.
 */
export function TwineStroke({ d }: { d: string }) {
  return (
    <>
      <path d={d} fill="none" stroke="#fff" strokeWidth={4.5} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <path
        d={d}
        fill="none"
        className="stroke-caramel-500"
        strokeWidth={4.5}
        strokeDasharray="2.5 3.5"
        vectorEffect="non-scaling-stroke"
      />
    </>
  );
}

/**
 * Tali di Kisah Kami: muncul dari bawah serbet, berkelok turun, keluar tegak di tepi bawah section (x tengah kotak).
 * Lanjutannya di section Menu (`MenuTwine`) mulai dari tepi atas di x yang sama: 94% lebar section − 72px,
 * jadi pemanggil wajib memakai `right-[6%] w-36`.
 */
export function Twine({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 100 600"
      preserveAspectRatio="none"
      className={cn("pointer-events-none absolute overflow-visible", SHADOW, className)}
    >
      <TwineStroke d="M0 0C55 40 95 150 70 260S20 430 45 520 50 560 50 600" />
    </svg>
  );
}

/** Pensil kayu (yang menulis catatan di buku resep), dilihat dari atas; mendatar di viewBox, putar lewat `className`. */
export function Pencil({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 360 28" className={cn("pointer-events-none absolute", SHADOW, className)}>
      {/* Ujung kayu yang diserut & grafit */}
      <path d="M44 3 8 14l36 11z" fill="#ecd2a8" stroke="#c9a676" strokeWidth={0.8} strokeLinejoin="round" />
      <path d="M18 11 8 14l10 3z" fill="#3d3a3a" />
      <path d="M44 3c-6 3-6 19 0 22" fill="none" stroke="#d8b483" strokeWidth={1} />
      {/* Badan segi enam: tiga sisi kuning dengan terang berbeda */}
      <path d="M44 3h258v7.3H44z" fill="#f7cf55" />
      <path d="M44 10.3h258v7.4H44z" fill="#ebb92f" />
      <path d="M44 17.7h258V25H44z" fill="#d7a21f" />
      <path d="M50 6.4h246" stroke="#fff3c4" strokeWidth={1.4} strokeLinecap="round" opacity={0.8} />
      {/* Ring logam & penghapus */}
      <rect x={302} y={2.5} width={26} height={23} fill="#c7ced8" stroke="#959fae" strokeWidth={0.8} />
      <path d="M308 2.5v23M314 2.5v23M320 2.5v23" stroke="#9aa4b3" strokeWidth={1} />
      <path d="M328 2.5h20q8 0 8 8v7q0 8-8 8h-20z" fill="#ef9aa6" stroke="#d27886" strokeWidth={0.8} />
      <path d="M332 7h16" stroke="#f9c6cd" strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

/** Pengocok (whisk) baja dengan proporsi asli (kawat ±55%, gagang ±40%), dilihat dari atas. */
export function Whisk({ className }: { className?: string }) {
  const wires = [50, 36, 22, 8];
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 120 470" className={cn("pointer-events-none absolute", SHADOW, className)}>
      <g fill="none" stroke="#a3adbc" strokeWidth={2.2} strokeLinecap="round">
        {wires.map((w) => (
          <path key={w} d={`M60 262C${60 - w} 210 ${60 - w} 24 60 12 ${60 + w} 24 ${60 + w} 210 60 262`} />
        ))}
      </g>
      <g fill="none" stroke="#eef2f7" strokeWidth={0.9} strokeLinecap="round" opacity={0.9}>
        {wires.map((w) => (
          <path key={w} d={`M59 254C${61 - w} 206 ${61 - w} 28 59 17`} />
        ))}
      </g>
      <rect x={51} y={252} width={18} height={30} rx={5} fill="#b5bfcb" stroke="#8a96a7" strokeWidth={1} />
      <rect x={49} y={280} width={22} height={182} rx={11} fill="#cdd5df" stroke="#8a96a7" strokeWidth={1.2} />
      <path d="M55 290v160" stroke="#f1f4f8" strokeWidth={2.6} strokeLinecap="round" />
      <circle cx={60} cy={446} r={3.8} className="fill-milk" stroke="#8a96a7" strokeWidth={1} />
    </svg>
  );
}

// Butiran tepung yang tercecer di sekitar tumpukan: [x, y, r]
const FLOUR_SPECKS: [number, number, number][] = [
  [28, 96, 2.2], [40, 150, 1.6], [22, 128, 1.2], [70, 196, 1.8], [118, 206, 1.3], [196, 204, 2], [250, 192, 1.4],
  [292, 160, 2.2], [302, 118, 1.5], [286, 70, 1.8], [240, 30, 1.3], [180, 22, 2], [112, 26, 1.5], [62, 48, 1.9],
  [312, 96, 1.1], [14, 170, 1.4], [150, 214, 1.1], [270, 210, 1.2],
];

/** Tepung tumpah: lapisan debu tipis, tumpukan utama berpinggir kasar, sedikit volume, dan butiran tercecer. */
export function FlourSpill({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 320 220"
      className={cn(
        "pointer-events-none absolute overflow-visible drop-shadow-[0_1px_1.5px_color-mix(in_srgb,var(--color-espresso)_14%,transparent)]",
        className,
      )}
    >
      <defs>
        <filter id="tepung-tepi" x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves={3} seed={5} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={26} xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation={1.1} result="b" />
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={1} seed={3} result="g" />
          <feColorMatrix in="g" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -2.2 2.05" result="ga" />
          <feComposite in="b" in2="ga" operator="in" />
        </filter>
        <filter id="tepung-debu" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves={2} seed={9} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={34} xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation={4} result="b" />
          <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves={1} seed={8} result="g" />
          <feColorMatrix in="g" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -3 2.3" result="ga" />
          <feComposite in="b" in2="ga" operator="in" />
        </filter>
      </defs>
      <path
        d="M30 118C24 66 84 30 146 38 214 22 292 58 298 108 306 170 236 206 170 198 110 214 40 186 30 118Z"
        fill="#fff"
        opacity={0.75}
        filter="url(#tepung-debu)"
      />
      <path
        d="M62 120C52 82 92 54 140 60 190 42 248 64 260 104 278 150 230 180 176 174 130 190 78 170 62 120Z"
        fill="#fffefb"
        filter="url(#tepung-tepi)"
      />
      {/* Sisi teduh & puncak tumpukan */}
      <ellipse cx={168} cy={126} rx={46} ry={26} fill="#dfe5ee" opacity={0.55} filter="url(#tepung-tepi)" />
      <ellipse cx={156} cy={112} rx={34} ry={18} fill="#fff" filter="url(#tepung-tepi)" />
      <g fill="#fff">
        {FLOUR_SPECKS.map(([x, y, r]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
        ))}
      </g>
    </svg>
  );
}

// Tetes air di sekitar genangan: [x, y, r]
const WATER_DROPS: [number, number, number][] = [
  [168, 40, 7],
  [186, 66, 4.5],
  [150, 18, 3.5],
  [24, 110, 5.5],
];

/** Tumpahan air: genangan dengan tepi gelap tipis & kilau putih, plus beberapa tetes. */
export function WaterSpill({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 200 140" className={cn("pointer-events-none absolute overflow-visible", className)}>
      <path
        d="M30 70C22 44 52 26 84 34 108 18 146 28 148 54 152 80 128 92 112 104 92 122 56 118 44 100 34 92 34 82 30 70Z"
        fill="rgb(150 182 222 / 0.18)"
        stroke="rgb(95 128 175 / 0.32)"
        strokeWidth={1.2}
      />
      <path d="M40 66C40 50 58 40 80 42" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" opacity={0.9} />
      <path d="M118 100c12-8 22-16 26-30" fill="none" stroke="rgb(95 128 175 / 0.35)" strokeWidth={1.6} strokeLinecap="round" />
      {WATER_DROPS.map(([x, y, r]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r={r} fill="rgb(150 182 222 / 0.2)" stroke="rgb(95 128 175 / 0.35)" strokeWidth={1} />
          <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.28} fill="#fff" opacity={0.95} />
        </g>
      ))}
    </svg>
  );
}

import { CARAMEL_WALL } from "./puddingProfile";

/**
 * Tata letak topping (biskuit, remahan, butir popcorn) dalam satuan dunia 3D (y = 0 di permukaan piring).
 * Dipakai bersama oleh model 3D (toppings.ts) dan ilustrasi SVG (PuddingFallback.tsx), jadi keduanya selalu
 * identik. Sengaja tanpa three.js supaya aman dipakai di Server Component.
 */

export type Point3 = { x: number; y: number; z: number };

/** Angka acak yang selalu sama untuk seed yang sama (hasil server & browser identik). */
export function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/** Tinggi permukaan atas karamel pada jarak r dari sumbu puding (mengikuti profil lapisan karamel). */
export function caramelTopY(r: number): number {
  for (let i = CARAMEL_WALL.length - 1; i > 0; i--) {
    const [innerR, innerY] = CARAMEL_WALL[i];
    const [outerR, outerY] = CARAMEL_WALL[i - 1];
    if (r >= innerR && r <= outerR) return innerY + ((r - innerR) / (outerR - innerR)) * (outerY - innerY);
  }
  return CARAMEL_WALL[0][1];
}

/** Tinggi permukaan atas piring pada jarak r dari sumbu (mengikuti profil piring di puddingGeometry.ts). */
export function plateTopY(r: number): number {
  if (r < 1.22) return 0;
  if (r < 1.36) return ((r - 1.22) / 0.14) * 0.02;
  return 0.02 + ((r - 1.36) / 0.14) * 0.042;
}

const onCaramel = (x: number, z: number, lift: number): Point3 => ({ x, y: caramelTopY(Math.hypot(x, z)) + lift, z });

/**
 * Titik tempel topping (lihat jiggleShader.ts): `lean` = seberapa ikut condong saat puding bergoyang
 * (1 = diputar penuh seperti biskuit yang berdiri, 0 = hanya ikut bergeser).
 * Titik tempel dengan y ≤ 0 berarti diam di piring.
 */
export type Anchor = Point3 & { lean: number };

/* ------------------------------------------------------------------ */
/*  Popcorn                                                            */
/* ------------------------------------------------------------------ */

export type KernelLayout = {
  center: Point3;
  radius: number;
  anchor: Anchor;
  /** Jatuh di piring (bukan di atas puding) */
  onPlate: boolean;
  rotation: readonly [number, number, number];
  /** Bentuk tonjolan tiap butir */
  seed: number;
};

// Seluruh tumpukan menumpang di satu titik (tengah permukaan karamel): popcorn bergerak bersama sebagai
// satu benda padat, tidak meliuk seperti puding. Tidak ikut condong: tumpukan hanya ikut bergeser.
const PILE_ANCHOR: Anchor = { ...onCaramel(0, 0, 0), lean: 0 };

// Butir yang jatuh ke piring: [x, z, radius]. Semuanya di sisi yang menghadap kamera, sebagian bergerombol
// (seperti sungguh berjatuhan, bukan ditata melingkar)
const ON_PLATE: readonly (readonly [number, number, number])[] = [
  // Gerombolan kiri-depan
  [-0.573, 1.077, 0.11],
  [-0.475, 1.306, 0.095],
  [-0.862, 1.103, 0.08],
  // Kanan-depan
  [0.472, 1.168, 0.1],
  // Sepasang di kanan
  [0.92, 0.72, 0.115],
  [1.261, 0.561, 0.09],
  // Sisi kiri
  [-1.02, 0.4, 0.105],
  [-1.221, -0.215, 0.1],
];

/** Tumpukan berbentuk kubah di atas karamel (3 lapis), beberapa tumpah di tepi, sebagian jatuh ke piring. */
export function popcornLayout(): KernelLayout[] {
  const rand = seededRandom(29092026);
  const spin = seededRandom(1092026);
  const kernels: KernelLayout[] = [];
  const add = (center: Point3, radius: number, anchor: Anchor, onPlate: boolean) =>
    kernels.push({
      center,
      radius,
      anchor,
      onPlate,
      rotation: [spin() * 6.28, spin() * 6.28, spin() * 6.28],
      seed: kernels.length + 1,
    });
  const onTop = (r: number, angleDeg: number, radius: number, lift: number) => {
    const angle = (angleDeg * Math.PI) / 180;
    add(onCaramel(Math.sin(angle) * r, Math.cos(angle) * r, lift), radius, PILE_ANCHOR, false);
  };

  // Lapis 1: menempel & sedikit tenggelam di karamel
  onTop(0, 0, 0.15, 0.08);
  for (let i = 0; i < 7; i++) {
    const radius = 0.13 + rand() * 0.03;
    onTop(0.4 + rand() * 0.05, i * (360 / 7) + 10 + rand() * 14, radius, radius * 0.55);
  }
  // Tumpah di tepi karamel
  for (const angle of [38, 152, 292]) {
    const radius = 0.11 + rand() * 0.02;
    onTop(0.62 + rand() * 0.03, angle + rand() * 10, radius, radius * 0.3);
  }
  // Lapis 2, mengisi celah lapis 1
  for (let i = 0; i < 5; i++) {
    onTop(0.2 + rand() * 0.05, i * 72 + 34 + rand() * 16, 0.13 + rand() * 0.025, 0.26 + rand() * 0.03);
  }
  // Puncak tumpukan
  onTop(0.05, 20, 0.14, 0.46);
  onTop(0.12, 210, 0.12, 0.43);

  // Jatuh ke piring: diam, tidak ikut bergoyang
  for (const [x, z, radius] of ON_PLATE) {
    add({ x, y: plateTopY(Math.hypot(x, z)) + radius * 0.8, z }, radius, { x, y: 0, z, lean: 0 }, true);
  }
  return kernels;
}

/* ------------------------------------------------------------------ */
/*  Biskuit Marie + remahan                                            */
/* ------------------------------------------------------------------ */

export const BISCUIT = {
  radius: 0.45,
  halfThickness: 0.033,
  edge: 0.026,
  /** Condong ke belakang & menyerong (radian) */
  tiltBack: 0.18,
  turn: -0.3,
  /** Tinggi pusat biskuit di atas permukaan karamel (× radius): sisanya tenggelam */
  rise: 0.4,
} as const;

/** Titik pangkal biskuit di permukaan karamel (sedikit di belakang tengah, seperti di foto menu). */
export const BISCUIT_BASE: Point3 = onCaramel(0.06, -0.12, 0);

/** Biskuit berdiri: ikut condong penuh bersama puncak puding. */
export const BISCUIT_ANCHOR: Anchor = { ...BISCUIT_BASE, lean: 1 };

export type CrumbLayout = {
  center: Point3;
  /** Titik tempel di permukaan karamel tepat di bawahnya (lihat jiggleShader.ts) */
  anchor: Anchor;
  /** Jari-jari pecahan (satuan dunia) */
  size: number;
  /** Tebal pecahan: setebal biskuitnya; remahan kecil lebih gempal */
  thickness: number;
  rotation: readonly [number, number, number];
  /** Pengali kecerahan warna (ada yang lebih matang) */
  shade: number;
  /** Sisi patahan yang pucat menghadap ke atas (pecahannya terguling) */
  broken: boolean;
  /** Garis tepi pecahan yang bersudut: [sudut (radian), jarak relatif 0–1], urut melingkar */
  outline: readonly (readonly [number, number])[];
  seed: number;
};

const BISCUIT_THICKNESS = BISCUIT.halfThickness * 2;

// Gundukan remahan tepat di depan pangkal biskuit (menghadap kamera), seperti di foto menu
const PILE = { x: 0.03, z: 0.2, spreadX: 0.4, spreadZ: 0.2, height: 0.03 };
const pileHeight = (x: number, z: number) =>
  PILE.height * Math.exp(-(((x - PILE.x) / PILE.spreadX) ** 2 + ((z - PILE.z) / PILE.spreadZ) ** 2));

// Batas permukaan atas karamel yang masih datar (di luar ini tepinya membulat turun)
const TOP_RADIUS = 0.6;

/** Garis tepi pecahan biskuit: 4–7 sudut tak beraturan. */
function chunkOutline(rand: () => number, corners: number): [number, number][] {
  const start = rand() * Math.PI * 2;
  return Array.from({ length: corners }, (_, i): [number, number] => [
    start + ((i + 0.2 + rand() * 0.6) / corners) * Math.PI * 2,
    0.6 + rand() * 0.4,
  ]);
}

type Tier = {
  count: number;
  size: readonly [number, number];
  /** Sebaran di sekitar gundukan [x, z]; `null` = tersebar di seluruh permukaan karamel */
  spread: readonly [number, number] | null;
  /** Kemiringan maksimum (radian) */
  tilt: number;
  /** Boleh menumpang di atas pecahan lain (kalau tidak, saling menjauh) */
  stack: boolean;
  corners: readonly [number, number];
};

// Dari pecahan besar sampai serbuk halus
const TIERS: readonly Tier[] = [
  { count: 11, size: [0.065, 0.1], spread: [0.42, 0.2], tilt: 0.35, stack: false, corners: [5, 7] },
  { count: 22, size: [0.035, 0.06], spread: [0.46, 0.24], tilt: 0.9, stack: true, corners: [5, 6] },
  { count: 44, size: [0.014, 0.03], spread: null, tilt: 1.4, stack: true, corners: [4, 6] },
  { count: 60, size: [0.006, 0.012], spread: null, tilt: 1.6, stack: true, corners: [4, 5] },
];

/**
 * Remahan biskuit: pecahan besar bersudut menumpuk di depan biskuit (sebagian menumpang di atas yang lain),
 * remahan kecil & serbuk tersebar di seluruh permukaan karamel, paling banyak di sisi depan.
 */
export function crumbLayout(): CrumbLayout[] {
  const rand = seededRandom(12072026);
  const crumbs: CrumbLayout[] = [];
  const placed: { x: number; z: number; size: number; top: number }[] = [];

  const pick = (spread: Tier["spread"]): [number, number] => {
    const angle = rand() * Math.PI * 2;
    const dist = Math.sqrt(rand());
    if (spread) return [PILE.x + Math.cos(angle) * dist * spread[0], PILE.z + Math.sin(angle) * dist * spread[1]];
    // Seluruh permukaan, ±70% di separuh depan
    const r = dist * TOP_RADIUS * 0.97;
    const a = rand() < 0.7 ? (rand() - 0.5) * Math.PI : angle;
    return [Math.sin(a) * r, Math.cos(a) * r];
  };

  for (const tier of TIERS) {
    let left = tier.count;
    for (let attempt = 0; left > 0 && attempt < tier.count * 40; attempt++) {
      const size = tier.size[0] + rand() * (tier.size[1] - tier.size[0]);
      const [x, z] = pick(tier.spread);
      if (Math.hypot(x, z) + size > TOP_RADIUS) continue;
      // Tidak menembus biskuit yang berdiri
      if (Math.abs(z - BISCUIT_BASE.z) < 0.05 + size && Math.abs(x - BISCUIT_BASE.x) < BISCUIT.radius * 0.95) continue;

      const touching = placed.filter((other) => Math.hypot(x - other.x, z - other.z) < (other.size + size) * 0.72);
      if (!tier.stack && touching.length) continue;
      const restOn = touching.reduce((top, other) => Math.max(top, other.top), 0);
      // Pipih seperti pecahan biskuit sungguhan; remahan kecil lebih gempal
      const thickness = Math.min(BISCUIT_THICKNESS * 0.85, size * 0.7);
      // Pecahan besar agak tenggelam di karamel; yang lain menumpang di gundukan / pecahan di bawahnya
      const base = tier.stack ? Math.max(pileHeight(x, z) * 0.6, restOn * 0.9) : pileHeight(x, z) * 0.45 - thickness * 0.25;
      placed.push({ x, z, size, top: base + thickness });
      crumbs.push({
        center: onCaramel(x, z, base + thickness / 2),
        anchor: { ...onCaramel(x, z, 0), lean: 0 },
        size,
        thickness,
        rotation: [(rand() - 0.5) * tier.tilt, rand() * Math.PI * 2, (rand() - 0.5) * tier.tilt],
        shade: 0.86 + rand() * 0.28,
        broken: rand() < (tier.stack ? 0.3 : 0.15),
        outline: chunkOutline(rand, tier.corners[0] + Math.floor(rand() * (tier.corners[1] - tier.corners[0] + 1))),
        seed: crumbs.length + 1,
      });
      left--;
    }
  }
  return crumbs;
}

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
  size: number;
  rotation: readonly [number, number, number];
  /** Pengali kecerahan warna (remahan ada yang lebih matang) */
  shade: number;
  seed: number;
};

export function crumbLayout(): CrumbLayout[] {
  const rand = seededRandom(12072026);
  const crumbs: CrumbLayout[] = [];
  const add = (x: number, z: number, size: number) =>
    crumbs.push({
      center: onCaramel(x, z, size * 0.22),
      size,
      rotation: [rand() * 0.6, rand() * 6.28, rand() * 0.6],
      shade: 0.8 + rand() * 0.35,
      seed: crumbs.length * 3.7 + 1,
    });

  // Remahan kecil tersebar, lebih banyak di depan biskuit (menghadap kamera)
  for (let i = 0; i < 34; i++) {
    const r = 0.1 + Math.sqrt(rand()) * 0.52;
    const angle = (rand() * 2 - 1) * Math.PI * 0.72;
    add(Math.sin(angle) * r, Math.cos(angle) * r, 0.02 + rand() ** 2 * 0.05);
  }
  // Beberapa pecahan besar di dekat pangkal biskuit
  for (const [x, z, size] of [
    [-0.24, 0.02, 0.075],
    [0.3, 0.06, 0.065],
    [-0.05, 0.16, 0.058],
  ] as const) {
    add(x, z, size);
  }
  return crumbs;
}

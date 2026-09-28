/**
 * Profil puding sebagai pasangan [radius, y] (satuan dunia 3D, y = 0 di permukaan piring).
 *
 * Satu sumber untuk dua hal:
 * - geometri 3D (LatheGeometry memutar profil ini 360°)
 * - ilustrasi SVG statis (fallback & placeholder saat 3D belum siap)
 *
 * File ini sengaja tidak meng-import three.js supaya aman dipakai di Server Component.
 */

export type ProfilePoint = readonly [radius: number, y: number];

/** Lapisan susu (bawah): kaki sedikit melebar, lalu meruncing ke tepi atas. */
export const MILK_WALL: readonly ProfilePoint[] = [
  [0.97, 0],
  [1.035, 0.012],
  [1.055, 0.045],
  [1.04, 0.1],
  [1.0, 0.2],
  [0.975, 0.32],
  [0.963, 0.44],
  [0.955, 0.51],
  [0.94, 0.6],
  [0.91, 0.7],
  [0.87, 0.82],
  [0.82, 0.95],
  [0.772, 1.06],
];

export const LAYER_SPLIT_Y = 1.06;
export const PUDDING_TOP_Y = 1.265;
export const PLATE_RADIUS = 1.58;

/**
 * Lapisan karamel (atas): menyambung rata dengan dinding lapisan susu (sedikit lebih lebar
 * agar sambungannya tertutup), tepi atas membulat, permukaan atas nyaris datar & mengilap.
 */
export const CARAMEL_WALL: readonly ProfilePoint[] = [
  [0.774, LAYER_SPLIT_Y],
  [0.753, 1.11],
  [0.73, 1.158],
  [0.7, 1.198],
  [0.655, 1.228],
  [0.595, 1.246],
  [0.5, 1.257],
  [0.3, 1.263],
  [0, PUDDING_TOP_Y],
];

/**
 * Kamera yang sama untuk model 3D dan ilustrasi SVG (proyeksi perspektif identik),
 * sehingga pergantian dari SVG ke 3D terlihat mulus. Elevasi ±18°, kanvas persegi.
 */
export const CAMERA = {
  fov: 26,
  position: [0, 3.04, 7.32] as const,
  target: [0, 0.66, 0] as const,
};

type Vec = readonly [number, number];

function lerp(a: Vec, b: Vec, ta: number, tb: number, t: number): [number, number] {
  const span = tb - ta;
  const wa = (tb - t) / span;
  const wb = (t - ta) / span;
  return [a[0] * wa + b[0] * wb, a[1] * wa + b[1] * wb];
}

/**
 * Menghaluskan titik profil dengan spline Catmull-Rom sentripetal
 * (tidak "melenting" di tikungan tajam seperti versi uniform).
 */
export function sampleWall(points: readonly ProfilePoint[], samplesPerSegment = 6): ProfilePoint[] {
  if (points.length < 2) return [...points];

  const first = points[0];
  const second = points[1];
  const last = points[points.length - 1];
  const beforeLast = points[points.length - 2];
  // Titik bayangan di kedua ujung (refleksi) agar kurva melewati titik pertama & terakhir
  const padded: Vec[] = [
    [2 * first[0] - second[0], 2 * first[1] - second[1]],
    ...points,
    [2 * last[0] - beforeLast[0], 2 * last[1] - beforeLast[1]],
  ];

  const knot = (a: Vec, b: Vec) => Math.sqrt(Math.hypot(b[0] - a[0], b[1] - a[1])) || 1e-4;
  const result: ProfilePoint[] = [];

  for (let i = 1; i < padded.length - 2; i++) {
    const [p0, p1, p2, p3] = [padded[i - 1], padded[i], padded[i + 1], padded[i + 2]];
    const t0 = 0;
    const t1 = t0 + knot(p0, p1);
    const t2 = t1 + knot(p1, p2);
    const t3 = t2 + knot(p2, p3);

    for (let s = 0; s < samplesPerSegment; s++) {
      const t = t1 + ((t2 - t1) * s) / samplesPerSegment;
      const a1 = lerp(p0, p1, t0, t1, t);
      const a2 = lerp(p1, p2, t1, t2, t);
      const a3 = lerp(p2, p3, t2, t3, t);
      const b1 = lerp(a1, a2, t0, t2, t);
      const b2 = lerp(a2, a3, t1, t3, t);
      result.push(lerp(b1, b2, t1, t2, t));
    }
  }

  result.push(last);
  return result;
}

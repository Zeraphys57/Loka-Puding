import {
  CAMERA,
  CARAMEL_WALL,
  LAYER_SPLIT_Y,
  MILK_WALL,
  PLATE_RADIUS,
  sampleWall,
  type ProfilePoint,
} from "./puddingProfile";

/*
 * Ilustrasi puding statis, "dirender" dari profil dan kamera yang sama persis dengan model 3D
 * (proyeksi perspektif), jadi saat model 3D siap, pergantiannya nyaris tak terasa.
 * Dihitung di server: tanpa request jaringan dan bukan kandidat LCP.
 */

type Vec3 = [number, number, number];

const sub = (a: readonly number[], b: readonly number[]): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const normalize = (a: Vec3): Vec3 => {
  const length = Math.hypot(...a);
  return [a[0] / length, a[1] / length, a[2] / length];
};

const SIZE = 400;
const DEG = Math.PI / 180;
const forward = normalize(sub(CAMERA.target, CAMERA.position));
const right = normalize(cross(forward, [0, 1, 0]));
const up = cross(right, forward);
const tanHalfFov = Math.tan((CAMERA.fov * DEG) / 2);

const round = (n: number) => Math.round(n * 10) / 10;

/** Titik dunia → koordinat SVG (sama seperti PerspectiveCamera three.js dengan aspek 1:1). */
function projectPoint(x: number, y: number, z: number): [number, number] {
  const v = sub([x, y, z], CAMERA.position);
  const depth = dot(v, forward);
  const px = dot(v, right) / (depth * tanHalfFov);
  const py = dot(v, up) / (depth * tanHalfFov);
  return [SIZE / 2 + (px * SIZE) / 2, SIZE / 2 - (py * SIZE) / 2];
}

/** Titik pada permukaan putar: radius r, tinggi y, sudut φ (0 = menghadap kamera). */
const project = (r: number, y: number, phi: number) => projectPoint(r * Math.sin(phi), y, r * Math.cos(phi));
const pt = ([x, y]: [number, number]) => `${round(x)} ${round(y)}`;

/** Titik-titik di sepanjang busur cincin dari sudut a ke b (derajat). */
function arc(r: number, y: number, fromDeg: number, toDeg: number, steps = 24): string[] {
  return Array.from({ length: steps + 1 }, (_, i) => pt(project(r, y, (fromDeg + ((toDeg - fromDeg) * i) / steps) * DEG)));
}

const ring = (r: number, y: number) => `M${arc(r, y, 0, 360, 48).join("L")}Z`;

/**
 * Siluet satu lapisan: dinding kiri → busur belakang cincin atas → dinding kanan → busur depan
 * cincin bawah. Cincin bawah = cincin terlebar di bagian kaki (tepi terdepan saat dilihat dari atas).
 */
function silhouette(profile: readonly ProfilePoint[]): string {
  const lower = profile.filter(([, y]) => y <= profile[0][1] + 0.2);
  const widest = lower.reduce((best, p, i) => (p[0] > profile[best][0] ? i : best), 0);
  const wall = profile.slice(widest);
  const [topR, topY] = wall[wall.length - 1];
  const [bottomR, bottomY] = wall[0];
  const left = wall.map(([r, y]) => pt(project(r, y, -90 * DEG)));
  const rightSide = [...wall].reverse().map(([r, y]) => pt(project(r, y, 90 * DEG)));
  return `M${[...left, ...arc(topR, topY, -90, -270), ...rightSide, ...arc(bottomR, bottomY, 90, -90)].join("L")}Z`;
}

/** Garis kilau di sisi depan, mengikuti lengkung dinding pada sudut φ. */
const meridian = (wall: readonly ProfilePoint[], phiDeg: number) =>
  `M${wall.map(([r, y]) => pt(project(r, y, phiDeg * DEG))).join("L")}`;

/** Pita di sisi depan antara dua ketinggian dinding (untuk rembesan karamel di puncak lapisan susu). */
function frontBand(wall: readonly ProfilePoint[], fromY: number, toY: number): string {
  const band = wall.filter(([, y]) => y >= fromY && y <= toY);
  const [topR, topY] = band[band.length - 1];
  const [bottomR, bottomY] = band[0];
  return `M${[...arc(topR, topY, -90, 90), ...arc(bottomR, bottomY, 90, -90)].join("L")}Z`;
}

/** Bintik-bintik glasir keramik: posisi acak tapi tetap (seed), sama di setiap render. */
function plateSpeckles(count: number) {
  let seed = 20260928;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  // Tinggi permukaan atas piring (mengikuti profil piring 3D)
  const heightAt = (r: number) => (r < 1.22 ? 0 : r < 1.36 ? ((r - 1.22) / 0.14) * 0.02 : 0.02 + ((r - 1.36) / 0.19) * 0.05);
  return Array.from({ length: count }, () => {
    const r = 1.08 + random() * 0.46;
    const phi = random() * 360;
    const [x, y] = project(r, heightAt(r), phi * DEG);
    return { x: round(x), y: round(y), r: round(0.5 + random() * random() * 1.4) };
  });
}

const milkWall = sampleWall(MILK_WALL, 5);
const caramelWall = sampleWall(CARAMEL_WALL, 5).filter(([r]) => r >= 0.64);
const caramelRim = caramelWall[caramelWall.length - 1];

// Batas vertikal (koordinat SVG) sisi depan lapisan karamel, untuk gradasi pita gelapnya
const [, caramelBottomY] = project(CARAMEL_WALL[0][0], LAYER_SPLIT_Y, 0);
const [, caramelRimY] = project(caramelRim[0], caramelRim[1], 0);
const [, seepTopY] = project(MILK_WALL[MILK_WALL.length - 1][0], LAYER_SPLIT_Y, 0);
const [, seepBottomY] = project(0.83, LAYER_SPLIT_Y - 0.1, 0);

const paths = {
  floor: ring(PLATE_RADIUS * 1.05, -0.17),
  plateEdge: ring(PLATE_RADIUS + 0.01, 0.0),
  plateTop: ring(PLATE_RADIUS, 0.075),
  plateRim: ring(PLATE_RADIUS - 0.012, 0.075),
  plateWell: ring(1.3, 0.02),
  contact: ring(1.18, 0.004),
  milk: silhouette(milkWall),
  milkSeep: frontBand(milkWall, LAYER_SPLIT_Y - 0.1, LAYER_SPLIT_Y),
  milkGlint: meridian(milkWall.slice(16, -6), -62),
  caramel: silhouette(caramelWall),
  caramelTop: ring(caramelRim[0], caramelRim[1]),
  caramelGlint: meridian(caramelWall.slice(2, -1), -56),
  caramelEdgeGlint: `M${arc(caramelRim[0] + 0.01, caramelRim[1] - 0.008, -150, -118, 8).join("L")}`,
};

const speckles = plateSpeckles(46);
const [topX, topY] = projectPoint(-0.28, caramelRim[1] + 0.02, -0.2);

type PuddingFallbackProps = {
  className?: string;
  /** Ukuran eksplisit (dipakai gambar Open Graph); di halaman cukup lewat className */
  size?: number;
};

export function PuddingFallback({ className, size }: PuddingFallbackProps) {
  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="pf-floor">
          <stop offset="0" stopColor="#8c6138" stopOpacity=".2" />
          <stop offset="1" stopColor="#8c6138" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="pf-plate" cx=".45" cy=".4" r=".75">
          <stop offset="0" stopColor="#fbf5ec" />
          <stop offset="1" stopColor="#eadccb" />
        </radialGradient>
        <radialGradient id="pf-contact">
          <stop offset=".6" stopColor="#8c6138" stopOpacity=".22" />
          <stop offset="1" stopColor="#8c6138" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="pf-milk" x1="0" x2="1">
          <stop offset="0" stopColor="#ecd9b8" />
          <stop offset=".24" stopColor="#f9eed8" />
          <stop offset=".55" stopColor="#f2e3c7" />
          <stop offset=".82" stopColor="#dcc7a3" />
          <stop offset="1" stopColor="#c2ab85" />
        </linearGradient>
        <linearGradient id="pf-milk-depth" x1="0" y1="0" x2="0" y2="1">
          <stop offset=".45" stopColor="#a87432" stopOpacity="0" />
          <stop offset="1" stopColor="#a87432" stopOpacity=".15" />
        </linearGradient>
        <linearGradient id="pf-milk-seep" gradientUnits="userSpaceOnUse" x1="0" y1={round(seepTopY)} x2="0" y2={round(seepBottomY)}>
          <stop offset="0" stopColor="#b77a35" stopOpacity=".38" />
          <stop offset="1" stopColor="#b77a35" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="pf-caramel" x1="0" x2="1">
          <stop offset="0" stopColor="#a4561a" />
          <stop offset=".28" stopColor="#c06a1c" />
          <stop offset=".6" stopColor="#9a5214" />
          <stop offset="1" stopColor="#6c3707" />
        </linearGradient>
        {/* Pita karamel lebih pekat di dasar lapisannya, makin terang ke atas (seperti foto produk) */}
        <linearGradient
          id="pf-caramel-depth"
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={round(caramelBottomY)}
          x2="0"
          y2={round(caramelRimY)}
        >
          <stop offset="0" stopColor="#4a2308" stopOpacity=".55" />
          <stop offset=".45" stopColor="#4a2308" stopOpacity=".18" />
          <stop offset="1" stopColor="#4a2308" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="pf-caramel-top" cx=".42" cy=".55" r=".75">
          <stop offset="0" stopColor="#bd7441" />
          <stop offset=".6" stopColor="#a75e2b" />
          <stop offset="1" stopColor="#8a4a1e" />
        </radialGradient>
        {/* Pantulan "jendela" di permukaan karamel yang licin */}
        <linearGradient id="pf-caramel-sheen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3d2bb" stopOpacity="0" />
          <stop offset=".35" stopColor="#f3d2bb" stopOpacity=".55" />
          <stop offset=".6" stopColor="#f3d2bb" stopOpacity=".15" />
          <stop offset="1" stopColor="#f3d2bb" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Bayangan lantai & piring keramik berbintik */}
      <path d={paths.floor} fill="url(#pf-floor)" />
      <path d={paths.plateEdge} fill="#dccab2" />
      <path d={paths.plateTop} fill="url(#pf-plate)" />
      <path d={paths.plateRim} fill="none" stroke="#b58b5e" strokeWidth="2.2" />
      <path d={paths.plateWell} fill="none" stroke="#e0cdb6" strokeWidth="2" />
      <g fill="#7d5a3a" opacity=".55">
        {speckles.map((s) => (
          <circle key={`${s.x}-${s.y}`} cx={s.x} cy={s.y} r={s.r} />
        ))}
      </g>
      <path d={paths.contact} fill="url(#pf-contact)" />

      {/* Badan puding: satu grup agar bisa "dicolek" (squash) tanpa ikut menggoyang piring */}
      <g data-jiggle style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}>
        {/* Lapisan susu */}
        <path d={paths.milk} fill="url(#pf-milk)" />
        <path d={paths.milk} fill="url(#pf-milk-depth)" />
        <path d={paths.milkSeep} fill="url(#pf-milk-seep)" />
        <path d={paths.milkGlint} fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" opacity=".85" />

        {/* Lapisan karamel */}
        <path d={paths.caramel} fill="url(#pf-caramel)" />
        <path d={paths.caramel} fill="url(#pf-caramel-depth)" />
        <path d={paths.caramelTop} fill="url(#pf-caramel-top)" />
        <path d={paths.caramelTop} fill="url(#pf-caramel-sheen)" />
        <path d={paths.caramelGlint} fill="none" stroke="#fff4e6" strokeWidth="4.5" strokeLinecap="round" opacity=".7" />
        <path d={paths.caramelEdgeGlint} fill="none" stroke="#fff4e6" strokeWidth="2.5" strokeLinecap="round" opacity=".75" />
        <ellipse cx={round(topX)} cy={round(topY)} rx="18" ry="5" fill="#fff4e6" opacity=".45" />
      </g>
    </svg>
  );
}

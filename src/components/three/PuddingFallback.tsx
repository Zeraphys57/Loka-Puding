import {
  CAMERA,
  CARAMEL_WALL,
  LAYER_SPLIT_Y,
  MILK_WALL,
  PLATE_RADIUS,
  sampleWall,
  type ProfilePoint,
} from "./puddingProfile";
import { BISCUIT, BISCUIT_BASE, crumbLayout, plateTopY, popcornLayout, seededRandom, type Point3 } from "./toppingLayout";
import type { PuddingVariant } from "./variants";

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

/* ------------------------------------------------------------------ */
/*  Topping varian: posisinya sama dengan model 3D (toppingLayout.ts)   */
/* ------------------------------------------------------------------ */

/** Titik dunia → posisi SVG + skala (piksel SVG per satuan dunia) + kedalaman (untuk urutan gambar). */
function projectScaled({ x, y, z }: Point3) {
  const depth = dot(sub([x, y, z], CAMERA.position), forward);
  const [px, py] = projectPoint(x, y, z);
  return { x: px, y: py, scale: SIZE / (2 * depth * tanHalfFov), depth };
}

type Vec2 = [number, number];

/** Garis tepi tertutup yang halus: kurva kuadratik melalui titik tengah antar-titik. */
function smoothClosed(points: Vec2[]): string {
  const mid = (a: Vec2, b: Vec2) => `${round((a[0] + b[0]) / 2)} ${round((a[1] + b[1]) / 2)}`;
  let d = `M${mid(points[points.length - 1], points[0])}`;
  points.forEach((p, i) => {
    d += `Q${round(p[0])} ${round(p[1])} ${mid(p, points[(i + 1) % points.length])}`;
  });
  return `${d}Z`;
}

/** Bayangan lembut butir yang jatuh ke piring (sama seperti versi 3D: sedikit menjauhi lampu utama). */
function plateShadow(center: Point3, radius: number) {
  const p = projectScaled({
    x: center.x + radius * 0.25,
    y: plateTopY(Math.hypot(center.x, center.z)),
    z: center.z - radius * 0.2,
  });
  const rx = radius * p.scale * 1.3;
  return { cx: round(p.x), cy: round(p.y), rx: round(rx), ry: round(rx * 0.34) };
}

/** Butir popcorn: siluet bergumpal, celah-celah gelap, kilau gula kecil. Diurutkan dari yang terjauh. */
const kernels = popcornLayout()
  .map(({ center, radius, onPlate, seed }) => {
    const p = projectScaled(center);
    const r = radius * p.scale * 0.95;
    const rand = seededRandom(seed * 7919);
    const [p1, p2, p3, t] = [rand() * 6.28, rand() * 6.28, rand() * 6.28, rand() * 6.28];
    const outline = Array.from({ length: 48 }, (_, i): Vec2 => {
      const a = (i / 48) * Math.PI * 2;
      // Tepi bergumpal seperti kembang kol: gumpalan membulat dengan lekukan tajam di antaranya (|sin|)
      const k =
        0.9 + 0.12 * Math.abs(Math.sin(2.5 * a + p1)) + 0.06 * Math.abs(Math.sin(5.5 * a + p2)) + 0.02 * Math.sin(11 * a + p3);
      return [p.x + Math.cos(a) * r * k, p.y + Math.sin(a) * r * k * 0.92];
    });
    const at = (a: number, l: number) => `${round(p.x + Math.cos(a) * r * l)} ${round(p.y + Math.sin(a) * r * l)}`;
    // Celah di antara gumpalan: garis pendek melengkung dengan arah & panjang acak (bukan pola silang)
    let angle = t;
    const creases = Array.from({ length: 3 }, () => {
      angle += 1.7 + rand() * 1.1;
      const from = 0.18 + rand() * 0.3;
      const bend = (rand() - 0.5) * 0.9;
      return `M${at(angle, from)}Q${at(angle + bend, (from + 0.86) / 2)} ${at(angle + bend * 0.4, 0.86)}`;
    }).join("");
    return {
      id: seed,
      outline: smoothClosed(outline),
      edgeWidth: round(r * 0.05),
      creases,
      creaseWidth: round(r * 0.085),
      // Kilau utama di sisi yang terkena cahaya + dua titik gula kecil
      glints: [
        { cx: round(p.x - r * 0.3), cy: round(p.y - r * 0.38), rx: round(r * 0.22), ry: round(r * 0.13), opacity: 0.5 },
        { cx: round(p.x + r * 0.2), cy: round(p.y - r * 0.12), rx: round(r * 0.07), ry: round(r * 0.05), opacity: 0.75 },
        { cx: round(p.x - r * 0.46), cy: round(p.y + r * 0.14), rx: round(r * 0.06), ry: round(r * 0.045), opacity: 0.7 },
      ],
      depth: p.depth,
      onPlate,
      // Di belakang bidang tengah puding: digambar sebelum badan puding supaya tertutup olehnya
      behind: center.z < 0,
      shadow: onPlate ? plateShadow(center, radius) : null,
    };
  })
  .sort((a, b) => b.depth - a.depth);

/** Biskuit Marie berdiri: siluet bergerigi, cincin timbul, lubang-lubang kecil, tulisan timbul. */
const biscuit = (() => {
  const c = projectScaled({ x: BISCUIT_BASE.x, y: BISCUIT_BASE.y + BISCUIT.radius * BISCUIT.rise, z: BISCUIT_BASE.z });
  const rx = BISCUIT.radius * c.scale * Math.cos(BISCUIT.turn);
  const ry = BISCUIT.radius * c.scale * 0.99;
  const at = (fx: number, fy: number): Vec2 => [round(c.x + fx * rx), round(c.y + fy * ry)];
  const holes: Vec2[] = Array.from({ length: 36 }, (_, i) => {
    const a = (i / 36) * Math.PI * 2;
    return at(Math.cos(a) * 0.9, Math.sin(a) * 0.9);
  });
  for (const [fx, fy] of [
    [-0.42, -0.36],
    [0, -0.44],
    [0.42, -0.36],
    [-0.42, 0.36],
    [0, 0.44],
    [0.42, 0.36],
  ]) {
    holes.push(at(fx, fy));
  }
  const outline = Array.from({ length: 88 }, (_, i): Vec2 => {
    const a = (i / 88) * Math.PI * 2;
    const k = 1 + 0.014 * Math.cos(44 * a);
    return [c.x + Math.cos(a) * rx * k, c.y + Math.sin(a) * ry * k];
  });
  return {
    cx: round(c.x),
    cy: round(c.y),
    rx: round(rx),
    ry: round(ry),
    outline: smoothClosed(outline),
    holes,
    holeRadius: round(rx * 0.026),
    fontSize: round(ry * 0.36),
    // Bagian di bawah permukaan karamel tidak terlihat (tenggelam)
    waterline: round(projectScaled(BISCUIT_BASE).y),
  };
})();

const crumbs = crumbLayout().map(({ center, size, shade, seed }) => {
  const p = projectScaled(center);
  const r = size * p.scale;
  const rand = seededRandom(Math.round(seed * 100) + 3);
  const corners = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 + rand() * 0.6;
    const k = 0.65 + rand() * 0.5;
    return `${round(p.x + Math.cos(a) * r * k)} ${round(p.y + Math.sin(a) * r * k * 0.7)}`;
  });
  const tone = (value: number) => Math.round(Math.min(255, value * shade));
  return {
    id: seed,
    d: `M${corners.join("L")}Z`,
    fill: `rgb(${tone(197)},${tone(143)},${tone(82)})`,
    behindBiscuit: center.z < BISCUIT_BASE.z,
  };
});

type PuddingFallbackProps = {
  className?: string;
  /** Ukuran eksplisit (dipakai gambar Open Graph); di halaman cukup lewat className */
  size?: number;
  /** Topping yang digambar (klasik = tanpa topping) */
  variant?: PuddingVariant;
};

function Kernel({ kernel }: { kernel: (typeof kernels)[number] }) {
  const { shadow } = kernel;
  return (
    <g>
      {shadow ? <ellipse {...shadow} fill="url(#pf-pop-shadow)" /> : null}
      <path d={kernel.outline} fill="url(#pf-pop)" stroke="#7a3d0f" strokeOpacity=".4" strokeWidth={kernel.edgeWidth} />
      <path d={kernel.creases} fill="none" stroke="#7a3d0f" strokeOpacity=".45" strokeWidth={kernel.creaseWidth} strokeLinecap="round" />
      {kernel.glints.map(({ opacity, ...glint }) => (
        <ellipse
          key={`${glint.cx}-${glint.cy}`}
          {...glint}
          fill="#fff6e4"
          opacity={opacity}
          transform={`rotate(-20 ${glint.cx} ${glint.cy})`}
        />
      ))}
    </g>
  );
}

function Crumbs({ behindBiscuit }: { behindBiscuit: boolean }) {
  return crumbs
    .filter((crumb) => crumb.behindBiscuit === behindBiscuit)
    .map((crumb) => <path key={crumb.id} d={crumb.d} fill={crumb.fill} />);
}

function Biscuit() {
  const { cx, cy, rx, ry } = biscuit;
  const textY = round(cy + ry * 0.13);
  const text = {
    x: cx,
    textAnchor: "middle",
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontWeight: 700,
    fontSize: biscuit.fontSize,
  } as const;
  return (
    <g clipPath="url(#pf-biscuit-clip)">
      <path d={biscuit.outline} fill="url(#pf-biscuit)" stroke="#a86a30" strokeOpacity=".55" strokeWidth="1.1" />
      <ellipse cx={cx} cy={round(cy + 0.8)} rx={round(rx * 0.8)} ry={round(ry * 0.8)} fill="none" stroke="#9c6531" strokeOpacity=".35" strokeWidth="1.4" />
      <ellipse cx={cx} cy={cy} rx={round(rx * 0.8)} ry={round(ry * 0.8)} fill="none" stroke="#f3d2a0" strokeOpacity=".7" strokeWidth="1.4" />
      <g fill="#8a5320" opacity=".55">
        {biscuit.holes.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={biscuit.holeRadius} />
        ))}
      </g>
      <text {...text} y={round(textY + 0.9)} fill="#8d5626" opacity=".35">
        MARIE
      </text>
      <text {...text} y={textY} fill="#f6d8a6" opacity=".75">
        MARIE
      </text>
    </g>
  );
}

export function PuddingFallback({ className, size, variant = "klasik" }: PuddingFallbackProps) {
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
        {/* Topping: popcorn karamel & biskuit (hanya dipakai varian yang bersangkutan) */}
        <radialGradient id="pf-pop-shadow">
          <stop offset="0" stopColor="#4a2e17" stopOpacity=".42" />
          <stop offset="1" stopColor="#4a2e17" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="pf-pop" cx=".38" cy=".3" r=".8">
          <stop offset="0" stopColor="#f0c47c" />
          <stop offset=".55" stopColor="#d6923f" />
          <stop offset="1" stopColor="#9a571b" />
        </radialGradient>
        <radialGradient id="pf-biscuit" cx=".45" cy=".4" r=".7">
          <stop offset="0" stopColor="#e4b778" />
          <stop offset=".75" stopColor="#d5a061" />
          <stop offset="1" stopColor="#b87a3b" />
        </radialGradient>
        <clipPath id="pf-biscuit-clip">
          <rect x="0" y="0" width={SIZE} height={biscuit.waterline} />
        </clipPath>
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

      {variant === "popcorn"
        ? kernels.filter((kernel) => kernel.onPlate && kernel.behind).map((kernel) => <Kernel key={kernel.id} kernel={kernel} />)
        : null}

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

      {/* Topping = benda padat: tidak ikut gepeng bersama puding, hanya ikut bergeser (lihat PuddingStage) */}
      {variant === "klasik" ? null : (
        <g data-topping>
          {variant === "regal" ? (
            <>
              <Crumbs behindBiscuit />
              <Biscuit />
              <Crumbs behindBiscuit={false} />
            </>
          ) : (
            kernels.filter((kernel) => !kernel.onPlate).map((kernel) => <Kernel key={kernel.id} kernel={kernel} />)
          )}
        </g>
      )}

      {variant === "popcorn"
        ? kernels.filter((kernel) => kernel.onPlate && !kernel.behind).map((kernel) => <Kernel key={kernel.id} kernel={kernel} />)
        : null}
    </svg>
  );
}

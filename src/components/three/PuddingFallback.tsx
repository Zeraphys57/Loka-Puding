import {
  BERRY,
  CAMERA,
  JELLY_WALL,
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

/** Garis alur cetakan (flute) di sisi depan, mengikuti lengkung dinding. */
const flute = (wall: readonly ProfilePoint[], phiDeg: number) =>
  `M${wall.map(([r, y]) => pt(project(r, y, phiDeg * DEG))).join("L")}`;

/** Elips "menggembung" (untuk krim): lebar dari proyeksi cincin, tinggi dari ketebalan krim. */
function puff(r: number, y: number, thickness: number) {
  const [cx, cy] = projectPoint(0, y, 0);
  const halfWidth = (project(r, y, 90 * DEG)[0] - project(r, y, -90 * DEG)[0]) / 2;
  return { cx: round(cx), cy: round(cy), rx: round(halfWidth), ry: round((halfWidth / r) * thickness) };
}

const milkWall = sampleWall(MILK_WALL, 5);
const jellyWall = sampleWall(JELLY_WALL, 5).filter(([r]) => r >= 0.62);
const jellyRim = jellyWall[jellyWall.length - 1];
const FLUTE_ANGLES = [-62, -32, -2, 28, 58];

const paths = {
  floor: ring(PLATE_RADIUS * 1.05, -0.17),
  plateEdge: ring(PLATE_RADIUS + 0.01, 0.0),
  plateTop: ring(PLATE_RADIUS, 0.075),
  plateRim: ring(PLATE_RADIUS - 0.012, 0.075),
  plateWell: ring(1.3, 0.02),
  contact: ring(1.18, 0.004),
  milk: silhouette(milkWall),
  milkTop: ring(milkWall[milkWall.length - 1][0], LAYER_SPLIT_Y),
  milkGlint: flute(milkWall.slice(16, -6), -62),
  jelly: silhouette(jellyWall),
  jellyTop: ring(jellyRim[0] - 0.02, jellyRim[1] + 0.012),
  jellyFlutes: FLUTE_ANGLES.map((a) => flute(jellyWall.slice(1, -3), a)),
  jellyGlint: flute(jellyWall.slice(3, -6), -58),
};

/** Krim kocok: tingkat-tingkat bulat yang bertumpuk (bawah → atas). */
const creamTiers = [
  { y: 1.315, r: 0.34, thickness: 0.13 },
  { y: 1.41, r: 0.255, thickness: 0.11 },
  { y: 1.495, r: 0.165, thickness: 0.085 },
  { y: 1.56, r: 0.075, thickness: 0.06 },
].map(({ y, r, thickness }) => puff(r, y, thickness));

const berry = puff(BERRY.radius, BERRY.y, BERRY.radius);
const [berryX, berryY] = projectPoint(BERRY.x, BERRY.y, BERRY.z);
const jellyTopBox = puff(jellyRim[0] - 0.02, jellyRim[1] + 0.012, 0.1);

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
          <stop offset="0" stopColor="#f7efe6" />
          <stop offset="1" stopColor="#e3d0bc" />
        </radialGradient>
        <radialGradient id="pf-contact">
          <stop offset=".6" stopColor="#8c6138" stopOpacity=".22" />
          <stop offset="1" stopColor="#8c6138" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="pf-milk" x1="0" x2="1">
          <stop offset="0" stopColor="#e3d0ad" />
          <stop offset=".3" stopColor="#fdf6e6" />
          <stop offset=".62" stopColor="#f7eace" />
          <stop offset="1" stopColor="#d1b88e" />
        </linearGradient>
        <linearGradient id="pf-milk-depth" x1="0" y1="0" x2="0" y2="1">
          <stop offset=".45" stopColor="#a87432" stopOpacity="0" />
          <stop offset="1" stopColor="#a87432" stopOpacity=".15" />
        </linearGradient>
        <linearGradient id="pf-jelly" x1="0" x2="1">
          <stop offset="0" stopColor="#9e5c1a" />
          <stop offset=".3" stopColor="#c77b28" />
          <stop offset=".55" stopColor="#b56d1f" />
          <stop offset="1" stopColor="#874a10" />
        </linearGradient>
        <linearGradient id="pf-jelly-depth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".1" />
          <stop offset=".55" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="1" stopColor="#ffffff" stopOpacity=".22" />
        </linearGradient>
        <radialGradient id="pf-jelly-top" cx=".42" cy=".38" r=".7">
          <stop offset="0" stopColor="#e09c53" />
          <stop offset=".6" stopColor="#c47d2b" />
          <stop offset="1" stopColor="#a35d14" />
        </radialGradient>
        <radialGradient id="pf-cream" cx=".4" cy=".3" r=".8">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".6" stopColor="#f7faff" />
          <stop offset="1" stopColor="#d2e0f8" />
        </radialGradient>
        <radialGradient id="pf-berry" cx=".35" cy=".3" r=".75">
          <stop offset="0" stopColor="#b57335" />
          <stop offset=".55" stopColor="#754316" />
          <stop offset="1" stopColor="#4a2707" />
        </radialGradient>
      </defs>

      {/* Bayangan lantai & piring */}
      <path d={paths.floor} fill="url(#pf-floor)" />
      <path d={paths.plateEdge} fill="#d1bd9e" />
      <path d={paths.plateTop} fill="url(#pf-plate)" />
      <path d={paths.plateRim} fill="none" stroke="#b58b5e" strokeWidth="2.2" />
      <path d={paths.plateWell} fill="none" stroke="#e0cdb6" strokeWidth="2" />
      <path d={paths.contact} fill="url(#pf-contact)" />

      {/* Badan puding: satu grup agar bisa "dicolek" (squash) tanpa ikut menggoyang piring */}
      <g data-jiggle style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}>
        {/* Lapisan susu */}
        <path d={paths.milk} fill="url(#pf-milk)" />
        <path d={paths.milk} fill="url(#pf-milk-depth)" />
        <path d={paths.milkGlint} fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" opacity=".9" />
        <path d={paths.milkTop} fill="#fffdf8" stroke="#e6e3dc" strokeWidth="1.2" />

        {/* Lapisan karamel */}
        <path d={paths.jelly} fill="url(#pf-jelly)" />
        <path d={paths.jelly} fill="url(#pf-jelly-depth)" />
        {paths.jellyFlutes.map((d) => (
          <path key={d} d={d} fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity=".28" />
        ))}
        <path d={paths.jellyGlint} fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" opacity=".6" />
        <path d={paths.jellyTop} fill="url(#pf-jelly-top)" />
        <ellipse
          cx={round(jellyTopBox.cx - jellyTopBox.rx * 0.38)}
          cy={round(jellyTopBox.cy - jellyTopBox.ry * 0.3)}
          rx={round(jellyTopBox.rx * 0.2)}
          ry={round(jellyTopBox.ry * 0.35)}
          fill="#ffffff"
          opacity=".6"
        />

        {/* Krim & karamel */}
        {creamTiers.map((tier) => (
          <ellipse key={tier.cy} {...tier} fill="url(#pf-cream)" stroke="#d3e1f8" strokeWidth="1.2" />
        ))}
        <circle cx={round(berryX)} cy={round(berryY)} r={berry.rx} fill="url(#pf-berry)" />
        <circle cx={round(berryX - berry.rx * 0.35)} cy={round(berryY - berry.rx * 0.35)} r="3" fill="#ffffff" opacity=".7" />
      </g>
    </svg>
  );
}

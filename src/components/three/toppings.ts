import {
  BufferAttribute,
  CanvasTexture,
  Color,
  Euler,
  IcosahedronGeometry,
  LatheGeometry,
  Matrix4,
  type Material,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Quaternion,
  SRGBColorSpace,
  Vector2,
  Vector3,
  type BufferGeometry,
} from "three";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { applyJiggle, type JiggleUniforms } from "./jiggleShader";
import { CARAMEL_WALL } from "./puddingProfile";
import type { PuddingVariant } from "./variants";

/*
 * Topping varian Regal & Popcorn, dibuat prosedural (tanpa file model atau gambar), mengikuti foto menu:
 * - Popcorn karamel jenis "mushroom" (bulat bergumpal), ditumpuk di atas karamel, dua butir jatuh ke piring.
 * - Biskuit Marie berdiri tertancap di karamel, dengan remahan di sekitarnya.
 * Semua potongan memakai deformasi "rigid" (jiggleShader.ts): ikut bergoyang bersama puding tanpa ikut gepeng.
 */

function random(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

// Perlin noise 3D (versi "improved"), tabel permutasi tetap → bentuk topping selalu sama di setiap kunjungan
const PERM = (() => {
  const rand = random(1337);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  return Uint8Array.from([...p, ...p]);
})();

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const mix = (a: number, b: number, t: number) => a + t * (b - a);

function grad(hash: number, x: number, y: number, z: number): number {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

/** Kira-kira -1…1, halus. */
function noise3(x: number, y: number, z: number): number {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const Z = Math.floor(z) & 255;
  x -= Math.floor(x);
  y -= Math.floor(y);
  z -= Math.floor(z);
  const u = fade(x);
  const v = fade(y);
  const w = fade(z);
  const A = PERM[X] + Y;
  const AA = PERM[A] + Z;
  const AB = PERM[A + 1] + Z;
  const B = PERM[X + 1] + Y;
  const BA = PERM[B] + Z;
  const BB = PERM[B + 1] + Z;
  return mix(
    mix(mix(grad(PERM[AA], x, y, z), grad(PERM[BA], x - 1, y, z), u), mix(grad(PERM[AB], x, y - 1, z), grad(PERM[BB], x - 1, y - 1, z), u), v),
    mix(
      mix(grad(PERM[AA + 1], x, y, z - 1), grad(PERM[BA + 1], x - 1, y, z - 1), u),
      mix(grad(PERM[AB + 1], x, y - 1, z - 1), grad(PERM[BB + 1], x - 1, y - 1, z - 1), u),
      v,
    ),
    w,
  );
}

/** Tinggi permukaan atas karamel pada jarak r dari sumbu puding (mengikuti profil lapisan karamel). */
function caramelTopY(r: number): number {
  for (let i = CARAMEL_WALL.length - 1; i > 0; i--) {
    const [innerR, innerY] = CARAMEL_WALL[i];
    const [outerR, outerY] = CARAMEL_WALL[i - 1];
    if (r >= innerR && r <= outerR) return innerY + ((r - innerR) / (outerR - innerR)) * (outerY - innerY);
  }
  return CARAMEL_WALL[0][1];
}

/** Titik tempel yang sama untuk semua vertex satu potongan (dibaca shader "rigid"). */
function withAnchor(geometry: BufferGeometry, anchor: Vector3): BufferGeometry {
  const count = geometry.getAttribute("position").count;
  const data = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) data.set([anchor.x, anchor.y, anchor.z], i * 3);
  geometry.setAttribute("aAnchor", new BufferAttribute(data, 3));
  return geometry;
}

function place(geometry: BufferGeometry, position: Vector3, rotation: Euler, scale: Vector3): BufferGeometry {
  return geometry.applyMatrix4(new Matrix4().compose(position, new Quaternion().setFromEuler(rotation), scale));
}

function mergeParts(parts: BufferGeometry[]): BufferGeometry {
  const merged = mergeGeometries(parts);
  parts.forEach((part) => part.dispose());
  merged.computeBoundingSphere();
  return merged;
}

/* ------------------------------------------------------------------ */
/*  Popcorn karamel                                                    */
/* ------------------------------------------------------------------ */

// Karamel menumpuk (gelap) di lipatan, menipis (terang keemasan) di tonjolan
const POPCORN_DARK = new Color("#8a4512");
const POPCORN_LIGHT = new Color("#dc9a45");

/**
 * Satu butir popcorn "mushroom": bola bergelombang seperti kembang kol. Tonjolan membulat dipisah lipatan
 * tajam (|noise| bernilai nol di garis lipatan), dua ukuran tonjolan + gumpalan besar yang membuat bentuknya
 * tidak bulat sempurna. Radius ±1.
 */
function popcornKernel(seed: number, unitSphere: BufferGeometry): BufferGeometry {
  const geometry = unitSphere.clone();
  const position = geometry.getAttribute("position");
  const colors = new Float32Array(position.count * 3);
  const dir = new Vector3();
  const color = new Color();
  const o = seed * 7.13;
  for (let i = 0; i < position.count; i++) {
    dir.fromBufferAttribute(position, i).normalize();
    const lobes = noise3(dir.x * 1.4 + o, dir.y * 1.4 - o, dir.z * 1.4 + o * 0.6);
    const puffs = Math.abs(noise3(dir.x * 1.9 - o, dir.y * 1.9 + o * 0.4, dir.z * 1.9 + o));
    const small = Math.abs(noise3(dir.x * 4.4 + o * 0.3, dir.y * 4.4 - o, dir.z * 4.4 + 4.7));
    const shape = 0.12 * lobes + 0.38 * (puffs - 0.25) + 0.05 * (small - 0.25);
    const radius = 0.95 + shape;
    position.setXYZ(i, dir.x * radius, dir.y * radius * 0.9, dir.z * radius);
    // Lipatan lebih gelap (karamel mengumpul di sana), puncak tonjolan lebih terang
    color.lerpColors(POPCORN_DARK, POPCORN_LIGHT, Math.min(Math.max(puffs * 2.2 + small * 0.6 - 0.05, 0), 1));
    colors.set([color.r, color.g, color.b], i * 3);
  }
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  return geometry;
}

type Kernel = { center: Vector3; radius: number; anchor: Vector3 };

/** Tumpukan berbentuk kubah di atas karamel (3 lapis), beberapa tumpah di tepi, dua jatuh ke piring. */
function popcornLayout(rand: () => number): Kernel[] {
  const kernels: Kernel[] = [];
  const onTop = (r: number, angleDeg: number, radius: number, lift: number) => {
    const angle = (angleDeg * Math.PI) / 180;
    const center = new Vector3(Math.sin(angle) * r, caramelTopY(r) + lift, Math.cos(angle) * r);
    // Titik tempel = pusat butir: butir yang lebih tinggi ikut berayun lebih jauh, seperti tumpukan sungguhan
    kernels.push({ center, radius, anchor: center.clone() });
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

  // Jatuh ke piring: titik tempelnya di piring, jadi tidak ikut bergoyang
  for (const [x, z, radius] of [
    [0.92, 0.72, 0.115],
    [-1.02, 0.4, 0.105],
  ] as const) {
    kernels.push({ center: new Vector3(x, radius * 0.8, z), radius, anchor: new Vector3(x, 0, z) });
  }
  return kernels;
}

function createPopcorn(): BufferGeometry {
  const rand = random(29092026);
  // Bola dasar dibuat & dirapikan (vertex kembar digabung) sekali, lalu disalin untuk tiap butir
  const sphere = new IcosahedronGeometry(1, 8);
  sphere.deleteAttribute("uv");
  sphere.deleteAttribute("normal");
  const unitSphere = mergeVertices(sphere, 1e-4);
  sphere.dispose();
  const popcorn = mergeParts(
    popcornLayout(rand).map(({ center, radius, anchor }, index) => {
      const kernel = popcornKernel(index + 1, unitSphere);
      place(kernel, center, new Euler(rand() * 6.28, rand() * 6.28, rand() * 6.28), new Vector3(radius, radius, radius));
      kernel.computeVertexNormals();
      return withAnchor(kernel, anchor);
    }),
  );
  unitSphere.dispose();
  return popcorn;
}

/* ------------------------------------------------------------------ */
/*  Biskuit Marie + remahan                                            */
/* ------------------------------------------------------------------ */

const BISCUIT_RADIUS = 0.45;
const BISCUIT_HALF_THICKNESS = 0.033;
const BISCUIT_EDGE = 0.026;
// Posisi pangkal biskuit di permukaan karamel (sedikit di belakang tengah, seperti di foto)
const BISCUIT_BASE = new Vector3(0.06, 0, -0.12);

/** Cakram dengan tepi membulat & bergerigi halus, UV planar (tampak depan) untuk pola timbulnya. */
function biscuitDisc(): BufferGeometry {
  const R = BISCUIT_RADIUS;
  const T = BISCUIT_HALF_THICKNESS;
  const E = BISCUIT_EDGE;
  // Profil dari tengah bawah → tepi → tengah atas (normal menghadap keluar)
  const profile = [new Vector2(1e-4, -T), new Vector2(R * 0.5, -T), new Vector2(R - E, -T)];
  for (let i = 1; i <= 8; i++) {
    const a = Math.PI - (i / 8) * (Math.PI / 2);
    profile.push(new Vector2(R - E + E * Math.sin(a), -(T - E) + E * Math.cos(a)));
  }
  for (let i = 0; i <= 8; i++) {
    const a = Math.PI / 2 - (i / 8) * (Math.PI / 2);
    profile.push(new Vector2(R - E + E * Math.sin(a), T - E + E * Math.cos(a)));
  }
  profile.push(new Vector2(R * 0.5, T), new Vector2(1e-4, T));

  const lathe = new LatheGeometry(profile, 96);
  lathe.deleteAttribute("uv");
  lathe.deleteAttribute("normal");
  const geometry = mergeVertices(lathe, 1e-5);
  lathe.dispose();

  const position = geometry.getAttribute("position");
  const uv = new Float32Array(position.count * 2);
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const z = position.getZ(i);
    if (Math.hypot(x, z) > R - E - 0.02) {
      const scallop = 1 + 0.012 * Math.cos(Math.atan2(z, x) * 44);
      position.setX(i, x * scallop);
      position.setZ(i, z * scallop);
    }
    uv[i * 2] = x / (2 * R) + 0.5;
    uv[i * 2 + 1] = 0.5 - z / (2 * R);
  }
  geometry.setAttribute("uv", new BufferAttribute(uv, 2));

  // Berdiri menghadap kamera (muka bermotif ke +z), condong ke belakang & sedikit menyerong,
  // hampir sepertiga bagian bawahnya tenggelam di karamel
  geometry.rotateX(Math.PI / 2);
  geometry.rotateX(-0.18);
  geometry.rotateY(-0.3);
  const baseY = caramelTopY(Math.hypot(BISCUIT_BASE.x, BISCUIT_BASE.z));
  geometry.translate(BISCUIT_BASE.x, baseY + R * 0.4, BISCUIT_BASE.z);
  geometry.computeVertexNormals();
  withAnchor(geometry, new Vector3(BISCUIT_BASE.x, baseY, BISCUIT_BASE.z));
  geometry.computeBoundingSphere();
  return geometry;
}

const CRUMB_COLOR = new Color("#c58f52");

/** Satu remahan tak beraturan (flat shading). Radius ±1. */
function crumb(seed: number, shade: number): BufferGeometry {
  const geometry = new IcosahedronGeometry(1, 1);
  geometry.deleteAttribute("uv");
  const position = geometry.getAttribute("position");
  const colors = new Float32Array(position.count * 3);
  const v = new Vector3();
  for (let i = 0; i < position.count; i++) {
    v.fromBufferAttribute(position, i);
    // Titik sudut yang sama (terduplikasi di tiap sisi) harus bergeser sama → acak dari posisinya sendiri
    const jitter =
      0.82 + 0.3 * noise3(v.x * 1.7 + seed, v.y * 1.7 - seed, v.z * 1.7 + seed * 0.5) + 0.12 * noise3(v.x * 4 - seed, v.y * 4, v.z * 4 + seed);
    position.setXYZ(i, v.x * jitter, v.y * jitter * 0.62, v.z * jitter);
    colors.set([CRUMB_COLOR.r * shade, CRUMB_COLOR.g * shade, CRUMB_COLOR.b * shade], i * 3);
  }
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  return geometry;
}

function createCrumbs(): BufferGeometry {
  const rand = random(12072026);
  const parts: BufferGeometry[] = [];
  const add = (x: number, z: number, size: number) => {
    const piece = crumb(parts.length * 3.7 + 1, 0.8 + rand() * 0.35);
    const center = new Vector3(x, caramelTopY(Math.hypot(x, z)) + size * 0.22, z);
    place(piece, center, new Euler(rand() * 0.6, rand() * 6.28, rand() * 0.6), new Vector3(size, size, size));
    piece.computeVertexNormals();
    parts.push(withAnchor(piece, center));
  };

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
  return mergeParts(parts);
}

/** Pola timbul biskuit Marie di kanvas: warna (map) & tinggi (bumpMap), 128 = rata. */
function biscuitTextures(): { map: CanvasTexture; bump: CanvasTexture } {
  const SIZE = 512;
  const C = SIZE / 2;
  const canvas = () => {
    const element = document.createElement("canvas");
    element.width = element.height = SIZE;
    return element;
  };
  const rand = random(3052026);

  // Lubang-lubang kecil khas biskuit Marie: satu cincin di tepi + beberapa di tengah
  const holes: [number, number][] = [];
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    holes.push([C + Math.cos(a) * C * 0.9, C + Math.sin(a) * C * 0.9]);
  }
  for (const [dx, dy] of [
    [-0.42, -0.36],
    [0, -0.44],
    [0.42, -0.36],
    [-0.42, 0.36],
    [0, 0.44],
    [0.42, 0.36],
  ]) {
    holes.push([C + dx * C, C + dy * C]);
  }

  const bumpCanvas = canvas();
  const b = bumpCanvas.getContext("2d")!;
  b.fillStyle = "rgb(128,128,128)";
  b.fillRect(0, 0, SIZE, SIZE);
  b.filter = "blur(2px)";
  b.strokeStyle = "rgb(188,188,188)";
  b.lineWidth = 7;
  b.beginPath();
  b.arc(C, C, C * 0.8, 0, Math.PI * 2);
  b.stroke();
  b.fillStyle = "rgb(40,40,40)";
  for (const [x, y] of holes) {
    b.beginPath();
    b.arc(x, y, 6.5, 0, Math.PI * 2);
    b.fill();
  }
  b.fillStyle = "rgb(200,200,200)";
  b.font = "bold 96px Georgia, 'Times New Roman', serif";
  b.textAlign = "center";
  b.textBaseline = "middle";
  b.fillText("MARIE", C, C + 6);
  b.filter = "none";
  // Pori halus permukaan biskuit panggang
  for (let i = 0; i < 2600; i++) {
    const shade = 100 + Math.floor(rand() * 40);
    b.fillStyle = `rgba(${shade},${shade},${shade},0.5)`;
    b.fillRect(rand() * SIZE, rand() * SIZE, 2, 2);
  }

  const mapCanvas = canvas();
  const m = mapCanvas.getContext("2d")!;
  const toast = m.createRadialGradient(C, C, C * 0.25, C, C, C);
  toast.addColorStop(0, "#e2b476");
  toast.addColorStop(0.72, "#d8a563");
  toast.addColorStop(0.93, "#c38443");
  toast.addColorStop(1, "#a86a30");
  m.fillStyle = toast;
  m.fillRect(0, 0, SIZE, SIZE);
  m.fillStyle = "rgba(125,72,28,0.55)";
  for (const [x, y] of holes) {
    m.beginPath();
    m.arc(x, y, 6, 0, Math.PI * 2);
    m.fill();
  }
  m.fillStyle = "rgba(255,238,205,0.28)";
  m.font = "bold 96px Georgia, 'Times New Roman', serif";
  m.textAlign = "center";
  m.textBaseline = "middle";
  m.fillText("MARIE", C, C + 6);
  // Bintik gula & bagian yang lebih matang
  for (let i = 0; i < 700; i++) {
    m.fillStyle = `rgba(${120 + rand() * 40},${66 + rand() * 20},${22 + rand() * 10},${0.12 + rand() * 0.22})`;
    m.fillRect(rand() * SIZE, rand() * SIZE, 1.5 + rand() * 1.5, 1.5 + rand() * 1.5);
  }

  const map = new CanvasTexture(mapCanvas);
  map.colorSpace = SRGBColorSpace;
  map.anisotropy = 4;
  const bump = new CanvasTexture(bumpCanvas);
  bump.anisotropy = 4;
  return { map, bump };
}

/* ------------------------------------------------------------------ */

/**
 * Permukaan yang sangat bergelombang punya normal halus yang di tepi siluet bisa membelakangi kamera;
 * pantulan lingkungan di sudut itu gelap sehingga tepi butir tampak bergaris hitam. Normal seperti itu
 * dibelokkan sedikit ke arah kamera (juga normal lapisan clearcoat-nya).
 */
function softenSilhouettes<T extends Material>(material: T): T {
  const previous = material.onBeforeCompile;
  const bend = (name: string) => /* glsl */ `{
    vec3 lokaView = normalize(vViewPosition);
    float lokaFacing = dot(${name}, lokaView);
    if (lokaFacing < 0.15) ${name} = normalize(${name} + lokaView * (0.15 - lokaFacing));
  }`;
  material.onBeforeCompile = (shader, renderer) => {
    previous.call(material, shader, renderer);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>\n${bend("normal")}`)
      .replace(
        "#include <clearcoat_normal_fragment_maps>",
        `#include <clearcoat_normal_fragment_maps>\n#ifdef USE_CLEARCOAT\n${bend("clearcoatNormal")}\n#endif`,
      );
  };
  const key = material.customProgramCacheKey.bind(material);
  material.customProgramCacheKey = () => `${key()}-soft-edge`;
  return material;
}

/** Varian yang punya topping (klasik = puding polos). */
export type ToppedVariant = Exclude<PuddingVariant, "klasik">;

export type ToppingPart = { geometry: BufferGeometry; material: Material };

/** Geometri + material satu varian. Dibuat saat dibutuhkan (lihat Pudding.tsx), dilepas lewat `dispose`. */
export type ToppingSet = { parts: ToppingPart[]; dispose: () => void };

const RIGID = { rigid: true } as const;

export function createToppings(variant: ToppedVariant, uniforms: JiggleUniforms): ToppingSet {
  const parts: ToppingPart[] = [];
  const extra: { dispose: () => void }[] = [];

  if (variant === "popcorn") {
    parts.push({
      geometry: createPopcorn(),
      material: softenSilhouettes(
        applyJiggle(
          // Lapisan karamel yang mengeras: mengilap (clearcoat) di atas butiran yang agak kasar,
          // sheen keemasan menghangatkan tepi butir
          new MeshPhysicalMaterial({
            vertexColors: true,
            roughness: 0.42,
            clearcoat: 0.65,
            clearcoatRoughness: 0.22,
            sheen: 0.45,
            sheenRoughness: 0.5,
            sheenColor: new Color("#f3c27c"),
          }),
          uniforms,
          RIGID,
        ),
      ),
    });
  } else {
    const { map, bump } = biscuitTextures();
    extra.push(map, bump);
    parts.push(
      {
        geometry: biscuitDisc(),
        material: applyJiggle(new MeshStandardMaterial({ map, bumpMap: bump, bumpScale: 4, roughness: 0.84 }), uniforms, RIGID),
      },
      {
        geometry: createCrumbs(),
        material: applyJiggle(new MeshStandardMaterial({ vertexColors: true, roughness: 0.9, flatShading: true }), uniforms, RIGID),
      },
    );
  }

  return {
    parts,
    dispose: () => {
      for (const { geometry, material } of parts) {
        geometry.dispose();
        material.dispose();
      }
      extra.forEach((resource) => resource.dispose());
    },
  };
}

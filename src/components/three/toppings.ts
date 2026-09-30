import {
  BufferAttribute,
  CanvasTexture,
  CircleGeometry,
  Color,
  Euler,
  IcosahedronGeometry,
  LatheGeometry,
  Matrix4,
  type Material,
  MeshBasicMaterial,
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
import type { SurfaceUniforms } from "./surfaceDetail";
import {
  BISCUIT,
  BISCUIT_ANCHOR,
  BISCUIT_BASE,
  crumbLayout,
  plateTopY,
  popcornLayout,
  seededRandom,
  type Anchor,
  type Point3,
} from "./toppingLayout";
import type { PuddingVariant } from "./variants";

/*
 * Topping varian Regal & Popcorn, dibuat prosedural (tanpa file model atau gambar), mengikuti foto menu:
 * - Popcorn karamel jenis "mushroom" (bulat bergumpal, berlapis gula renyah), ditumpuk di atas karamel,
 *   beberapa butir jatuh ke piring.
 * - Biskuit Marie berdiri tertancap di karamel, dengan remahan di sekitarnya.
 * Semua potongan adalah benda padat (deformasi "rigid" di jiggleShader.ts): ikut berpindah bersama puding,
 * tapi bentuknya tidak pernah ikut kenyal/gepeng.
 */

// Perlin noise 3D (versi "improved"), tabel permutasi tetap → bentuk topping selalu sama di setiap kunjungan
const PERM = (() => {
  const rand = seededRandom(1337);
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

/** Titik tempel yang sama untuk semua vertex satu potongan (dibaca shader "rigid"). */
function withAnchor(geometry: BufferGeometry, { x, y, z, lean }: Anchor): BufferGeometry {
  const count = geometry.getAttribute("position").count;
  const data = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) data.set([x, y, z, lean], i * 4);
  geometry.setAttribute("aAnchor", new BufferAttribute(data, 4));
  return geometry;
}

function place(geometry: BufferGeometry, { x, y, z }: Point3, rotation: readonly [number, number, number], scale: number): BufferGeometry {
  return geometry.applyMatrix4(
    new Matrix4().compose(new Vector3(x, y, z), new Quaternion().setFromEuler(new Euler(...rotation)), new Vector3(scale, scale, scale)),
  );
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
  // Tiap butir sedikit beda matangnya: ada yang karamelnya tebal, ada yang lebih pucat
  const tone = 0.88 + seededRandom(seed * 131)() * 0.2;
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
    colors.set([Math.min(color.r * tone, 1), Math.min(color.g * tone, 1), Math.min(color.b * tone, 1)], i * 3);
  }
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  return geometry;
}

function createPopcorn(): BufferGeometry {
  // Bola dasar dibuat & dirapikan (vertex kembar digabung) sekali, lalu disalin untuk tiap butir
  const sphere = new IcosahedronGeometry(1, 8);
  sphere.deleteAttribute("uv");
  sphere.deleteAttribute("normal");
  const unitSphere = mergeVertices(sphere, 1e-4);
  sphere.dispose();
  const popcorn = mergeParts(
    popcornLayout().map(({ center, radius, anchor, rotation, seed }) => {
      const kernel = popcornKernel(seed, unitSphere);
      place(kernel, center, rotation, radius);
      kernel.computeVertexNormals();
      return withAnchor(kernel, anchor);
    }),
  );
  unitSphere.dispose();
  return popcorn;
}

/**
 * Bayangan lembut di bawah butir yang jatuh ke piring. Bayangan kontak utama (ContactShadows) jatuh di bawah
 * piring, jadi tanpa ini butir-butir itu tampak melayang. Cakram datar: gelap di tengah, memudar ke tepi,
 * sedikit bergeser menjauhi lampu utama (kiri-depan-atas).
 */
function createPlateShadows(): BufferGeometry {
  return mergeParts(
    popcornLayout()
      .filter((kernel) => kernel.onPlate)
      .map(({ center, radius }) => {
        const disc = new CircleGeometry(radius * 1.35, 24);
        disc.deleteAttribute("uv");
        const position = disc.getAttribute("position");
        const colors = new Float32Array(position.count * 4);
        for (let i = 0; i < position.count; i++) {
          const edge = Math.hypot(position.getX(i), position.getY(i)) / (radius * 1.35);
          colors.set([1, 1, 1, 0.42 * (1 - edge) ** 1.5], i * 4);
        }
        disc.setAttribute("color", new BufferAttribute(colors, 4));
        disc.rotateX(-Math.PI / 2);
        const r = Math.hypot(center.x, center.z);
        disc.translate(center.x + radius * 0.25, plateTopY(r) + 0.004, center.z - radius * 0.2);
        return disc;
      }),
  );
}

/* ------------------------------------------------------------------ */
/*  Biskuit Marie + remahan                                            */
/* ------------------------------------------------------------------ */

/** Cakram dengan tepi membulat & bergerigi halus, UV planar (tampak depan) untuk pola timbulnya. */
function biscuitDisc(): BufferGeometry {
  const { radius: R, halfThickness: T, edge: E } = BISCUIT;
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
  geometry.rotateX(-BISCUIT.tiltBack);
  geometry.rotateY(BISCUIT.turn);
  geometry.translate(BISCUIT_BASE.x, BISCUIT_BASE.y + R * BISCUIT.rise, BISCUIT_BASE.z);
  geometry.computeVertexNormals();
  withAnchor(geometry, BISCUIT_ANCHOR);
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
  return mergeParts(
    crumbLayout().map(({ center, size, rotation, shade, seed }) => {
      const piece = place(crumb(seed, shade), center, rotation, size);
      piece.computeVertexNormals();
      // Remahan tergeletak di permukaan: ikut bergeser di titiknya sendiri, tidak ikut condong
      return withAnchor(piece, { ...center, lean: 0 });
    }),
  );
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
  const rand = seededRandom(3052026);

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
    // Setelah tonjolan permukaan diterapkan (lihat surfaceDetail.ts), sebelum normal clearcoat diturunkan darinya
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <clearcoat_normal_fragment_begin>", `${bend("normal")}\n#include <clearcoat_normal_fragment_begin>`)
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

export function createToppings(variant: ToppedVariant, uniforms: JiggleUniforms, surface: SurfaceUniforms): ToppingSet {
  const parts: ToppingPart[] = [];
  const extra: { dispose: () => void }[] = [];

  if (variant === "popcorn") {
    parts.push(
      {
        geometry: createPopcorn(),
        material: softenSilhouettes(
          applyJiggle(
            // Lapisan gula karamel yang keras & renyah: kilaunya tipis dan pecah-pecah oleh tekstur
            // permukaan "popcorn" (surfaceDetail.ts), bukan licin mengilap seperti karamel pudingnya
            new MeshPhysicalMaterial({
              vertexColors: true,
              roughness: 0.5,
              clearcoat: 0.6,
              clearcoatRoughness: 0.26,
            }),
            uniforms,
            { rigid: true, surface: { kind: "popcorn", uniforms: surface } },
          ),
        ),
      },
      {
        geometry: createPlateShadows(),
        material: new MeshBasicMaterial({
          color: new Color("#4a2e17"),
          vertexColors: true,
          transparent: true,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -2,
        }),
      },
    );
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

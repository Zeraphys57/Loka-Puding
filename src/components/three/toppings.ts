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
  BufferGeometry,
  DoubleSide,
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
  type CrumbLayout,
  type Point3,
} from "./toppingLayout";
import type { PuddingVariant } from "./variants";

/*
 * Topping varian Regal & Popcorn, dibuat prosedural (tanpa file model atau gambar), mengikuti foto menu:
 * - Popcorn karamel jenis "mushroom" (bulat bergumpal, berlapis gula renyah), ditumpuk di atas karamel,
 *   beberapa butir jatuh ke piring.
 * - Biskuit Regal Marie berdiri tertancap di karamel, dengan pecahan & serbuk biskuit menumpuk di depannya.
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
/*  Biskuit Regal Marie + remahan                                      */
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

// Permukaan biskuit yang terpanggang (atas/bawah) vs bagian dalam yang pucat di sisi patahan
const CRUMB_BAKED = new Color("#c07f3e");
const CRUMB_INSIDE = new Color("#e8c992");
const CRUMB_SIDE = new Color("#d9ad6e");

/**
 * Satu pecahan biskuit bersudut, dalam satuan dunia: tutup atas & bawah (permukaan biskuit) dan sisi patahan
 * yang bergerigi (cincin tengahnya maju-mundur acak). Tiap sisi punya warnanya sendiri (flat shading).
 */
function biscuitChunk({ size, thickness, outline, broken, shade, seed }: CrumbLayout): BufferGeometry {
  const rand = seededRandom(seed * 131 + 7);
  const half = thickness / 2;
  const ring = (y: number, jag: number) =>
    outline.map(([angle, k]) => {
      const r = size * k * (1 + (rand() - 0.5) * jag);
      return new Vector3(Math.cos(angle) * r, y + (rand() - 0.5) * thickness * 0.4, Math.sin(angle) * r);
    });
  const top = ring(half, 0.1);
  const middle = ring(0, 0.3);
  const bottom = ring(-half, 0.16);
  const topCenter = new Vector3((rand() - 0.5) * size * 0.2, half * (1.04 + rand() * 0.12), (rand() - 0.5) * size * 0.2);
  const bottomCenter = new Vector3(0, -half, 0);

  const positions: number[] = [];
  const colors: number[] = [];
  const triangle = (a: Vector3, b: Vector3, c: Vector3, color: Color) => {
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    // Sedikit belang per sisi, seperti biskuit asli yang matangnya tidak rata
    const k = shade * (0.94 + rand() * 0.12);
    for (let i = 0; i < 3; i++) colors.push(color.r * k, color.g * k, color.b * k);
  };
  const up = broken ? CRUMB_INSIDE : CRUMB_BAKED;
  const down = broken ? CRUMB_BAKED : CRUMB_INSIDE;
  const n = outline.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    triangle(topCenter, top[j], top[i], up);
    triangle(bottomCenter, bottom[i], bottom[j], down);
    triangle(top[i], top[j], middle[j], CRUMB_SIDE);
    triangle(top[i], middle[j], middle[i], CRUMB_SIDE);
    triangle(middle[i], middle[j], bottom[j], CRUMB_SIDE);
    triangle(middle[i], bottom[j], bottom[i], CRUMB_SIDE);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute("color", new BufferAttribute(new Float32Array(colors), 3));
  return geometry;
}

function createCrumbs(): BufferGeometry {
  return mergeParts(
    crumbLayout().map((layout) => {
      const piece = place(biscuitChunk(layout), layout.center, layout.rotation, 1);
      piece.computeVertexNormals();
      // Tiap remahan ikut bergeser bersama titik karamel di bawahnya, tidak ikut condong
      return withAnchor(piece, layout.anchor);
    }),
  );
}

/** Huruf-huruf ditata melengkung di sepanjang busur (pusat cx, cy; jari-jari r), berpusat di puncaknya. */
function fillArcText(ctx: CanvasRenderingContext2D, text: string, cx: number, cy: number, r: number, spacing: number) {
  const chars = [...text];
  const widths = chars.map((char) => ctx.measureText(char).width + spacing);
  const total = widths.reduce((sum, w) => sum + w, 0) - spacing;
  let angle = -Math.PI / 2 - total / r / 2;
  chars.forEach((char, i) => {
    const mid = angle + (widths[i] - spacing) / r / 2;
    ctx.save();
    ctx.translate(cx + Math.cos(mid) * r, cy + Math.sin(mid) * r);
    ctx.rotate(mid + Math.PI / 2);
    ctx.fillText(char, 0, 0);
    ctx.restore();
    angle += widths[i] / r;
  });
}

/** Motif pinggiran "kunci Yunani" di antara dua cincin, seperti pada biskuit Regal Marie. */
function strokeMeander(ctx: CanvasRenderingContext2D, c: number, inner: number, outer: number, units: number) {
  const at = (unit: number, u: number, v: number): [number, number] => {
    const angle = ((unit + u) / units) * Math.PI * 2;
    const r = inner + v * (outer - inner);
    return [c + Math.cos(angle) * r, c + Math.sin(angle) * r];
  };
  // Satu kait per unit: naik, ke samping, turun, lalu melingkar ke dalam
  const key: [number, number][] = [
    [0, 0],
    [0, 1],
    [0.78, 1],
    [0.78, 0.28],
    [0.38, 0.28],
    [0.38, 0.64],
  ];
  ctx.beginPath();
  ctx.arc(c, c, inner, 0, Math.PI * 2);
  ctx.moveTo(c + outer * 1.06, c);
  ctx.arc(c, c, outer * 1.06, 0, Math.PI * 2);
  for (let unit = 0; unit < units; unit++) {
    key.forEach(([u, v], i) => {
      const [x, y] = at(unit, u, v);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
  }
  ctx.stroke();
}

/** Tulisan timbul "REGAL" (melengkung) di atas "MARIE", seperti di foto menu. */
function drawBiscuitLettering(ctx: CanvasRenderingContext2D, c: number, offset = 0) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 58px Georgia, 'Times New Roman', serif";
  // Sepertiga bawah biskuit tenggelam di karamel & tertutup remahan, jadi tulisan ditaruh agak tinggi
  fillArcText(ctx, "REGAL", c + offset, c + 180 + offset, 260, 5);
  ctx.font = "bold 78px Georgia, 'Times New Roman', serif";
  ctx.letterSpacing = "5px";
  ctx.fillText("MARIE", c + offset, c + 24 + offset);
  ctx.letterSpacing = "0px";
}

/** Pola timbul biskuit Regal Marie di kanvas: warna (map) & tinggi (bumpMap), 128 = rata. */
function biscuitTextures(): { map: CanvasTexture; bump: CanvasTexture } {
  const SIZE = 512;
  const C = SIZE / 2;
  const canvas = () => {
    const element = document.createElement("canvas");
    element.width = element.height = SIZE;
    return element;
  };
  const rand = seededRandom(3052026);
  const MEANDER = { inner: C * 0.74, outer: C * 0.86, units: 34 };

  const bumpCanvas = canvas();
  const b = bumpCanvas.getContext("2d")!;
  b.fillStyle = "rgb(128,128,128)";
  b.fillRect(0, 0, SIZE, SIZE);
  b.filter = "blur(1.5px)";
  b.strokeStyle = "rgb(196,196,196)";
  b.lineWidth = 6;
  strokeMeander(b, C, MEANDER.inner, MEANDER.outer, MEANDER.units);
  b.fillStyle = "rgb(206,206,206)";
  drawBiscuitLettering(b, C);
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
  // Timbulan: bayangan tipis di bawah-kanan, sisi atasnya sedikit lebih terang
  m.lineWidth = 6;
  m.strokeStyle = "rgba(120,68,24,0.28)";
  m.save();
  m.translate(2, 3);
  strokeMeander(m, C, MEANDER.inner, MEANDER.outer, MEANDER.units);
  m.restore();
  m.strokeStyle = "rgba(255,236,200,0.3)";
  strokeMeander(m, C, MEANDER.inner, MEANDER.outer, MEANDER.units);
  m.fillStyle = "rgba(120,68,24,0.3)";
  drawBiscuitLettering(m, C, 3);
  m.fillStyle = "rgba(255,238,205,0.34)";
  drawBiscuitLettering(m, C);
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
        material: applyJiggle(
          new MeshStandardMaterial({ vertexColors: true, roughness: 0.92, flatShading: true, side: DoubleSide }),
          uniforms,
          RIGID,
        ),
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

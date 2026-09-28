import type { IUniform, Material, WebGLProgramParametersWithUniforms } from "three";
import { LAYER_SPLIT_Y } from "./puddingProfile";

/**
 * Tekstur permukaan prosedural (tanpa file gambar): variasi warna, pori halus, dan tonjolan mikro
 * dihitung di fragment shader dari posisi vertex SEBELUM bergoyang, jadi teksturnya "menempel"
 * di puding dan ikut bergoyang bersamanya.
 */
export type SurfaceKind = "custard" | "caramel" | "ceramic";

export type SurfaceUniforms = {
  /** Kekuatan tonjolan mikro: 1 = penuh, 0 = mati (mode hemat saat perangkat kewalahan) */
  uSurfaceBump: IUniform<number>;
};

export function createSurfaceUniforms(): SurfaceUniforms {
  return { uSurfaceBump: { value: 1 } };
}

export type SurfaceOptions = { kind: SurfaceKind; uniforms: SurfaceUniforms };

const f = (n: number) => n.toFixed(4);

const NOISE_GLSL = /* glsl */ `
varying vec3 vSurfacePos;

// Hash tanpa sin() (stabil di GPU ponsel): vektor gradien acak -1…1
vec3 lokaHash3(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx) * 2.0 - 1.0;
}

// Gradient noise 3D (kira-kira -0.9…0.9), interpolasi quintic agar tonjolannya halus
float lokaNoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float n000 = dot(lokaHash3(i), f);
  float n100 = dot(lokaHash3(i + vec3(1.0, 0.0, 0.0)), f - vec3(1.0, 0.0, 0.0));
  float n010 = dot(lokaHash3(i + vec3(0.0, 1.0, 0.0)), f - vec3(0.0, 1.0, 0.0));
  float n110 = dot(lokaHash3(i + vec3(1.0, 1.0, 0.0)), f - vec3(1.0, 1.0, 0.0));
  float n001 = dot(lokaHash3(i + vec3(0.0, 0.0, 1.0)), f - vec3(0.0, 0.0, 1.0));
  float n101 = dot(lokaHash3(i + vec3(1.0, 0.0, 1.0)), f - vec3(1.0, 0.0, 1.0));
  float n011 = dot(lokaHash3(i + vec3(0.0, 1.0, 1.0)), f - vec3(0.0, 1.0, 1.0));
  float n111 = dot(lokaHash3(i + vec3(1.0, 1.0, 1.0)), f - vec3(1.0, 1.0, 1.0));
  return mix(
    mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y),
    mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y),
    u.z
  );
}

// Detail sehalus ini memudar saat satu piksel mencakup terlalu banyak pola (mencegah "berkedip" di layar kecil)
float lokaFade(float footprint, float frequency) {
  return 1.0 - smoothstep(0.1, 0.25, footprint * frequency);
}
`;

/*
 * Tiap jenis permukaan mengisi empat fungsi:
 * - lokaHeight: tinggi tonjolan mikro (satuan dunia), dievaluasi 3x per piksel untuk normalnya
 * - lokaCavity: 0…1, seberapa dalam pori/bintik di titik itu
 * - lokaTint: pengali warna dasar material
 * - lokaRoughness: tambahan kekasaran
 */
const KIND_GLSL: Record<SurfaceKind, string> = {
  // Puding susu: permukaan lembap tidak rata sempurna, sesekali pori udara kecil,
  // sedikit kecokelatan tepat di bawah lapisan karamel.
  custard: /* glsl */ `
#define LOKA_COAT_BUMP 0.7
float lokaCavity(vec3 p, float footprint) {
  return smoothstep(0.52, 0.66, lokaNoise(p * vec3(20.0, 15.0, 20.0) + 11.7)) * lokaFade(footprint, 20.0);
}
float lokaHeight(vec3 p, float footprint) {
  float h = lokaNoise(p * 7.0) * 0.001 + lokaNoise(p * 17.0 + 3.1) * 0.0004 * lokaFade(footprint, 17.0);
  return h - lokaCavity(p, footprint) * 0.0022;
}
vec3 lokaTint(vec3 p, float cavity) {
  vec3 tint = vec3(1.0) + lokaNoise(p * 2.3 + 5.0) * vec3(0.04, 0.036, 0.024);
  float seep = smoothstep(${f(LAYER_SPLIT_Y - 0.09)}, ${f(LAYER_SPLIT_Y)}, p.y);
  tint *= mix(vec3(1.0), vec3(0.93, 0.82, 0.66), seep * seep);
  tint *= mix(0.93, 1.0, smoothstep(0.0, 0.3, p.y));
  return tint * (1.0 - cavity * vec3(0.05, 0.07, 0.09));
}
float lokaRoughness(vec3 p, float cavity) {
  return lokaNoise(p * 30.0 + 2.0) * 0.08 + cavity * 0.1;
}
`,
  // Karamel: licin mengilap dengan gelombang lembut, lebih pekat di dasar lapisannya
  // (seperti karamel yang mengendap di foto produk), makin terang ke atas.
  caramel: /* glsl */ `
#define LOKA_COAT_BUMP 1.0
float lokaCavity(vec3 p, float footprint) {
  return 0.0;
}
float lokaHeight(vec3 p, float footprint) {
  return lokaNoise(p * vec3(2.6, 4.0, 2.6)) * 0.0038 + lokaNoise(p * 8.0 + 1.7) * 0.0011 * lokaFade(footprint, 8.0);
}
vec3 lokaTint(vec3 p, float cavity) {
  float lift = smoothstep(${f(LAYER_SPLIT_Y + 0.01)}, ${f(LAYER_SPLIT_Y + 0.16)}, p.y);
  vec3 tint = mix(vec3(0.5, 0.4, 0.33), vec3(1.0), lift);
  return tint * (1.0 + lokaNoise(p * vec3(3.0, 7.0, 3.0) + 9.0) * 0.08);
}
float lokaRoughness(vec3 p, float cavity) {
  return 0.0;
}
`,
  // Piring keramik: glasir sedikit bergelombang dengan bintik-bintik cokelat (stoneware)
  ceramic: /* glsl */ `
#define LOKA_COAT_BUMP 1.0
// Bintik acak per sel grid (di bidang datar piring): ada/tidaknya, posisi & ukurannya dari hash
float lokaSpeckles(vec2 p, float cells, float density) {
  vec2 cell = floor(p * cells);
  vec2 local = fract(p * cells);
  float speck = 0.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 offset = vec2(float(i), float(j));
      vec3 h = lokaHash3(vec3(cell + offset, 17.0)) * 0.5 + 0.5;
      if (h.z > density) continue;
      float radius = mix(0.1, 0.24, h.x * h.y);
      float d = length(local - offset - h.xy);
      speck = max(speck, 1.0 - smoothstep(radius * 0.55, radius, d));
    }
  }
  return speck;
}
float lokaCavity(vec3 p, float footprint) {
  return max(
    lokaSpeckles(p.xz, 16.0, 0.4) * lokaFade(footprint, 16.0),
    lokaSpeckles(p.xz + 7.3, 7.0, 0.22) * lokaFade(footprint, 7.0)
  );
}
float lokaHeight(vec3 p, float footprint) {
  return lokaNoise(p * 12.0) * 0.0007;
}
vec3 lokaTint(vec3 p, float cavity) {
  vec3 tint = vec3(1.0) + lokaNoise(p * 3.0) * 0.035;
  return mix(tint, vec3(0.36, 0.25, 0.17), cavity * 0.85);
}
float lokaRoughness(vec3 p, float cavity) {
  return cavity * 0.25;
}
`,
};

const SAMPLE_GLSL = /* glsl */ `
uniform float uSurfaceBump;

struct LokaSurface {
  vec3 tint;
  float roughness;
  vec2 slope;
};

LokaSurface lokaSampleSurface(vec3 p) {
  // Beda maju ke piksel tetangga (seperti bumpMap three.js), tapi dari fungsi prosedural
  vec3 dpdx = dFdx(p);
  vec3 dpdy = dFdy(p);
  float lx = max(length(dpdx), 1e-6);
  float ly = max(length(dpdy), 1e-6);
  float footprint = max(lx, ly);

  LokaSurface surface;
  surface.slope = vec2(0.0);
  // Bagian termahal (3x evaluasi tinggi) dilewati di mode hemat; warna & bintik tetap ada
  if (uSurfaceBump > 0.0) {
    float h0 = lokaHeight(p, footprint);
    float hx = lokaHeight(p + dpdx, footprint);
    float hy = lokaHeight(p + dpdy, footprint);
    // Kemiringan per satuan dunia: tampilan sama di DPR berapa pun
    surface.slope = vec2((hx - h0) / lx, (hy - h0) / ly) * uSurfaceBump;
  }
  float cavity = lokaCavity(p, footprint);
  surface.tint = lokaTint(p, cavity);
  surface.roughness = lokaRoughness(p, cavity);
  return surface;
}

// Normal bertonjolan dari kemiringan tinggi (Mikkelsen, "surface gradient")
vec3 lokaBumpNormal(vec3 surfacePosition, vec3 surfaceNormal, vec2 slope, float faceDirection) {
  vec3 sigmaX = normalize(dFdx(surfacePosition));
  vec3 sigmaY = normalize(dFdy(surfacePosition));
  vec3 r1 = cross(sigmaY, surfaceNormal);
  vec3 r2 = cross(surfaceNormal, sigmaX);
  float det = dot(sigmaX, r1) * faceDirection;
  vec3 gradient = sign(det) * (slope.x * r1 + slope.y * r2);
  return normalize(abs(det) * surfaceNormal - gradient);
}
`;

/** Sisipkan tekstur permukaan ke shader material bawaan (MeshStandard/MeshPhysical). */
export function injectSurface(shader: WebGLProgramParametersWithUniforms, { kind, uniforms }: SurfaceOptions): void {
  Object.assign(shader.uniforms, uniforms);
  shader.vertexShader = `varying vec3 vSurfacePos;\n${shader.vertexShader}`.replace(
    "#include <begin_vertex>",
    `#include <begin_vertex>
    vSurfacePos = position;`,
  );

  shader.fragmentShader = (NOISE_GLSL + KIND_GLSL[kind] + SAMPLE_GLSL + shader.fragmentShader)
    .replace(
      "#include <color_fragment>",
      `#include <color_fragment>
      LokaSurface lokaSurface = lokaSampleSurface(vSurfacePos);
      diffuseColor.rgb *= lokaSurface.tint;`,
    )
    .replace(
      "#include <roughnessmap_fragment>",
      `#include <roughnessmap_fragment>
      roughnessFactor = clamp(roughnessFactor + lokaSurface.roughness, 0.03, 1.0);`,
    )
    .replace(
      "#include <normal_fragment_maps>",
      `#include <normal_fragment_maps>
      if (uSurfaceBump > 0.0) normal = lokaBumpNormal(-vViewPosition, normal, lokaSurface.slope, faceDirection);`,
    )
    .replace(
      "#include <clearcoat_normal_fragment_begin>",
      `#include <clearcoat_normal_fragment_begin>
      #ifdef USE_CLEARCOAT
        clearcoatNormal = normalize(mix(nonPerturbedNormal, normal, LOKA_COAT_BUMP));
      #endif`,
    );
}

/** Tekstur permukaan saja (untuk bagian yang tidak bergoyang, mis. piring). */
export function applySurface<T extends Material>(material: T, surface: SurfaceOptions): T {
  material.onBeforeCompile = (shader) => injectSurface(shader, surface);
  material.customProgramCacheKey = () => `loka-surface-${surface.kind}`;
  return material;
}

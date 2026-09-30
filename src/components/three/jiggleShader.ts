import { Vector2, Vector3, type IUniform, type Material, type WebGLProgramParametersWithUniforms } from "three";
import { injectSurface, type SurfaceOptions } from "./surfaceDetail";

/**
 * Deformasi "jiggle" di vertex shader, disuntikkan ke material bawaan three.js lewat
 * onBeforeCompile, sehingga pencahayaan fisik (transmission, clearcoat, env map) tetap utuh.
 *
 * Semua material puding berbagi objek uniform yang sama: cukup ubah nilainya sekali per frame.
 */
export type JiggleUniforms = {
  /** Tinggi puding (dasar piring = 0) untuk menormalkan ketinggian vertex */
  uHeight: IUniform<number>;
  /** Simpangan bagian tengah & puncak (x, z) hasil simulasi pegas */
  uMid: IUniform<Vector2>;
  uTop: IUniform<Vector2>;
  /** Squash (< 0) / stretch (> 0) vertikal */
  uSquash: IUniform<number>;
  /** Lekukan colekan: titik (ruang objek), kedalaman, dan radius */
  uDentPos: IUniform<Vector3>;
  uDent: IUniform<number>;
  uDentRadius: IUniform<number>;
};

export function createJiggleUniforms(height: number, dentRadius: number): JiggleUniforms {
  return {
    uHeight: { value: height },
    uMid: { value: new Vector2() },
    uTop: { value: new Vector2() },
    uSquash: { value: 0 },
    uDentPos: { value: new Vector3(0, height, 0) },
    uDent: { value: 0 },
    uDentRadius: { value: dentRadius },
  };
}

const DEFORM_GLSL = /* glsl */ `
uniform float uHeight;
uniform vec2 uMid;
uniform vec2 uTop;
uniform float uSquash;
uniform vec3 uDentPos;
uniform float uDent;
uniform float uDentRadius;

// Posisi vertex setelah bergoyang. n = normal asli (untuk arah lekukan).
vec3 jiggleDeform(vec3 p, vec3 n) {
  float h = max(p.y / uHeight, 0.0);
  float hb = min(h, 1.0);

  // Lengkung samping: kubik yang melewati dasar (diam, kemiringan 0), tengah (h=0.5) dan puncak (h=1).
  // Di atas puncak diteruskan secara linear, jadi topping (jika kelak ditambah) ikut miring.
  vec2 a = 8.0 * uMid - uTop;
  vec2 b = 2.0 * uTop - 8.0 * uMid;
  vec2 bend = a * hb * hb + b * hb * hb * hb + (2.0 * a + 3.0 * b) * max(h - 1.0, 0.0);

  // Squash & stretch: tinggi diskalakan, lebar mengimbangi (volume kira-kira tetap).
  // Menggembung paling besar sedikit di atas tengah, nol di dasar yang menempel piring.
  float sy = 1.0 + uSquash;
  float bulge = sin(3.14159265 * hb * 0.85) * 0.75 + hb * 0.25;
  float sxz = 1.0 + (inversesqrt(max(sy, 0.3)) - 1.0) * bulge;

  vec3 q = vec3(p.x * sxz, p.y * sy, p.z * sxz);
  q.xz += bend;

  // Lekukan di titik colekan, meluruh halus (gaussian)
  vec3 d = p - uDentPos;
  q -= n * uDent * exp(-dot(d, d) / (uDentRadius * uDentRadius));
  return q;
}

// Normal baru lewat beda hingga: geser sedikit di dua arah tangen, lalu cross product.
vec3 jiggleNormal(vec3 p, vec3 n, vec3 deformed) {
  vec3 helper = abs(n.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 t = normalize(cross(n, helper));
  vec3 b = cross(n, t);
  const float e = 0.01;
  vec3 pt = jiggleDeform(p + t * e, n);
  vec3 pb = jiggleDeform(p + b * e, n);
  return normalize(cross(pt - deformed, pb - deformed));
}
`;

// Topping keras (biskuit, remahan, popcorn) = benda padat. Tiap potongan punya titik tempel (aAnchor.xyz):
// potongan ikut BERPINDAH bersama puding di titik itu, tapi bentuknya tidak pernah ikut memendek, melebar,
// atau miring-melengkung. aAnchor.w = seberapa ikut condong (diputar utuh, bukan dibengkokkan):
// 1 untuk biskuit yang berdiri, 0 untuk tumpukan popcorn & remahan yang sekadar menumpang.
// Titik tempel di piring (y ≤ 0) = diam sama sekali.
const RIGID_GLSL = /* glsl */ `
attribute vec4 aAnchor;

// Putar v sehingga sumbu +y mengarah ke n (rumus Rodrigues; n sudah dinormalisasi)
vec3 lokaAlignUp(vec3 v, vec3 n) {
  vec3 axis = vec3(n.z, 0.0, -n.x);
  float s = length(axis);
  if (s < 1e-5) return v;
  axis /= s;
  return v * n.y + cross(axis, v) * s + axis * dot(axis, v) * (1.0 - n.y);
}

vec3 jiggleRigid(vec3 p, vec4 anchor, out vec3 up) {
  vec2 a = 8.0 * uMid - uTop;
  vec2 b = 2.0 * uTop - 8.0 * uMid;
  // Kemiringan puncak puding per satuan tinggi (turunan lengkung samping di h = 1)
  vec2 tilt = (2.0 * a + 3.0 * b) / uHeight * anchor.w;
  up = normalize(vec3(tilt.x, 1.0, tilt.y));
  if (anchor.y <= 0.0) {
    up = vec3(0.0, 1.0, 0.0);
    return p;
  }
  // Lekukan colekan menekan titik tempel ke bawah (bukan menyusutkan potongannya)
  vec3 base = jiggleDeform(anchor.xyz, vec3(0.0, 1.0, 0.0));
  return base + lokaAlignUp(p - anchor.xyz, up);
}
`;

const SOFT_VERTEX = /* glsl */ `#include <beginnormal_vertex>
vec3 jiggledPosition = jiggleDeform(position, objectNormal);
objectNormal = jiggleNormal(position, objectNormal, jiggledPosition);`;

// Benda padat hanya digeser & diputar, jadi normalnya cukup ikut diputar
const RIGID_VERTEX = /* glsl */ `#include <beginnormal_vertex>
vec3 lokaUp;
vec3 jiggledPosition = jiggleRigid(position, aAnchor, lokaUp);
objectNormal = lokaAlignUp(objectNormal, lokaUp);`;

type JiggleOptions = {
  /** Tekstur permukaan prosedural (lihat surfaceDetail.ts) */
  surface?: SurfaceOptions;
  /** Topping keras: geometri wajib punya atribut `aAnchor` (vec4: titik tempel + seberapa ikut condong) */
  rigid?: boolean;
};

/**
 * Pasang deformasi jiggle pada material (sebelum material pertama kali dikompilasi),
 * opsional sekaligus tekstur permukaannya.
 */
export function applyJiggle<T extends Material>(material: T, uniforms: JiggleUniforms, { surface, rigid = false }: JiggleOptions = {}): T {
  material.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = DEFORM_GLSL + (rigid ? RIGID_GLSL : "") + shader.vertexShader
      .replace("#include <beginnormal_vertex>", rigid ? RIGID_VERTEX : SOFT_VERTEX)
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        transformed = jiggledPosition;`,
      );
    if (surface) injectSurface(shader, surface);
  };
  material.customProgramCacheKey = () => `loka-jiggle-v2-${surface?.kind ?? "plain"}${rigid ? "-rigid2" : ""}`;
  return material;
}

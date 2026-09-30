"use client";

import { useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Group, Texture } from "three";
import type { JiggleUniforms } from "./jiggleShader";
import type { SurfaceUniforms } from "./surfaceDetail";
import { createToppings, type ToppedVariant, type ToppingSet } from "./toppings";
import type { PuddingVariant } from "./variants";

export type ToppingSets = Partial<Record<ToppedVariant, ToppingSet>>;

const TOPPED: readonly ToppedVariant[] = ["regal", "popcorn"];

// Varian lain mulai disiapkan setelah puding tampil & halaman tenang
const PREBUILD_DELAY = 1500;

/**
 * Topping dibuat hanya saat dibutuhkan. Varian yang tampil dibuat segera; varian lain disiapkan satu per satu
 * saat browser senggang lalu shader-nya dikompilasi diam-diam, jadi berganti varian nanti instan.
 * (Membuat semuanya sekaligus di awal menahan halaman ±0,25 detik di HP kelas menengah.)
 */
export function useToppings(variant: PuddingVariant, uniforms: JiggleUniforms, surface: SurfaceUniforms) {
  const gl = useThree((state) => state.gl);
  const camera = useThree((state) => state.camera);
  const scene = useThree((state) => state.scene);

  const [sets, setSets] = useState<ToppingSets>(() =>
    variant === "klasik" ? {} : { [variant]: createToppings(variant, uniforms, surface) },
  );
  // Salinan terbaru untuk callback async (dan untuk dilepas saat unmount)
  const latest = useRef<ToppingSets>(sets);
  const groups = useRef<Partial<Record<ToppedVariant, Group | null>>>({});
  const compiled = useRef(new Set<ToppedVariant>());

  useEffect(() => {
    latest.current = sets;
  }, [sets]);

  const build = useCallback(
    (target: ToppedVariant) => {
      if (latest.current[target]) return;
      latest.current = { ...latest.current, [target]: createToppings(target, uniforms, surface) };
      setSets(latest.current);
    },
    [uniforms, surface],
  );

  // Varian dipilih sebelum sempat disiapkan: buat di frame berikutnya
  useEffect(() => {
    if (variant === "klasik") return;
    const frame = requestAnimationFrame(() => build(variant));
    return () => cancelAnimationFrame(frame);
  }, [variant, build]);

  // Siapkan varian lain satu per satu saat browser senggang
  useEffect(() => {
    let cancelled = false;
    let idle = 0;
    const hasIdleCallback = "requestIdleCallback" in window;
    const queue = [...TOPPED];
    const next = () => {
      if (cancelled) return;
      const target = queue.shift();
      if (!target) return;
      build(target);
      schedule();
    };
    const schedule = () => {
      idle = hasIdleCallback ? window.requestIdleCallback(next, { timeout: 3000 }) : window.setTimeout(next, 300);
    };
    const start = window.setTimeout(schedule, PREBUILD_DELAY);
    return () => {
      cancelled = true;
      window.clearTimeout(start);
      if (hasIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, [build]);

  // Kompilasi shader topping baru yang masih tersembunyi (three.js hanya mengompilasi objek yang terlihat)
  useEffect(() => {
    for (const target of TOPPED) {
      const group = groups.current[target];
      if (!group || compiled.current.has(target)) continue;
      compiled.current.add(target);
      if (group.visible) continue; // yang sedang tampil sudah dikompilasi saat dirender
      group.visible = true;
      gl.compileAsync(group, camera, scene).catch(() => {});
      group.visible = false;
      // Unggah tekstur (pola biskuit) ke GPU sekarang juga, bukan saat pertama kali tampil
      for (const part of latest.current[target]?.parts ?? []) {
        const { map, bumpMap } = part.material as { map?: Texture | null; bumpMap?: Texture | null };
        if (map) gl.initTexture(map);
        if (bumpMap) gl.initTexture(bumpMap);
      }
    }
  }, [sets, gl, camera, scene]);

  useEffect(() => {
    const store = latest;
    return () => {
      Object.values(store.current).forEach((set) => set?.dispose());
      store.current = {};
    };
  }, []);

  return { sets, groups };
}

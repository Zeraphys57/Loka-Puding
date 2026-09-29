"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Color, Mesh, MeshPhysicalMaterial, Vector3 } from "three";
import { getLenis } from "@/lib/scroll";
import { JIGGLE } from "./jiggle.config";
import { applyJiggle, createJiggleUniforms, type JiggleUniforms } from "./jiggleShader";
import { createPuddingGeometries, disposeGeometries } from "./puddingGeometry";
import { PUDDING_TOP_Y } from "./puddingProfile";
import { JiggleSimulation } from "./springs";
import { applySurface, createSurfaceUniforms, type SurfaceUniforms } from "./surfaceDetail";
import type { ToppedVariant } from "./toppings";
import { useToppings } from "./useToppings";
import type { PuddingVariant } from "./variants";

// Topping varian yang sedang tidak tampil tidak boleh ikut "dicolek" (raycast tetap mengenai objek tersembunyi)
const NO_RAYCAST = () => {};
const MESH_RAYCAST = Mesh.prototype.raycast;

/*
 * Tekstur (pori, variasi warna, tonjolan mikro, bintik piring) dihitung prosedural di shader:
 * tanpa unduhan gambar. Warna mengikuti foto produk: susu krem, karamel cokelat pekat mengilap.
 */
function createMaterials(uniforms: JiggleUniforms, surface: SurfaceUniforms) {
  const caramel = applyJiggle(
    new MeshPhysicalMaterial({
      color: new Color("#a55f26"),
      roughness: 0.07, // licin mengilap seperti sirup gula yang mengeras
    }),
    uniforms,
    { surface: { kind: "caramel", uniforms: surface } },
  );
  const milk = applyJiggle(
    new MeshPhysicalMaterial({
      color: new Color("#f5e8cf"),
      roughness: 0.4,
      clearcoat: 1, // lapisan lembap tipis di permukaan puding
      clearcoatRoughness: 0.07,
      sheen: 0.5,
      sheenRoughness: 0.5,
      sheenColor: new Color("#ffe0b0"),
      // Sedikit cahaya dari dalam: meniru susu yang tembus cahaya (bayangan tidak kusam)
      emissive: new Color("#3a2408"),
      emissiveIntensity: 0.24,
    }),
    uniforms,
    { surface: { kind: "custard", uniforms: surface } },
  );
  const plate = applySurface(
    new MeshPhysicalMaterial({
      color: new Color("#f2e6d8"),
      roughness: 0.45,
      clearcoat: 0.35,
      clearcoatRoughness: 0.2,
    }),
    { kind: "ceramic", uniforms: surface },
  );
  const plateRim = new MeshPhysicalMaterial({
    color: new Color("#b58b5e"),
    roughness: 0.5,
    clearcoat: 0.2,
    clearcoatRoughness: 0.3,
  });
  return { caramel, milk, plate, plateRim };
}

type PuddingProps = {
  /** Bertambah setiap kali tombol "Colek pudingnya" (keyboard) ditekan → colekan di puncak */
  pokeSignal: number;
  /** Perangkat kewalahan: tonjolan mikro dimatikan (warna & bintik tetap) */
  lowQuality: boolean;
  /** Topping yang tampil (klasik = tanpa topping) */
  variant: PuddingVariant;
};

/** Bagian yang berubah setiap frame. Disimpan di ref: tidak memicu render ulang React. */
type LiveState = { uniforms: JiggleUniforms; surface: SurfaceUniforms; sim: JiggleSimulation };

export function Pudding({ pokeSignal, lowQuality, variant }: PuddingProps) {
  // Aset GPU dibuat sekali; saat render hanya dibaca
  const assets = useMemo(() => {
    const uniforms = createJiggleUniforms(PUDDING_TOP_Y, JIGGLE.dent.radius);
    const surface = createSurfaceUniforms();
    return { uniforms, surface, geometries: createPuddingGeometries(), materials: createMaterials(uniforms, surface) };
  }, []);
  const { geometries, materials } = assets;
  // Topping memakai uniform goyangan yang sama, jadi ikut bergoyang bersama pudingnya
  const toppings = useToppings(variant, assets.uniforms);

  const live = useRef<LiveState | null>(null);
  const hover = useRef({ active: false, leanX: 0, leanZ: 0, lastX: 0, lastZ: 0, tracking: false });
  const scroll = useRef<{ last: number | null; velocity: number }>({ last: null, velocity: 0 });
  const handledSignal = useRef(0);

  useEffect(() => {
    live.current = { uniforms: assets.uniforms, surface: assets.surface, sim: new JiggleSimulation(JIGGLE) };
    if (process.env.NODE_ENV !== "production") {
      Object.assign(window, { __JIGGLE: JIGGLE, __PUDDING: live });
    }
    return () => {
      live.current = null;
      disposeGeometries(assets.geometries);
      Object.values(assets.materials).forEach((material) => material.dispose());
    };
  }, [assets]);

  useEffect(() => {
    if (live.current) live.current.surface.uSurfaceBump.value = lowQuality ? 0 : 1;
  }, [lowQuality]);

  const poke = useCallback(
    (point: Vector3, haptic: boolean) => {
      const state = live.current;
      if (!state) return;
      const { impulse } = JIGGLE;
      const radial = Math.hypot(point.x, point.z);
      const side = Math.min(radial / 0.85, 1); // 0 = dicolek dari atas, 1 = dari samping
      const height = Math.min(Math.max(point.y / PUDDING_TOP_Y, 0), 1);

      if (radial > 1e-3) {
        // Terdorong menjauhi jari
        state.sim.pushSway((-point.x / radial) * impulse.tapSway * side, (-point.z / radial) * impulse.tapSway * side);
      }
      state.sim.pushSquash(-impulse.tapSquash * (0.45 + 0.55 * (1 - side)) * (0.4 + 0.6 * height));
      state.sim.pushDent(impulse.tapDent);
      state.uniforms.uDentPos.value.copy(point);

      if (haptic) navigator.vibrate?.(8);
    },
    [],
  );

  // Tombol "Colek pudingnya" untuk pengguna keyboard
  useEffect(() => {
    if (pokeSignal === handledSignal.current) return;
    handledSignal.current = pokeSignal;
    poke(new Vector3(0.14, PUDDING_TOP_Y, 0.3), false);
  }, [pokeSignal, poke]);

  useFrame((frame, delta) => {
    const state = live.current;
    if (!state) return;
    const { sim, uniforms } = state;
    const { idle, impulse } = JIGGLE;
    const t = frame.clock.elapsedTime;

    // Napas halus + condong ke arah kursor
    const breathe = Math.sin(t * idle.speed * 2.1) * idle.amplitude;
    const driftX = Math.sin(t * idle.speed * 0.9) * idle.amplitude * 1.4;
    const driftZ = Math.sin(t * idle.speed * 0.63 + 1.3) * idle.amplitude;
    const lean = hover.current.active ? hover.current : { leanX: 0, leanZ: 0 };
    sim.setRest(driftX + lean.leanX, driftZ + lean.leanZ, breathe);

    // Percepatan scroll (dari posisi scroll Lenis yang sudah dihaluskan) → puding "melorot"/meregang
    const y = getLenis()?.animatedScroll ?? window.scrollY;
    const s = scroll.current;
    if (s.last === null || delta > 0.1) {
      s.velocity = 0; // baru aktif lagi / tab baru kembali: jangan beri hentakan palsu
    } else if (delta > 0) {
      const velocity = (y - s.last) / delta;
      const change = Math.max(-4000, Math.min(4000, velocity - s.velocity));
      s.velocity = velocity;
      if (Math.abs(change) > 2) {
        sim.pushSquash(-change * impulse.scroll);
        sim.pushSway(0, change * impulse.scroll * 0.5);
      }
    }
    s.last = y;

    sim.update(delta);
    uniforms.uMid.value.set(sim.midX, sim.midZ);
    uniforms.uTop.value.set(sim.topX, sim.topZ);
    uniforms.uSquash.value = sim.squash;
    uniforms.uDent.value = sim.dent;
  });

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    poke(event.point.clone(), event.nativeEvent.pointerType === "touch");
  };

  // Hover (mouse/pena): condong ke arah kursor + dorongan kecil saat kursor bergerak
  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (event.nativeEvent.pointerType === "touch") return;
    const { x, z } = event.point;
    const radial = Math.hypot(x, z) || 1;
    const reach = Math.min(radial / 0.9, 1);
    const h = hover.current;
    h.active = true;
    h.leanX = (x / radial) * JIGGLE.impulse.hoverLean * reach;
    h.leanZ = (z / radial) * JIGGLE.impulse.hoverLean * reach;
    if (h.tracking) {
      live.current?.sim.pushSway((x - h.lastX) * JIGGLE.impulse.hoverDrag, (z - h.lastZ) * JIGGLE.impulse.hoverDrag);
    }
    h.lastX = x;
    h.lastZ = z;
    h.tracking = true;
  };

  const setCursor = (event: ThreeEvent<PointerEvent>, cursor: string) => {
    const target = event.nativeEvent.target;
    if (target instanceof HTMLElement) target.style.cursor = cursor;
  };

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => setCursor(event, "pointer");

  const handlePointerOut = (event: ThreeEvent<PointerEvent>) => {
    hover.current.active = false;
    hover.current.tracking = false;
    setCursor(event, "");
  };

  return (
    <group>
      <group
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <mesh geometry={geometries.milk} material={materials.milk} dispose={null} />
        <mesh geometry={geometries.caramel} material={materials.caramel} dispose={null} />

        {/* Topping varian yang sudah disiapkan; hanya yang aktif yang terlihat & bisa dicolek */}
        {(Object.keys(toppings.sets) as ToppedVariant[]).map((target) => {
          const active = target === variant;
          return (
            <group
              key={target}
              visible={active}
              ref={(group) => {
                toppings.groups.current[target] = group;
              }}
            >
              {toppings.sets[target]?.parts.map((part, index) => (
                <mesh
                  key={index}
                  geometry={part.geometry}
                  material={part.material}
                  raycast={active ? MESH_RAYCAST : NO_RAYCAST}
                  dispose={null}
                />
              ))}
            </group>
          );
        })}
      </group>
      <mesh geometry={geometries.plate} material={materials.plate} dispose={null} />
      <mesh geometry={geometries.plateRim} material={materials.plateRim} dispose={null} />
    </group>
  );
}

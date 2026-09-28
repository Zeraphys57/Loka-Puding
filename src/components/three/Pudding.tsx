"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Color, MeshPhysicalMaterial, Vector3 } from "three";
import { getLenis } from "@/lib/scroll";
import { JIGGLE } from "./jiggle.config";
import { applyJiggle, createJiggleUniforms, type JiggleUniforms } from "./jiggleShader";
import { createPuddingGeometries, disposeGeometries } from "./puddingGeometry";
import { PUDDING_TOP_Y } from "./puddingProfile";
import { JiggleSimulation } from "./springs";

/*
 * Material dibuat supaya berbagi program shader sebanyak mungkin (lebih sedikit kompilasi):
 * susu, krim, dan blueberry memakai fitur yang sama (clearcoat + sheen), beda nilai saja.
 */
function createMaterials(uniforms: JiggleUniforms) {
  const jelly = applyJiggle(
    new MeshPhysicalMaterial({
      color: new Color("#c27a29"),
      roughness: 0.06,
      transmission: 1,
      thickness: 0.9,
      ior: 1.34, // mendekati air/gelatin
      attenuationColor: new Color("#8c4a10"),
      attenuationDistance: 1.15, // makin tebal → makin pekat
      clearcoat: 1,
      clearcoatRoughness: 0.04,
    }),
    uniforms,
  );
  const milk = applyJiggle(
    new MeshPhysicalMaterial({
      color: new Color("#f7ead2"), // warm beige
      roughness: 0.25, // more glossy/smooth like pudding
      clearcoat: 0.8, // shinier surface
      clearcoatRoughness: 0.15,
      sheen: 0.8, // more velvety subsurface look at glancing angles
      sheenRoughness: 0.5,
      sheenColor: new Color("#ffd199"), // warm peach/caramel sheen reflection
    }),
    uniforms,
  );
  const cream = applyJiggle(
    new MeshPhysicalMaterial({
      color: new Color("#ffffff"),
      roughness: 0.55,
      clearcoat: 0.1,
      clearcoatRoughness: 0.5,
      sheen: 0.7,
      sheenRoughness: 0.4,
      sheenColor: new Color("#eef4ff"),
    }),
    uniforms,
  );
  const berry = applyJiggle(
    new MeshPhysicalMaterial({
      color: new Color("#754316"),
      roughness: 0.3,
      clearcoat: 0.8,
      clearcoatRoughness: 0.15,
      sheen: 0.2,
      sheenRoughness: 0.6,
      sheenColor: new Color("#d6975a"),
    }),
    uniforms,
  );
  const plate = new MeshPhysicalMaterial({
    color: new Color("#f2e6d8"),
    roughness: 0.5,
    clearcoat: 0.2,
    clearcoatRoughness: 0.3,
  });
  const plateRim = new MeshPhysicalMaterial({
    color: new Color("#b58b5e"),
    roughness: 0.5,
    clearcoat: 0.2,
    clearcoatRoughness: 0.3,
  });
  return { jelly, milk, cream, berry, plate, plateRim };
}

type PuddingProps = {
  /** Bertambah setiap kali tombol petunjuk ditekan → colekan di puncak */
  pokeSignal: number;
  /** Interaksi pertama (untuk menyembunyikan petunjuk) */
  onInteract: () => void;
};

/** Bagian yang berubah setiap frame. Disimpan di ref: tidak memicu render ulang React. */
type LiveState = { uniforms: JiggleUniforms; sim: JiggleSimulation };

export function Pudding({ pokeSignal, onInteract }: PuddingProps) {
  // Aset GPU dibuat sekali; saat render hanya dibaca
  const assets = useMemo(() => {
    const uniforms = createJiggleUniforms(PUDDING_TOP_Y, JIGGLE.dent.radius);
    return { uniforms, geometries: createPuddingGeometries(), materials: createMaterials(uniforms) };
  }, []);
  const { geometries, materials } = assets;

  const live = useRef<LiveState | null>(null);
  const hover = useRef({ active: false, leanX: 0, leanZ: 0, lastX: 0, lastZ: 0, tracking: false });
  const scroll = useRef<{ last: number | null; velocity: number }>({ last: null, velocity: 0 });
  const handledSignal = useRef(0);

  useEffect(() => {
    live.current = { uniforms: assets.uniforms, sim: new JiggleSimulation(JIGGLE) };
    if (process.env.NODE_ENV !== "production") {
      Object.assign(window, { __JIGGLE: JIGGLE, __PUDDING: live });
    }
    return () => {
      live.current = null;
      disposeGeometries(assets.geometries);
      Object.values(assets.materials).forEach((material) => material.dispose());
    };
  }, [assets]);

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
      onInteract();
    },
    [onInteract],
  );

  // Tombol "Coba colek pudingnya!" (juga untuk pengguna keyboard)
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
        <mesh geometry={geometries.jelly} material={materials.jelly} dispose={null} />
        <mesh geometry={geometries.cream} material={materials.cream} dispose={null} />
        <mesh geometry={geometries.berry} material={materials.berry} dispose={null} />
      </group>
      <mesh geometry={geometries.plate} material={materials.plate} dispose={null} />
      <mesh geometry={geometries.plateRim} material={materials.plateRim} dispose={null} />
    </group>
  );
}

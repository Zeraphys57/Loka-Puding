"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import {
  BackSide,
  BufferAttribute,
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  SphereGeometry,
} from "three";

type Softbox = {
  size: [number, number];
  position: [number, number, number];
  color: string;
  strength: number;
};

/*
 * Pencahayaan studio: beberapa "softbox" (bidang bercahaya, ala Lightformer) di dalam kubah
 * bergradasi biru-putih, dipanggang SEKALI menjadi environment map (PMREM).
 * Tanpa unduhan file HDR sama sekali, tapi tetap menghasilkan pantulan mengilap khas foto produk.
 */
const SOFTBOXES: Softbox[] = [
  { size: [9, 4], position: [-1.5, 7, 4], color: "#ffffff", strength: 3.2 }, // key light besar di atas-depan
  { size: [1.6, 9], position: [-7, 2.5, 2], color: "#f2f7ff", strength: 2.2 }, // strip kiri
  { size: [1.6, 9], position: [7, 2, 1], color: "#d9e7ff", strength: 1.4 }, // strip kanan (lebih dingin)
  { size: [7, 2.2], position: [0, 1.8, -7], color: "#ffffff", strength: 2.6 }, // rim light belakang
];

function gradientDome(): Mesh {
  const geometry = new SphereGeometry(20, 32, 16);
  const position = geometry.getAttribute("position");
  const colors = new Float32Array(position.count * 3);
  const top = new Color("#ffffff").multiplyScalar(0.75);
  const horizon = new Color("#dcebff").multiplyScalar(0.55);
  const bottom = new Color("#6f8fd6").multiplyScalar(0.18);
  const color = new Color();
  for (let i = 0; i < position.count; i++) {
    const t = position.getY(i) / 20; // -1 … 1
    if (t >= 0) color.copy(horizon).lerp(top, t);
    else color.copy(horizon).lerp(bottom, Math.min(-t * 1.6, 1));
    color.toArray(colors, i * 3);
  }
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  return new Mesh(geometry, new MeshBasicMaterial({ vertexColors: true, side: BackSide }));
}

export function StudioEnvironment({ intensity = 1 }: { intensity?: number }) {
  // Objek three.js diambil lewat get() di dalam effect: diubah secara imperatif, bukan state React
  const get = useThree((state) => state.get);

  useEffect(() => {
    const { gl, scene } = get();
    const envScene = new Scene();
    envScene.add(gradientDome());
    for (const box of SOFTBOXES) {
      const panel = new Mesh(
        new PlaneGeometry(...box.size),
        new MeshBasicMaterial({
          color: new Color(box.color).multiplyScalar(box.strength),
          side: DoubleSide,
        }),
      );
      panel.position.set(...box.position);
      panel.lookAt(0, 0.6, 0);
      envScene.add(panel);
    }

    const pmrem = new PMREMGenerator(gl);
    const target = pmrem.fromScene(envScene, 0.035);
    scene.environment = target.texture;
    scene.environmentIntensity = intensity;

    envScene.traverse((object) => {
      if (object instanceof Mesh) {
        object.geometry.dispose();
        (object.material as MeshBasicMaterial).dispose();
      }
    });
    pmrem.dispose();

    return () => {
      scene.environment = null;
      target.dispose();
    };
  }, [get, intensity]);

  return null;
}

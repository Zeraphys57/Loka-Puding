import { BufferGeometry, LatheGeometry, SphereGeometry, TorusGeometry, Vector2 } from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  BERRY,
  CREAM_WALL,
  JELLY_WALL,
  LAYER_SPLIT_Y,
  MILK_WALL,
  PLATE_RADIUS,
  sampleWall,
  type ProfilePoint,
} from "./puddingProfile";

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
};

/**
 * Putar profil menjadi geometri, lalu (opsional) ubah radius per vertex.
 * UV dihapus & vertex kembar di sambungan digabung, sehingga normal halus tanpa garis sambungan.
 */
function lathe(
  profile: readonly ProfilePoint[],
  segments: number,
  shapeRadius?: (radius: number, y: number, angle: number) => number,
): BufferGeometry {
  const geometry = new LatheGeometry(
    profile.map(([r, y]) => new Vector2(Math.max(r, 1e-4), y)),
    segments,
  );

  if (shapeRadius) {
    const position = geometry.getAttribute("position");
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      const z = position.getZ(i);
      const r = Math.hypot(x, z);
      if (r < 1e-4) continue;
      const angle = Math.atan2(x, z);
      const k = shapeRadius(r, y, angle) / r;
      position.setXYZ(i, x * k, y, z * k);
    }
  }

  geometry.deleteAttribute("uv");
  const merged = mergeVertices(geometry, 1e-5);
  geometry.dispose();
  merged.computeVertexNormals();
  merged.computeBoundingSphere();
  return merged;
}

const FLUTES = 12;

export type PuddingGeometries = {
  milk: BufferGeometry;
  jelly: BufferGeometry;
  cream: BufferGeometry;
  berry: BufferGeometry;
  plate: BufferGeometry;
  plateRim: BufferGeometry;
};

export function createPuddingGeometries(detail: "high" | "low" = "high"): PuddingGeometries {
  const segments = detail === "high" ? 72 : 48;
  const samples = detail === "high" ? 6 : 4;

  // Lapisan susu: dinding + tutup datar (terlihat samar menembus jeli di atasnya)
  const milkProfile: ProfilePoint[] = [
    ...sampleWall(MILK_WALL, samples),
    [0.6, LAYER_SPLIT_Y],
    [0.3, LAYER_SPLIT_Y],
    [0, LAYER_SPLIT_Y],
  ];
  // Lapisan susu dibiarkan mulus & creamy (alur cetakan hanya di jeli)
  const milk = lathe(milkProfile, segments);

  // Lapisan jeli: alur lebih tegas di sisi, memudar menuju kubah atas
  const jelly = lathe(sampleWall(JELLY_WALL, samples), segments, (r, y, angle) => {
    const amount = 0.024 * smoothstep(0.6, 0.7, y) * smoothstep(0.55, 0.74, r) * (1 - smoothstep(1.16, 1.23, y));
    return r * (1 + amount * Math.cos(FLUTES * angle + Math.PI / FLUTES));
  });

  // Krim: bentuk kuncup dengan ulir spiral seperti hasil semprotan piping bag
  const creamBase = CREAM_WALL[0][1];
  const creamTop = CREAM_WALL[CREAM_WALL.length - 1][1];
  const cream = lathe(sampleWall(CREAM_WALL, samples + 2), segments, (r, y, angle) => {
    const t = (y - creamBase) / (creamTop - creamBase);
    const ridge = 0.12 * Math.sin(Math.PI * Math.min(Math.max(t, 0), 1)) * Math.cos(7 * angle + t * 9);
    return r * (1 + ridge);
  });

  const berry = new SphereGeometry(BERRY.radius, detail === "high" ? 24 : 16, detail === "high" ? 16 : 12);
  berry.scale(1, 0.9, 1);
  berry.translate(BERRY.x, BERRY.y, BERRY.z);

  // Piring: urutan titik dari dasar → tepi → permukaan atas (normal menghadap keluar)
  const plateProfile: ProfilePoint[] = [
    [0, -0.085],
    [0.9, -0.085],
    [1.0, -0.055],
    [1.42, -0.03],
    [1.56, 0.03],
    [PLATE_RADIUS + 0.015, 0.062],
    [PLATE_RADIUS - 0.005, 0.075],
    [1.5, 0.062],
    [1.36, 0.02],
    [1.22, 0],
    [0.6, 0],
    [0, 0],
  ];
  const plate = lathe(plateProfile, segments);

  const plateRim = new TorusGeometry(PLATE_RADIUS - 0.012, 0.011, 8, segments * 2);
  plateRim.rotateX(Math.PI / 2);
  plateRim.translate(0, 0.074, 0);

  return { milk, jelly, cream, berry, plate, plateRim };
}

export function disposeGeometries(geometries: PuddingGeometries): void {
  Object.values(geometries).forEach((geometry) => geometry.dispose());
}

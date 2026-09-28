import { BufferGeometry, LatheGeometry, TorusGeometry, Vector2 } from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { CARAMEL_WALL, LAYER_SPLIT_Y, MILK_WALL, PLATE_RADIUS, sampleWall, type ProfilePoint } from "./puddingProfile";

/**
 * Putar profil menjadi geometri.
 * UV dihapus & vertex kembar di sambungan digabung, sehingga normal halus tanpa garis sambungan.
 */
function lathe(profile: readonly ProfilePoint[], segments: number): BufferGeometry {
  const geometry = new LatheGeometry(
    profile.map(([r, y]) => new Vector2(Math.max(r, 1e-4), y)),
    segments,
  );
  geometry.deleteAttribute("uv");
  const merged = mergeVertices(geometry, 1e-5);
  geometry.dispose();
  merged.computeVertexNormals();
  merged.computeBoundingSphere();
  return merged;
}

export type PuddingGeometries = {
  milk: BufferGeometry;
  caramel: BufferGeometry;
  plate: BufferGeometry;
  plateRim: BufferGeometry;
};

export function createPuddingGeometries(detail: "high" | "low" = "high"): PuddingGeometries {
  const segments = detail === "high" ? 96 : 64;
  const samples = detail === "high" ? 6 : 4;

  // Lapisan susu: dinding + tutup datar (tertutup lapisan karamel, samar terlihat menembusnya)
  const milk = lathe(
    [...sampleWall(MILK_WALL, samples), [0.6, LAYER_SPLIT_Y], [0.3, LAYER_SPLIT_Y], [0, LAYER_SPLIT_Y]],
    segments,
  );

  // Lapisan karamel: sampel lebih rapat di tepi atas yang membulat (tempat kilau bergulir saat bergoyang)
  const caramel = lathe(sampleWall(CARAMEL_WALL, samples + 2), segments);

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

  return { milk, caramel, plate, plateRim };
}

export function disposeGeometries(geometries: PuddingGeometries): void {
  Object.values(geometries).forEach((geometry) => geometry.dispose());
}

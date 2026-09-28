/**
 * Menentukan apakah puding 3D layak dijalankan di perangkat ini.
 * Jika tidak, ilustrasi statis (SVG) yang tampil, tanpa mengunduh three.js sama sekali.
 *
 * Untuk pengujian: tambahkan `?pudding=3d` atau `?pudding=static` di URL.
 */
export type Support3D =
  | { ok: true; forced?: boolean }
  | {
      ok: false;
      reason: "forced-static" | "reduced-motion" | "save-data" | "slow-network" | "low-memory" | "no-webgl2" | "software-renderer";
    };

type NavigatorHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};

function readRenderer(gl: WebGL2RenderingContext): string {
  const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
  const renderer = debugInfo
    ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
    : gl.getParameter(gl.RENDERER);
  return String(renderer ?? "");
}

export function detect3DSupport(): Support3D {
  const forced = new URLSearchParams(window.location.search).get("pudding");
  if (forced === "static") return { ok: false, reason: "forced-static" };
  if (forced === "3d") return { ok: true, forced: true };

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return { ok: false, reason: "reduced-motion" };

  const nav = navigator as NavigatorHints;
  if (nav.connection?.saveData) return { ok: false, reason: "save-data" };
  if (/(^|-)2g$/.test(nav.connection?.effectiveType ?? "")) return { ok: false, reason: "slow-network" };
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 2) return { ok: false, reason: "low-memory" };

  // three.js modern butuh WebGL2. `failIfMajorPerformanceCaveat` menolak render berbasis CPU.
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: true });
  if (!gl) return { ok: false, reason: "no-webgl2" };

  const renderer = readRenderer(gl);
  gl.getExtension("WEBGL_lose_context")?.loseContext();
  if (/swiftshader|llvmpipe|softpipe|software|basic render driver/i.test(renderer)) {
    return { ok: false, reason: "software-renderer" };
  }

  return { ok: true };
}

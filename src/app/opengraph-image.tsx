import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { PuddingFallback } from "@/components/three/PuddingFallback";
import { siteConfig } from "@/config/site";
import { palette, type Palette } from "@/config/theme";
import { dripPath } from "@/lib/drip";

// Gambar pratinjau saat link dibagikan (WhatsApp, Instagram, X, dll.). Dibuat sekali saat build.
export const alt = `${siteConfig.name}: puding karamel homemade yang lembut, lumer, dan bikin nagih`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Font statis (Satori belum mendukung variable font / woff2): Fraunces SOFT & Plus Jakarta Sans
const fontDir = join(process.cwd(), "src/app/_og");
const frauncesBlack = readFile(join(fontDir, "Fraunces-Soft900.woff"));
const frauncesItalic = readFile(join(fontDir, "Fraunces-Italic-Soft500.woff"));
const jakartaBold = readFile(join(fontDir, "PlusJakartaSans-Bold.woff"));

// Satori tidak bisa membaca CSS variable, jadi nilainya disalin dari globals.css (@theme & [data-palette="biru"])
const PALETTES: Record<Palette, Record<"milk" | "milk50" | "caramel100" | "caramel500" | "caramel600" | "caramel700" | "espresso" | "shadow", string>> = {
  karamel: {
    milk: "#fbf6ee",
    milk50: "#fffcf7",
    caramel100: "#fbe6c8",
    caramel500: "#bd6e23",
    caramel600: "#a0561a",
    caramel700: "#80420f",
    espresso: "#2b1a10",
    shadow: "rgba(128,66,15,0.28)",
  },
  biru: {
    milk: "#f3f7fc",
    milk50: "#fbfdff",
    caramel100: "#dde9f8",
    caramel500: "#5580bd",
    caramel600: "#3c66a3",
    caramel700: "#2d4f87",
    espresso: "#1b2a45",
    shadow: "rgba(45,79,135,0.28)",
  },
};
const C = PALETTES[palette];

// Lelehan di tepi atas = karamel produk (pudding-caramel-600), sama seperti navbar: tidak ikut palet
const DRIP_COLOR = "#97541f";

const DRIP = dripPath({ width: 600, height: 70, band: 26, seed: 29, count: 7 });

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: `radial-gradient(circle at 78% 58%, ${C.caramel100} 0%, ${C.milk} 55%)`,
          fontFamily: "Jakarta",
          color: C.espresso,
        }}
      >
        {/* Pita karamel yang meleleh di tepi atas */}
        <svg width="1200" height="70" viewBox="0 0 1200 70" style={{ position: "absolute", top: 0, left: 0 }}>
          <path d={DRIP} fill={DRIP_COLOR} />
          <path d={DRIP} fill={DRIP_COLOR} transform="translate(600 0)" />
        </svg>

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "90px 0 60px 72px", width: 760 }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 22, letterSpacing: 5, color: C.caramel700 }}>
            {/* Bintang kecil, sama dengan penanda label di website */}
            <svg width="20" height="20" viewBox="0 0 12 12" style={{ marginRight: 14 }}>
              <path d="M6 0l1.6 4.4L12 6 7.6 7.6 6 12 4.4 7.6 0 6l4.4-1.6z" fill={C.caramel500} />
            </svg>
            PUDING KARAMEL HOMEMADE
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 26, lineHeight: 0.92 }}>
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <span style={{ fontFamily: "Fraunces", fontWeight: 900, fontSize: 90, letterSpacing: -1, flexShrink: 0 }}>LEMBUT</span>
              <span style={{ fontFamily: "Fraunces Italic", fontSize: 98, color: C.caramel500, marginLeft: 24, flexShrink: 0 }}>lumer,</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <span style={{ fontFamily: "Fraunces", fontWeight: 900, fontSize: 90, letterSpacing: -1, flexShrink: 0 }}>BIKIN</span>
              <span style={{ fontFamily: "Fraunces Italic", fontSize: 98, color: C.caramel500, marginLeft: 24, flexShrink: 0 }}>nagih.</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 44 }}>
            <div
              style={{
                display: "flex",
                padding: "16px 30px",
                borderRadius: 999,
                background: C.caramel600,
                color: "#ffffff",
                fontSize: 28,
              }}
            >
              Pesan via WhatsApp
            </div>
            <div style={{ display: "flex", marginLeft: 26, fontFamily: "Fraunces", fontWeight: 900, fontSize: 36 }}>
              Loka
              <span style={{ fontFamily: "Fraunces Italic", color: C.caramel600, marginLeft: 10 }}>Pudding</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, paddingTop: 40 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 400,
              height: 400,
              borderRadius: 999,
              background: C.milk50,
              boxShadow: `0 30px 70px ${C.shadow}`,
            }}
          >
            <PuddingFallback size={372} />
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Fraunces", data: await frauncesBlack, style: "normal", weight: 900 },
        { name: "Fraunces Italic", data: await frauncesItalic, style: "normal", weight: 500 },
        { name: "Jakarta", data: await jakartaBold, style: "normal", weight: 700 },
      ],
    },
  );
}

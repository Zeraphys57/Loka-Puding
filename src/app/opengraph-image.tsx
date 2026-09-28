import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { PuddingFallback } from "@/components/three/PuddingFallback";
import { siteConfig } from "@/config/site";

// Gambar pratinjau saat link dibagikan (WhatsApp, Instagram, X, dll.). Dibuat sekali saat build.
export const alt = `${siteConfig.name}: ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const fredoka = readFile(join(process.cwd(), "src/app/_og/Fredoka-SemiBold.ttf"));

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 80px",
          background: "linear-gradient(135deg, #1e4fd8 0%, #2f63ea 55%, #5b87f5 100%)",
          fontFamily: "Fredoka",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 600 }}>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              padding: "10px 24px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.16)",
              fontSize: 28,
            }}
          >
            Homemade · Fresh setiap hari
          </div>
          <div style={{ display: "flex", fontSize: 104, lineHeight: 1, marginTop: 28 }}>{siteConfig.name}</div>
          <div style={{ display: "flex", fontSize: 44, lineHeight: 1.2, marginTop: 24, color: "#dcebff" }}>
            {siteConfig.tagline}
          </div>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              marginTop: 40,
              padding: "16px 34px",
              borderRadius: 999,
              background: "#ffc94d",
              color: "#0b1b3f",
              fontSize: 32,
            }}
          >
            Pesan via WhatsApp
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 470,
            height: 470,
            borderRadius: 999,
            background: "#fafcff",
            boxShadow: "0 30px 80px rgba(11,27,63,0.35)",
          }}
        >
          <PuddingFallback size={430} />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Fredoka", data: await fredoka, style: "normal", weight: 600 }],
    },
  );
}

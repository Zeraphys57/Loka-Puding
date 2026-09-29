import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { palette, paletteColors } from "@/config/theme";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.name,
    description: siteConfig.description,
    lang: "id",
    start_url: "/",
    display: "standalone",
    background_color: paletteColors[palette].background,
    theme_color: paletteColors[palette].brand,
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}

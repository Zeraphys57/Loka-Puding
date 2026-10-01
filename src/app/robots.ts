import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  return {
    // /dapur = catatan toko milik pemilik (tanpa link rahasia isinya 404): tidak perlu dijelajahi mesin pencari
    rules: { userAgent: "*", allow: "/", disallow: "/dapur" },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}

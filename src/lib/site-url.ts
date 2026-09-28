/**
 * URL absolut website, dipakai metadata, sitemap, robots, dan JSON-LD (server saja).
 *
 * Urutan: NEXT_PUBLIC_SITE_URL (isi saat sudah punya domain sendiri)
 *       → domain produksi Vercel (otomatis saat deploy)
 *       → localhost untuk development.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProduction) return `https://${vercelProduction}`;

  return "http://localhost:3000";
}

import type { Metadata, Viewport } from "next";
import { Caveat, Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { siteConfig } from "@/config/site";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

/*
 * Tiga keluarga font, semuanya self-hosted oleh next/font (tanpa request ke Google saat dibuka):
 * - Fraunces: judul. Sumbu SOFT membuat sudut hurufnya membulat & kenyal seperti puding,
 *   WONK memberi italic yang "miring nakal" untuk kata aksen (Lumer, Nagih, …).
 * - Plus Jakarta Sans: teks. Dibuat foundry Indonesia (Tokotype) untuk identitas kota Jakarta.
 * - Caveat: catatan tulisan tangan kecil, dipakai hemat.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["SOFT", "WONK", "opsz"],
  variable: "--font-fraunces",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: "600",
  variable: "--font-caveat",
  display: "swap",
  // Hanya untuk catatan dekoratif: tidak perlu menyaingi font utama saat halaman dimuat
  preload: false,
});

const title = `${siteConfig.name} · Puding Karamel Homemade, Lembut & Lumer`;

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: title,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  applicationName: siteConfig.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: siteConfig.name,
    title,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: siteConfig.description,
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#fbf6ee",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${fraunces.variable} ${jakarta.variable} ${caveat.variable}`}>
      <body className="font-sans">
        <a
          href="#konten"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:rounded-full focus:bg-primary focus:px-5 focus:py-3 focus:font-semibold focus:text-white"
        >
          Lewati ke konten utama
        </a>
        {children}
        <SmoothScroll />
      </body>
    </html>
  );
}

import { About } from "@/components/sections/About";
import { Footer } from "@/components/sections/Footer";
import { Hero } from "@/components/sections/Hero";
import { Location } from "@/components/sections/Location";
import { MenuCatalog } from "@/components/sections/MenuCatalog";
import { Navbar } from "@/components/sections/Navbar";
import { JsonLd } from "@/components/ui/JsonLd";
import { Marquee } from "@/components/ui/Marquee";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { buildBusinessJsonLd } from "@/lib/jsonld";
import { getSiteUrl } from "@/lib/site-url";

export default function HomePage() {
  return (
    <>
      <JsonLd data={buildBusinessJsonLd(getSiteUrl())} />
      <Navbar />
      <main id="konten" tabIndex={-1}>
        <Hero />
        <Marquee items={["Lembut", "Lumer", "Bikin nagih", "Homemade", "Fresh tiap pagi", "Karamel asli"]} />
        <About />
        <MenuCatalog />
        <Location />
        {/* Penanda akhir konten: saat terlihat, footer sedang tersingkap (lihat Navbar) */}
        <div data-footer-sentinel aria-hidden="true" />
      </main>
      <Footer />
      <ScrollReveal />
    </>
  );
}

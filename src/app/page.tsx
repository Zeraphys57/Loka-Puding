import { About } from "@/components/sections/About";
import { Footer } from "@/components/sections/Footer";
import { Hero } from "@/components/sections/Hero";
import { Location } from "@/components/sections/Location";
import { MenuCatalog } from "@/components/sections/MenuCatalog";
import { Navbar } from "@/components/sections/Navbar";
import { JsonLd } from "@/components/ui/JsonLd";
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
        <About />
        <MenuCatalog />
        <Location />
      </main>
      <Footer />
      <ScrollReveal />
    </>
  );
}

import { siteConfig } from "@/config/site";
import { formatRupiah } from "@/lib/format";
import { getMenuCategories, getMenuItems } from "@/lib/menu";

/**
 * Data terstruktur schema.org (Bakery ⊂ FoodEstablishment ⊂ LocalBusiness) untuk Google.
 * Semua nilai diambil dari config/site.ts dan data/menu.ts, jadi tidak perlu diubah di sini.
 */
export function buildBusinessJsonLd(siteUrl: string) {
  const items = getMenuItems();
  const categories = getMenuCategories(items);
  const { address, geo, openingHours, social, whatsapp, maps } = siteConfig;
  // Kisaran harga dihitung dari menu, jadi selalu sesuai saat menu bertambah
  const prices = items.map((item) => item.price);
  const priceRange = prices.length
    ? `${formatRupiah(Math.min(...prices))} – ${formatRupiah(Math.max(...prices))}`
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Bakery",
    "@id": `${siteUrl}/#bisnis`,
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteUrl,
    image: `${siteUrl}/opengraph-image`,
    logo: `${siteUrl}/icon.svg`,
    telephone: `+${whatsapp.number}`,
    priceRange,
    servesCuisine: ["Dessert", "Puding"],
    currenciesAccepted: "IDR",
    address: {
      "@type": "PostalAddress",
      streetAddress: `${address.street}, ${address.locality}`,
      addressLocality: address.city,
      addressRegion: address.region,
      postalCode: address.postalCode,
      addressCountry: address.country,
    },
    geo: { "@type": "GeoCoordinates", latitude: geo.latitude, longitude: geo.longitude },
    hasMap: maps.link,
    openingHoursSpecification: openingHours.map((slot) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: slot.days.map((day) => `https://schema.org/${day}`),
      opens: slot.opens,
      closes: slot.closes,
    })),
    sameAs: [social.instagram.url, social.tiktok.url].filter(Boolean),
    hasMenu: {
      "@type": "Menu",
      name: `Menu ${siteConfig.name}`,
      hasMenuSection: categories.map((category) => ({
        "@type": "MenuSection",
        name: category.label,
        hasMenuItem: items
          .filter((item) => item.category === category.id)
          .map((item) => ({
            "@type": "MenuItem",
            name: item.name,
            description: item.description,
            image: item.image ? `${siteUrl}${item.image}` : undefined,
            offers: {
              "@type": "Offer",
              price: item.price,
              priceCurrency: "IDR",
              availability: item.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            },
          })),
      })),
    },
  };
}

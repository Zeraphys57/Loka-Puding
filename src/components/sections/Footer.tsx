import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { HeartIcon, InstagramIcon, TikTokIcon, WhatsAppIcon } from "@/components/ui/Icons";
import { Logo } from "@/components/ui/Logo";
import { navLinks, siteConfig } from "@/config/site";
import { formatTime } from "@/lib/format";
import { whatsappOrderLink } from "@/lib/whatsapp";

/*
 * Footer "tersingkap": menempel di dasar layar (sticky) di belakang konten, lalu terlihat
 * saat section terakhir bergulir ke atas. Tingginya mengikuti isi, jadi aman di layar pendek.
 */
export function Footer() {
  const { social, address, openingHours } = siteConfig;

  return (
    <footer className="on-dark sticky bottom-0 -z-10 overflow-hidden bg-espresso-900 text-milk-50">
      <div aria-hidden="true" className="bg-grain pointer-events-none absolute inset-0 opacity-60" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 left-1/2 size-[50rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(189_110_35/0.3),transparent)]"
      />

      <Container className="relative pt-24 pb-8 sm:pt-28">
        {/* Ajakan utama */}
        <div className="flex flex-col gap-10 border-b border-milk-50/10 pb-14 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Eyebrow tone="dark" className="mb-6">
              Yuk, pesan
            </Eyebrow>
            <h2 className="text-[clamp(2.5rem,6.5vw,4.75rem)] leading-[1.02] font-black tracking-[-0.03em]">
              Siap menikmati puding{" "}
              <span className="font-wonky font-medium text-caramel-300 italic">lumer</span> di mulut?
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={whatsappOrderLink()} external variant="primary" size="lg">
              <WhatsAppIcon />
              Pesan via WhatsApp
            </ButtonLink>
            <ButtonLink href="#menu" variant="light" size="lg">
              Lihat Menu
            </ButtonLink>
          </div>
        </div>

        {/* Info */}
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <a href="#home" className="group/logo w-fit rounded-full" aria-label="Loka Pudding, kembali ke atas">
              <Logo tone="light" id="mark-footer" />
            </a>
            <p className="max-w-xs leading-relaxed text-milk-50/70">{siteConfig.tagline}</p>
          </div>

          <nav aria-label="Navigasi footer">
            <h3 className="mb-4 font-sans text-xs font-bold tracking-[0.22em] text-caramel-300 uppercase">Jelajahi</h3>
            <ul className="flex flex-col gap-2.5">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-milk-50/80 transition-colors hover:text-caramel-300">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="mb-4 font-sans text-xs font-bold tracking-[0.22em] text-caramel-300 uppercase">Dapur kami</h3>
            <address className="leading-relaxed text-milk-50/80 not-italic">
              {address.street}
              <br />
              {address.locality}, {address.city}
            </address>
            <ul className="mt-3 flex flex-col gap-1 text-sm text-milk-50/70">
              {openingHours.map((slot) => (
                <li key={slot.label}>
                  {slot.label}: {formatTime(slot.opens)}–{formatTime(slot.closes)}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-sans text-xs font-bold tracking-[0.22em] text-caramel-300 uppercase">Ikuti kami</h3>
            <ul className="flex flex-col gap-3">
              <li>
                <a
                  href={social.instagram.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-3 text-milk-50/80 transition-colors hover:text-caramel-300"
                >
                  <span className="grid size-11 place-items-center rounded-full ring-1 ring-milk-50/15 transition-colors group-hover:bg-caramel-600 group-hover:text-white group-hover:ring-caramel-600">
                    <InstagramIcon className="size-5" />
                  </span>
                  {social.instagram.handle}
                </a>
              </li>
              <li>
                <a
                  href={social.tiktok.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-3 text-milk-50/80 transition-colors hover:text-caramel-300"
                >
                  <span className="grid size-11 place-items-center rounded-full ring-1 ring-milk-50/15 transition-colors group-hover:bg-caramel-600 group-hover:text-white group-hover:ring-caramel-600">
                    <TikTokIcon className="size-5" />
                  </span>
                  {social.tiktok.handle}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Wordmark raksasa */}
        <p
          aria-hidden="true"
          className="mb-8 text-center font-display text-[clamp(3rem,13.5vw,14rem)] leading-[0.95] font-black tracking-[-0.05em] whitespace-nowrap select-none"
        >
          <span className="bg-gradient-to-b from-caramel-500 to-caramel-800 bg-clip-text text-transparent">Loka </span>
          <span className="font-wonky bg-gradient-to-b from-caramel-300 to-caramel-700 bg-clip-text font-medium text-transparent italic">
            Pudding
          </span>
        </p>

        <div className="relative flex flex-col items-center justify-between gap-2 border-t border-milk-50/10 pt-6 text-xs font-semibold tracking-[0.14em] text-milk-50/60 uppercase sm:flex-row">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}
          </p>
          <p className="inline-flex items-center gap-1.5">
            Dibuat dengan <HeartIcon className="size-3.5 text-caramel-400" />
            <span className="sr-only">cinta</span> di Indonesia
          </p>
        </div>
      </Container>
    </footer>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DapurNav } from "@/components/dapur/DapurNav";
import { LockDeviceButton } from "@/components/dapur/LockDeviceButton";
import { EmptyState } from "@/components/dapur/ui";
import { ArrowUpRightIcon } from "@/components/ui/Icons";
import { Logo } from "@/components/ui/Logo";
import { siteConfig } from "@/config/site";
import { canOpenDapur, isRememberedDevice } from "@/lib/dapur/access";
import { storageKind } from "@/lib/dapur/store";

export const metadata: Metadata = {
  // Tab browser: "Dapur · Loka Pudding", "Pre-order · Dapur Loka Pudding", …
  title: { default: "Dapur", template: `%s · Dapur ${siteConfig.name}` },
  description: "Catatan toko: pre-order, pembukuan, dan stok bahan.",
  robots: { index: false, follow: false },
};

const footerLink = "rounded font-bold text-caramel-700 underline decoration-caramel-300 decoration-2 underline-offset-4 hover:text-caramel-800";

/**
 * "Dapur": catatan toko untuk pemilik (pre-order, pembukuan, stok bahan).
 * Tanpa halaman login: hanya perangkat yang pernah membuka link rahasia yang bisa masuk,
 * yang lain mendapat 404 (lihat src/lib/dapur/access.ts).
 */
export default async function DapurLayout({ children }: LayoutProps<"/dapur">) {
  if (!(await canOpenDapur())) notFound();

  const storage = storageKind();
  const remembered = await isRememberedDevice();

  return (
    <div className="flex min-h-dvh flex-col bg-milk">
      <header className="sticky top-0 z-30 border-b border-sand/70 bg-milk/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link href="/dapur" aria-label="Dapur Loka Pudding, ke ringkasan" className="group/logo flex items-center gap-2.5 rounded-full">
            <Logo id="mark-dapur" />
            <span className="-rotate-3 font-hand text-2xl leading-none text-caramel-600">dapur</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <DapurNav variant="tabs" />
            <Link
              href="/"
              className="flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-bold text-ink-muted transition-colors hover:bg-caramel-50 hover:text-espresso"
            >
              <span className="hidden sm:inline">Lihat website</span>
              <span className="sm:hidden">Website</span>
              <ArrowUpRightIcon className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      <main id="konten" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {storage === "missing" ? (
          <EmptyState title="Dapur belum tersambung ke database">
            Website ini sudah online, tapi tempat menyimpan catatannya belum disambungkan. Di Vercel: buka tab Storage,
            buat database Supabase, sambungkan ke proyek ini, lalu deploy ulang. Langkah lengkapnya ada di README
            bagian Dapur.
          </EmptyState>
        ) : (
          children
        )}
      </main>

      <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 pt-2 pb-24 text-sm text-ink-muted sm:px-6 md:pb-8">
        {storage === "missing" ? null : (
          <>
            <p className="basis-full sm:basis-auto">
              {storage === "file"
                ? "Mode coba di komputer ini: catatan disimpan di folder catatan-toko, terpisah dari Dapur yang online."
                : "Catatan tersimpan online, sama di semua perangkat yang terdaftar."}
            </p>
            <a href="/dapur/cadangan" className={footerLink}>
              Unduh cadangan
            </a>
          </>
        )}
        {remembered ? <LockDeviceButton className={footerLink} /> : null}
      </footer>

      <DapurNav variant="bar" />
    </div>
  );
}

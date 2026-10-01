"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BagIcon, HomeIcon, LedgerIcon, MilkIcon } from "@/components/ui/Icons";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/dapur", label: "Ringkasan", icon: HomeIcon },
  { href: "/dapur/pre-order", label: "Pre-order", icon: BagIcon },
  { href: "/dapur/pembukuan", label: "Pembukuan", icon: LedgerIcon },
  { href: "/dapur/bahan", label: "Bahan", icon: MilkIcon },
] as const;

/**
 * Navigasi Dapur dalam dua bentuk:
 * - "tabs": deretan tab di header (layar lebar)
 * - "bar": bilah menempel di bawah layar (HP). Harus dirender di luar header:
 *   header memakai backdrop-blur, yang membuat elemen `fixed` di dalamnya ikut terkurung header.
 */
export function DapurNav({ variant }: { variant: "tabs" | "bar" }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/dapur" ? pathname === href : pathname.startsWith(href));

  if (variant === "tabs") {
    return (
      <nav aria-label="Menu Dapur" className="hidden md:block">
        <ul className="flex items-center gap-1">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-2 rounded-full px-4 text-sm font-bold transition-colors",
                  isActive(link.href) ? "bg-espresso text-milk-50" : "text-ink-muted hover:bg-caramel-50 hover:text-espresso",
                )}
              >
                <link.icon className="size-[1.1rem]" />
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Menu Dapur"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-sand/80 bg-milk-50/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={cn(
                "flex h-16 flex-col items-center justify-center gap-1 text-xs font-bold transition-colors",
                isActive(link.href) ? "text-caramel-700" : "text-ink-muted",
              )}
            >
              <link.icon className="size-5" />
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

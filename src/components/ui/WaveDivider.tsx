import { cn } from "@/lib/cn";

/**
 * Gelombang lembut di akhir section. Warnanya ikut `currentColor`,
 * jadi isi dengan warna latar section berikutnya (mis. `text-primary-mist`).
 */
export function WaveDivider({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 1440 64"
      preserveAspectRatio="none"
      fill="currentColor"
      className={cn("pointer-events-none -mb-px block h-8 w-full sm:h-12 lg:h-16", className)}
    >
      <path d="M0 40c160-26 320-34 480-18s320 40 480 36 320-34 480-40V64H0z" />
    </svg>
  );
}

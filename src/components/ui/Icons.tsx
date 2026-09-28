import type { ReactNode, SVGProps } from "react";

/**
 * Ikon garis sederhana (24×24, ujung membulat) agar senada dengan gaya brand yang lembut.
 * Dekoratif secara default (`aria-hidden`); isi `title` jika ikon berdiri sendiri tanpa teks.
 */
type IconProps = SVGProps<SVGSVGElement> & { title?: string };

function Icon({ title, children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function WhatsAppIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
      <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
    </Icon>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="3.8" />
      <path d="M16.9 7.1h.01" strokeWidth={2.6} />
    </Icon>
  );
}

export function TikTokIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M21 7.9v4a10 10 0 0 1-5-1.9v4.5a6.5 6.5 0 1 1-8-6.3v4.3a2.5 2.5 0 1 0 4 2V3h4.1A6 6 0 0 0 21 7.9z" />
    </Icon>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 21s-6.5-5.6-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.4-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.4" />
    </Icon>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Icon>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </Icon>
  );
}

export function ArrowUpRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </Icon>
  );
}

export function BagIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5.5 8h13l-1 11.2a1.5 1.5 0 0 1-1.5 1.3H8a1.5 1.5 0 0 1-1.5-1.3z" />
      <path d="M9 10V7a3 3 0 0 1 6 0v3" />
    </Icon>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 4l1.6 6.4L20 12l-6.4 1.6L12 20l-1.6-6.4L4 12l6.4-1.6z" />
    </Icon>
  );
}

export function TapIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 11.5V6a1.5 1.5 0 0 1 3 0v5" />
      <path d="M12 10.5V9a1.5 1.5 0 0 1 3 0v2" />
      <path d="M15 11a1.5 1.5 0 0 1 3 0v3a6 6 0 0 1-6 6h-.6a5.5 5.5 0 0 1-4.4-2.2l-2.6-3.5a1.5 1.5 0 0 1 2.4-1.8L9 14.5" />
      <path d="M6.5 5.5 5 4M10.5 2.8V1.4M14.5 5.5 16 4" />
    </Icon>
  );
}

/* Ikon nilai brand (bagian Tentang) */

export function MilkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9.5 3h5" />
      <path d="M10 3v2.6L8 9v10.2A1.8 1.8 0 0 0 9.8 21h4.4a1.8 1.8 0 0 0 1.8-1.8V9l-2-3.4V3" />
      <path d="M8 13.2c1.3-.8 2.7-.8 4 0s2.7.8 4 0" />
    </Icon>
  );
}

export function HomeHeartIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6 9v10.2a.8.8 0 0 0 .8.8h10.4a.8.8 0 0 0 .8-.8V9" />
      <path d="M12 16.8s-2.6-1.5-2.6-3.3a1.35 1.35 0 0 1 2.6-.6 1.35 1.35 0 0 1 2.6.6c0 1.8-2.6 3.3-2.6 3.3z" />
    </Icon>
  );
}

const PETAL = "M12 10.2c-1.7-1.5-2.1-4.1 0-6.4 2.1 2.3 1.7 4.9 0 6.4z";

export function FlowerIcon(props: IconProps) {
  return (
    <Icon {...props}>
      {[0, 72, 144, 216, 288].map((angle) => (
        <path key={angle} d={PETAL} transform={`rotate(${angle} 12 12)`} />
      ))}
      <circle cx="12" cy="12" r="1.4" />
    </Icon>
  );
}

export function StoreIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 9.5 6 4h12l1.5 5.5" />
      <path d="M4.5 9.5a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0" />
      <path d="M6 11.8V20h12v-8.2" />
      <path d="M10 20v-4.5h4V20" />
    </Icon>
  );
}

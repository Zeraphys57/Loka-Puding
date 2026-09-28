import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "accent" | "soft" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

// Naik sedikit saat hover, mengecil saat ditekan, lalu memantul balik (ease-jelly).
const base =
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold " +
  "transition-[translate,scale,background-color,border-color,color,box-shadow] duration-500 ease-jelly " +
  "hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.96] active:duration-150 " +
  "disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-[1.2em] [&_svg]:shrink-0";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-white shadow-soft hover:bg-primary-strong",
  accent: "bg-accent text-ink shadow-soft hover:bg-accent-strong",
  soft: "bg-primary-soft text-primary hover:bg-[#cfe1ff]",
  outline:
    "border-2 border-primary/20 bg-white/80 text-primary hover:border-primary/45 hover:bg-white",
  ghost: "text-ink hover:bg-primary-mist",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-6 text-[0.95rem]",
  lg: "h-14 px-7 text-base sm:text-lg",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

type ButtonLinkProps = CommonProps &
  Omit<ComponentPropsWithoutRef<"a">, keyof CommonProps | "href"> & {
    href: string;
    /** Buka di tab baru (link keluar, mis. WhatsApp/Maps) */
    external?: boolean;
  };

export function ButtonLink({ variant, size, className, external, children, ...props }: ButtonLinkProps) {
  return (
    <a
      className={buttonClasses(variant, size, className)}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : null)}
      {...props}
    >
      {children}
    </a>
  );
}

type ButtonProps = CommonProps & Omit<ComponentPropsWithoutRef<"button">, keyof CommonProps>;

export function Button({ variant, size, className, children, type = "button", ...props }: ButtonProps) {
  return (
    <button type={type} className={buttonClasses(variant, size, className)} {...props}>
      {children}
    </button>
  );
}

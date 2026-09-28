import { cn } from "@/lib/cn";

type BadgeTone = "accent" | "primary" | "muted";

const tones: Record<BadgeTone, string> = {
  accent: "bg-caramel-300 text-espresso",
  primary: "bg-caramel-600 text-white",
  muted: "bg-espresso/80 text-white",
};

export function Badge({
  children,
  tone = "primary",
  className,
}: {
  children: string;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-[0.12em] uppercase shadow-sticker",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

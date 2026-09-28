import { cn } from "@/lib/cn";

type BadgeTone = "accent" | "primary" | "muted";

const tones: Record<BadgeTone, string> = {
  accent: "bg-accent text-ink",
  primary: "bg-primary text-white",
  muted: "bg-ink/80 text-white",
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
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-wide shadow-sm",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

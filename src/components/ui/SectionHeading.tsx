import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type SectionHeadingProps = {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  /** id untuk h2, dipakai `aria-labelledby` pada section */
  id: string;
  align?: "center" | "left";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  id,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "mx-auto max-w-2xl items-center text-center" : "max-w-xl items-start",
        className,
      )}
    >
      <p
        data-reveal
        className="inline-flex items-center rounded-full bg-primary-soft px-4 py-1.5 text-sm font-semibold text-primary"
      >
        {eyebrow}
      </p>
      <h2
        id={id}
        data-reveal
        className="text-[2.25rem] leading-[1.05] font-semibold tracking-tight text-ink sm:text-5xl"
      >
        {title}
      </h2>
      {description ? (
        <p data-reveal className="text-base text-ink-muted sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}

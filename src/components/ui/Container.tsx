import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

/** Lebar konten maksimum + gutter samping yang konsisten di semua section. */
export function Container({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("mx-auto w-full max-w-[76rem] px-4 sm:px-6 lg:px-8", className)} {...props} />;
}

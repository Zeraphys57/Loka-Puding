"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/cn";
import { detect3DSupport } from "@/lib/device";
import { PuddingFallback } from "./PuddingFallback";
import type { PuddingVariant } from "./variants";

// three.js hanya diunduh jika perangkat lolos pemeriksaan (lihat lib/device.ts)
const PuddingCanvas = dynamic(() => import("./PuddingCanvas"), { ssr: false });

/** Squash & stretch kenyal untuk ilustrasi statis: [offset, skala x, skala y]. Bisa diulang tiap dicolek. */
const POKE: readonly (readonly [number, number, number])[] = [
  [0, 1, 1],
  [0.14, 1.09, 0.89],
  [0.3, 0.94, 1.07],
  [0.48, 1.04, 0.97],
  [0.66, 0.985, 1.015],
  [0.84, 1.005, 0.995],
  [1, 1, 1],
];
const POKE_TIMING = { duration: 950, easing: "cubic-bezier(0.3, 0.7, 0.4, 1)" };

/** Goyangan ke samping (derajat miring) saat puding didorong; dikali arah & kekuatan dorongan. */
const SWAY = [0, -7, 5, -2.5, 1, 0];
const SWAY_TIMING = { duration: 900, easing: "ease-out" };

/**
 * Goyangkan ilustrasi statis. Badan puding memendek/miring; topping (benda padat) tidak ikut gepeng,
 * hanya ikut bergeser bersama puncak puding.
 */
function jiggleFallback(stage: HTMLElement | null, nudgeX?: number) {
  const body = stage?.querySelector<SVGGElement>("[data-jiggle]");
  if (!body) return;
  const topping = stage?.querySelector<SVGGElement>("[data-topping]");
  // Poros goyangan di dasar puding, jadi puncaknya bergeser sejauh tinggi puding × perubahan skala/miring
  const height = body.getBBox().height;

  if (nudgeX === undefined) {
    body.animate(
      POKE.map(([offset, sx, sy]) => ({ offset, transform: `scale(${sx}, ${sy})` })),
      POKE_TIMING,
    );
    topping?.animate(
      POKE.map(([offset, , sy]) => ({ offset, transform: `translateY(${height * (1 - sy)}px)` })),
      POKE_TIMING,
    );
    return;
  }
  body.animate(
    SWAY.map((deg) => ({ transform: `skewX(${deg * nudgeX}deg)` })),
    SWAY_TIMING,
  );
  topping?.animate(
    SWAY.map((deg) => ({ transform: `translateX(${-height * Math.tan((deg * nudgeX * Math.PI) / 180)}px)` })),
    SWAY_TIMING,
  );
}

/** Dorongan ke samping, mis. saat puding meluncur masuk setelah berganti varian. `id` baru = dorongan baru. */
export type Nudge = { id: number; x: number };

type PuddingStageProps = {
  variant: PuddingVariant;
  /** Teks alternatif untuk puding yang sedang tampil */
  label: string;
  nudge?: Nudge;
};

export function PuddingStage({ variant, label, nudge }: PuddingStageProps) {
  const reducedMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const [capable, setCapable] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const [ready, setReady] = useState(false);
  const [inView, setInView] = useState(true);
  const [pokeSignal, setPokeSignal] = useState(0);

  const show3D = capable && !unsupported && !reducedMotion;
  const live3D = show3D && ready;

  // Putuskan setelah halaman tenang, supaya teks & interaksi utama didahulukan
  useEffect(() => {
    if (reducedMotion) return;
    let cancelled = false;
    const decide = () => {
      if (!cancelled && detect3DSupport().ok) setCapable(true);
    };
    // Safari belum punya requestIdleCallback → pakai jeda biasa
    const hasIdleCallback = "requestIdleCallback" in window;
    const handle = hasIdleCallback
      ? window.requestIdleCallback(decide, { timeout: 2500 })
      : window.setTimeout(decide, 1200);
    return () => {
      cancelled = true;
      if (hasIdleCallback) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
  }, [reducedMotion]);

  // Render 3D berhenti total saat hero tidak terlihat
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: "120px 0px",
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  // Ilustrasi statis ikut bergoyang saat didorong (versi 3D menanganinya sendiri lewat simulasi pegas)
  useEffect(() => {
    if (!nudge?.id || live3D || reducedMotion) return;
    jiggleFallback(stageRef.current, nudge.x);
  }, [nudge, live3D, reducedMotion]);

  const handleReady = useCallback(() => setReady(true), []);
  const handleUnsupported = useCallback(() => {
    setUnsupported(true);
    setReady(false);
  }, []);

  const pokeFallback = () => {
    if (!reducedMotion) jiggleFallback(stageRef.current);
  };

  // Untuk pengguna keyboard: tombol yang baru terlihat saat difokus (Tab), mencolek puncak puding
  const pokeFromKeyboard = () => {
    if (live3D) setPokeSignal((count) => count + 1);
    else pokeFallback();
  };

  return (
    <div ref={stageRef} className="relative aspect-square w-full">
      <div role="img" aria-label={label} className="absolute inset-0">
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-700 ease-out",
            live3D ? "pointer-events-none opacity-0" : "cursor-pointer",
          )}
          onPointerDown={live3D ? undefined : pokeFallback}
        >
          <PuddingFallback variant={variant} className="h-full w-full" />
        </div>

        {show3D ? (
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-700 ease-out",
              ready ? "opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            <PuddingCanvas
              active={inView}
              pokeSignal={pokeSignal}
              nudge={nudge}
              onReady={handleReady}
              onUnsupported={handleUnsupported}
              variant={variant}
            />
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={pokeFromKeyboard}
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:bottom-2 focus-visible:left-1/2 focus-visible:z-30 focus-visible:-translate-x-1/2 focus-visible:rounded-full focus-visible:bg-espresso focus-visible:px-5 focus-visible:py-2.5 focus-visible:text-sm focus-visible:font-bold focus-visible:whitespace-nowrap focus-visible:text-milk-50"
      >
        Colek pudingnya
      </button>
    </div>
  );
}

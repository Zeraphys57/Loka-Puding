"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/cn";
import { detect3DSupport } from "@/lib/device";

// three.js hanya diunduh jika perangkat lolos pemeriksaan (lihat lib/device.ts)
const PuddingCanvas = dynamic(() => import("./PuddingCanvas"), { ssr: false });

/** Squash & stretch kenyal untuk ilustrasi statis (Web Animations API, bisa diulang tiap dicolek). */
const POKE_KEYFRAMES: Keyframe[] = [
  { transform: "scale(1, 1)" },
  { transform: "scale(1.09, 0.89)", offset: 0.14 },
  { transform: "scale(0.94, 1.07)", offset: 0.3 },
  { transform: "scale(1.04, 0.97)", offset: 0.48 },
  { transform: "scale(0.985, 1.015)", offset: 0.66 },
  { transform: "scale(1.005, 0.995)", offset: 0.84 },
  { transform: "scale(1, 1)" },
];

type PuddingStageProps = {
  /** Ilustrasi SVG (dirender di server): tampil sejak awal & jadi cadangan permanen */
  fallback: ReactNode;
};

export function PuddingStage({ fallback }: PuddingStageProps) {
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

  const handleReady = useCallback(() => setReady(true), []);
  const handleUnsupported = useCallback(() => {
    setUnsupported(true);
    setReady(false);
  }, []);

  const pokeFallback = () => {
    if (reducedMotion) return;
    stageRef.current
      ?.querySelector<SVGGElement>("[data-jiggle]")
      ?.animate(POKE_KEYFRAMES, { duration: 950, easing: "cubic-bezier(0.3, 0.7, 0.4, 1)" });
  };

  // Untuk pengguna keyboard: tombol yang baru terlihat saat difokus (Tab), mencolek puncak puding
  const pokeFromKeyboard = () => {
    if (live3D) setPokeSignal((count) => count + 1);
    else pokeFallback();
  };

  return (
    <div ref={stageRef} className="relative aspect-square w-full">
      <div role="img" aria-label="Puding karamel dua lapis Loka Pudding di atas piring keramik" className="absolute inset-0">
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-700 ease-out",
            live3D ? "pointer-events-none opacity-0" : "cursor-pointer",
          )}
          onPointerDown={live3D ? undefined : pokeFallback}
        >
          {fallback}
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
              onReady={handleReady}
              onUnsupported={handleUnsupported}
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

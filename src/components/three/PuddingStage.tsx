"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { TapIcon } from "@/components/ui/Icons";
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
  const [poked, setPoked] = useState(false);
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
  const handleInteract = useCallback(() => setPoked(true), []);
  const handleUnsupported = useCallback(() => {
    setUnsupported(true);
    setReady(false);
  }, []);

  const pokeFallback = () => {
    setPoked(true);
    if (reducedMotion) return;
    stageRef.current
      ?.querySelector<SVGGElement>("[data-jiggle]")
      ?.animate(POKE_KEYFRAMES, { duration: 950, easing: "cubic-bezier(0.3, 0.7, 0.4, 1)" });
  };

  const handleHint = () => {
    if (live3D) {
      setPoked(true);
      setPokeSignal((count) => count + 1);
    } else {
      pokeFallback();
    }
  };

  return (
    <div
      ref={stageRef}
      className="relative mx-auto aspect-square w-[min(100%,23rem,46svh)] sm:w-[min(100%,28rem,52svh)] lg:w-full lg:max-w-[36rem]"
    >
      <div role="img" aria-label="Puding dua lapis biru-putih Loka Puding di atas piring" className="absolute inset-0">
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
              onInteract={handleInteract}
              onUnsupported={handleUnsupported}
            />
          </div>
        ) : null}
      </div>

    </div>
  );
}

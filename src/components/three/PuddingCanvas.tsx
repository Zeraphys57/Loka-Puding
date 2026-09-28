"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
// Import langsung per file: drei tidak menandai paketnya bebas side-effect,
// jadi import dari index bisa ikut membawa kode yang tidak dipakai.
import { ContactShadows } from "@react-three/drei/core/ContactShadows";
import { PerformanceMonitor } from "@react-three/drei/core/PerformanceMonitor";
import { useCallback, useEffect, useRef, useState } from "react";
import { NeutralToneMapping } from "three";
import { Pudding } from "./Pudding";
import { CAMERA } from "./puddingProfile";
import { StudioEnvironment } from "./StudioEnvironment";

// Neutral tone mapping menjaga warna karamel & susu (ACES cenderung menggeser hue)
const GL_OPTIONS = {
  antialias: true,
  alpha: true,
  powerPreference: "high-performance",
  toneMapping: NeutralToneMapping,
  toneMappingExposure: 1.05,
} as const;

// Kamera identik dengan ilustrasi SVG (lihat puddingProfile.ts), agar pergantiannya mulus
const CAMERA_PROPS = {
  fov: CAMERA.fov,
  near: 0.1,
  far: 40,
  position: [...CAMERA.position] as [number, number, number],
};
const MAX_DPR = 1.75;
// Ukur kanvas dari ukuran layout (offsetWidth/Height), bukan getBoundingClientRect: kalau pembungkusnya
// diberi transform (mis. `scale-110`), ukuran kanvas tidak ikut membesar dua kali lalu terpotong.
const RESIZE = { offsetSize: true } as const;

/** Kompilasi shader secara asinkron dulu (tanpa membekukan halaman), baru mulai render. */
function Warmup({ onCompiled, onFirstFrames }: { onCompiled: () => void; onFirstFrames: () => void }) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const frames = useRef(0);

  useEffect(() => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      onCompiled();
    };
    // Jaga-jaga: jika kompilasi asinkron tidak selesai, tetap lanjut
    const timeout = window.setTimeout(finish, 5000);
    gl.compileAsync(scene, camera).then(finish, finish);
    return () => window.clearTimeout(timeout);
  }, [gl, scene, camera, onCompiled]);

  // Setelah 2 frame benar-benar tergambar, ilustrasi SVG boleh memudar
  useFrame(() => {
    frames.current += 1;
    if (frames.current === 2) onFirstFrames();
  });

  return null;
}

export type PuddingCanvasProps = {
  /** false saat hero tidak terlihat → render dihentikan total */
  active: boolean;
  pokeSignal: number;
  onReady: () => void;
  /** Perangkat tidak sanggup menjaga ±30 fps bahkan di kualitas terendah */
  onUnsupported: () => void;
};

export default function PuddingCanvas({ active, pokeSignal, onReady, onUnsupported }: PuddingCanvasProps) {
  const [compiled, setCompiled] = useState(false);
  const [maxDpr] = useState(() => Math.min(window.devicePixelRatio || 1, MAX_DPR));
  const [dpr, setDpr] = useState(maxDpr);
  const [lowQuality, setLowQuality] = useState(false);
  const handleCompiled = useCallback(() => setCompiled(true), []);

  // Turunkan kualitas bertahap; jika tetap tersendat di kualitas terendah, kembali ke ilustrasi statis
  const handleDecline = ({ fps }: { fps: number }) => {
    if (lowQuality && fps < 24) {
      onUnsupported();
    } else if (fps < 30) {
      setDpr(1);
      setLowQuality(true);
    } else if (dpr > 1.01) {
      setDpr((value) => Math.max(1, Math.round((value - 0.25) * 100) / 100));
    } else {
      setLowQuality(true);
    }
  };

  return (
    <Canvas
      dpr={dpr}
      frameloop={compiled && active ? "always" : "never"}
      camera={CAMERA_PROPS}
      gl={GL_OPTIONS}
      resize={RESIZE}
      onCreated={({ camera, gl }) => {
        camera.lookAt(...CAMERA.target);
        // Cek error shader memaksa kompilasi sinkron → cukup aktif saat development
        gl.debug.checkShaderErrors = process.env.NODE_ENV !== "production";
      }}
      aria-hidden="true"
    >
      <StudioEnvironment />
      <hemisphereLight args={["#ffffff", "#e6cfb3", 0.35]} />
      <directionalLight position={[-3, 5, 4]} intensity={1.1} />

      <Pudding pokeSignal={pokeSignal} lowQuality={lowQuality} />

      {/* Bayangan lembut di bawah piring. Dirender sekali saja karena dasar puding tidak bergerak. */}
      <ContactShadows
        position={[0, -0.09, 0]}
        scale={3.7}
        far={0.9}
        blur={2}
        opacity={0.32}
        resolution={256}
        frames={1}
        color="#5a3a1e"
      />

      <Warmup onCompiled={handleCompiled} onFirstFrames={onReady} />

      {compiled ? (
        <PerformanceMonitor
          bounds={(refreshRate) => (refreshRate > 90 ? [50, 90] : [36, 60])}
          flipflops={4}
          onDecline={handleDecline}
          onIncline={() => setDpr((value) => Math.min(maxDpr, Math.round((value + 0.25) * 100) / 100))}
          onFallback={({ fps }) => {
            if (fps < 24) onUnsupported();
            setDpr(1);
            setLowQuality(true);
          }}
        />
      ) : null}
    </Canvas>
  );
}

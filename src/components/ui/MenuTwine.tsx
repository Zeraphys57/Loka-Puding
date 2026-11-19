"use client";

import { useEffect, useRef, useState } from "react";
import { TwineStroke } from "@/components/ui/TableProps";

type Geometry = { width: number; height: number; d: string; end: [number, number] };

/** Posisi elemen relatif ke `host` lewat offsetLeft/Top: mengabaikan transform (animasi data-reveal & kemiringan). */
function offsetIn(el: HTMLElement, host: HTMLElement) {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== host) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return node === host ? { x, y } : null;
}

/**
 * Lanjutan tali kue dari Kisah Kami di section Menu (layar lebar): masuk dari tepi atas section di x yang sama
 * dengan ujung tali Kisah Kami (94% lebar section − 72px, lihat `Twine`), turun di pinggir kanan, lalu melintang
 * ke kiri melewati setiap `[data-twine-anchor]` (tali pendek di atas label harga) dengan lengkung kendur di antaranya.
 * Digambar ulang saat ukuran berubah atau `watch` (filter) berganti, karena posisi label ikut berubah.
 */
export function MenuTwine({ watch }: { watch: unknown }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [geo, setGeo] = useState<Geometry | null>(null);

  useEffect(() => {
    const box = boxRef.current;
    const host = box?.offsetParent as HTMLElement | null;
    const section = box?.closest("section");
    if (!box || !host || !section) return;

    const draw = () => {
      if (!window.matchMedia("(min-width: 1024px)").matches) {
        setGeo(null);
        return;
      }
      const points = Array.from(section.querySelectorAll<HTMLElement>("[data-twine-anchor]"))
        .map((el) => {
          const at = offsetIn(el, host);
          return at ? { x: at.x + el.offsetWidth / 2, y: at.y } : null;
        })
        .filter((p): p is { x: number; y: number } => p !== null)
        .sort((a, b) => b.x - a.x);
      if (points.length === 0) {
        setGeo(null);
        return;
      }

      const sx = section.clientWidth * 0.94 - 72 - host.offsetLeft;
      const sy = -host.offsetTop;
      const [first] = points;
      const rx = Math.max(sx, first.x + 140);
      const ry = first.y - 6;
      let d = `M${sx} ${sy}C${sx} ${sy + (ry - sy) * 0.45} ${rx + 30} ${sy + (ry - sy) * 0.6} ${rx} ${ry}`;
      d += `Q${(rx + first.x) / 2} ${ry + 26} ${first.x} ${first.y}`;
      for (let i = 1; i < points.length; i++) {
        const [a, b] = [points[i - 1], points[i]];
        d += `Q${(a.x + b.x) / 2} ${Math.max(a.y, b.y) + 34} ${b.x} ${b.y}`;
      }
      const last = points[points.length - 1];
      const end: [number, number] = [last.x - 120, last.y + 34];
      d += `Q${last.x - 60} ${last.y + 30} ${end[0]} ${end[1]}`;
      setGeo({ width: host.clientWidth, height: host.clientHeight, d, end });
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(host);
    void document.fonts?.ready.then(draw);
    return () => observer.disconnect();
  }, [watch]);

  return (
    <div ref={boxRef} aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block">
      {geo ? (
        <svg
          width={geo.width}
          height={geo.height}
          focusable="false"
          className="absolute top-0 left-0 overflow-visible drop-shadow-[0_6px_8px_color-mix(in_srgb,var(--color-espresso)_22%,transparent)]"
        >
          <TwineStroke d={geo.d} />
          {/* Ujung tali yang terurai */}
          <g className="stroke-caramel-500" strokeWidth={1.4} strokeLinecap="round" fill="none">
            <path d={`M${geo.end[0]} ${geo.end[1]}l-10 4`} />
            <path d={`M${geo.end[0]} ${geo.end[1]}l-8 9`} />
            <path d={`M${geo.end[0]} ${geo.end[1]}l-11 -3`} />
          </g>
        </svg>
      ) : null}
    </div>
  );
}

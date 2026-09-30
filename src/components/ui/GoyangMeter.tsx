import type { Ref } from "react";
import { cn } from "@/lib/cn";

/*
 * Kartu kecil "goyang-meter" bergaya coretan tangan: jarum di antara "cair" dan "keras"
 * yang berhenti tepat di zona "pas!". Jarumnya digoyangkan dari luar (lihat TextureShowcase di About).
 * Murni hiasan, jadi disembunyikan dari pembaca layar.
 */

// Poros jarum & jari-jari busur, dalam koordinat viewBox
const PIVOT = { x: 60, y: 62 };
const RADIUS = 44;

/** Titik di busur pada sudut `deg` (0° = kanan, 90° = atas) sejauh `r` dari poros. */
function polar(deg: number, r: number): string {
  const rad = (deg * Math.PI) / 180;
  const x = PIVOT.x + r * Math.cos(rad);
  const y = PIVOT.y - r * Math.sin(rad);
  return `${Math.round(x * 10) / 10} ${Math.round(y * 10) / 10}`;
}

const TICKS = [150, 120, 90, 60, 30];

type GoyangMeterProps = {
  needleRef?: Ref<SVGGElement>;
  className?: string;
};

export function GoyangMeter({ needleRef, className }: GoyangMeterProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none w-36 rounded-2xl bg-[#fffdf8] px-3 pt-4 pb-3 text-pudding-caramel-700 shadow-[0_18px_36px_-18px_rgb(43_26_16/0.55)] ring-1 ring-black/5 select-none sm:w-44",
        className,
      )}
    >
      {/* Selotip */}
      <span className="absolute -top-2.5 left-1/2 h-5 w-16 -translate-x-1/2 -rotate-3 bg-caramel-200/75 shadow-sm" />

      <p className="text-center font-hand text-[1.35rem] leading-none sm:text-[1.55rem]">goyang-meter</p>

      <svg viewBox="0 0 120 80" fill="none" stroke="currentColor" strokeLinecap="round" className="mt-1 w-full" focusable="false">
        {/* Zona "pas" diwarnai seperti stabilo */}
        <path
          d={`M${polar(110, RADIUS)}A${RADIUS} ${RADIUS} 0 0 1 ${polar(70, RADIUS)}`}
          strokeWidth={8}
          className="text-pudding-caramel-300/60"
        />
        {/* Busur digambar tangan: dua lengkung yang tidak benar-benar bulat sempurna */}
        <path d="M15.5 62.5C15 37.5 35 18.6 60.3 17.6 85 17 104.6 38.5 103.6 62.5" strokeWidth={2} />
        {TICKS.map((deg) => (
          <path key={deg} d={`M${polar(deg, 37)}L${polar(deg, 42.5)}`} strokeWidth={1.6} />
        ))}

        <g className="fill-current font-hand" stroke="none" textAnchor="middle" fontSize={12.5}>
          <text x={14} y={77}>
            cair
          </text>
          <text x={106} y={77}>
            keras
          </text>
          <text x={60} y={10} fontSize={14} className="fill-pudding-caramel-800">
            pas!
          </text>
        </g>

        <g ref={needleRef} style={{ transformOrigin: `${PIVOT.x}px ${PIVOT.y}px`, transformBox: "view-box" }}>
          <path d={`M${PIVOT.x} ${PIVOT.y}L${PIVOT.x} 27M56.4 31.6 60 26.4 63.6 31.6`} strokeWidth={2.4} strokeLinejoin="round" className="text-pudding-ink" />
          <circle cx={PIVOT.x} cy={PIVOT.y} r={4} className="fill-pudding-ink" stroke="none" />
          <circle cx={PIVOT.x} cy={PIVOT.y} r={1.3} className="fill-[#fffdf8]" stroke="none" />
        </g>
      </svg>

      <p className="mt-1 text-center font-hand text-[1rem] leading-none text-pudding-ink-muted sm:text-[1.1rem]">
        goyangin fotonya!
      </p>
    </div>
  );
}

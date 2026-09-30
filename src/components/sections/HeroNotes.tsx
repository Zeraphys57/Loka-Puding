import type { CSSProperties, Ref } from "react";
import type { PuddingVariant } from "@/components/three/variants";
import { cn } from "@/lib/cn";

/*
 * Coretan tangan di sekitar puding hero, seperti catatan koki di foto resep:
 * tulisan + panah yang benar-benar menunjuk ke bagian puding (karamel, susu, topping).
 * Tiap berganti varian, catatan lama memudar lalu yang baru "ditulis" ulang: teks dulu, lalu panahnya.
 *
 * Koordinat dalam persen kotak puding (0,0 = kiri atas, 100,100 = kanan bawah). Kamera 3D & ilustrasi SVG
 * membingkai puding persis sama di semua ukuran layar, jadi satu set koordinat cukup.
 * Patokan: permukaan karamel ±y 33–45 (x 28–72), badan susu y 45–78 (x 22–78), piring y 55–88 (x 6–94).
 */

type Pt = readonly [number, number];

/** Coretan tambahan: lingkaran spidol di sekeliling sesuatu, atau goresan-goresan pendek ("krek", kilau). */
type Mark = ({ ring: { center: Pt; radius: Pt; tilt?: number } } | { strokes: Pt[][] }) & {
  /** Hanya di layar lebar (di HP tertutup judul) */
  wideOnly?: boolean;
};

export type Callout = {
  /** Teks catatan. `null` = pakai catatan dari data menu (`note` di src/data/menu.ts). */
  text: string | null;
  /** Titik tempat teks menempel */
  at: Pt;
  /** Teks tumbuh ke kanan dari titik (start) atau berakhir di titik (end) */
  align?: "start" | "end";
  /** Kemiringan teks (derajat) */
  tilt?: number;
  size?: "lg" | "md" | "sm";
  /** Panah: titik awal, lalu tiap 3 titik = satu lengkung (kendali 1, kendali 2, ujung). Ujung terakhir = sasaran. */
  arrow?: Pt[];
  marks?: Mark[];
  /** Hanya di layar lebar: di HP & tablet bagian ini tertutup judul */
  wideOnly?: boolean;
};

const KARAMEL: Callout = {
  text: "karamel lumer",
  at: [73, 15],
  tilt: 5,
  arrow: [
    [79, 20],
    [80, 27],
    [78, 33],
    [72.5, 38.5],
  ],
};

const SUSU: Callout = {
  text: "susu asli",
  at: [87, 47],
  tilt: -4,
  wideOnly: true,
  arrow: [
    [90, 50.5],
    [89, 55],
    [84, 57.5],
    [79, 56.5],
  ],
};

export const HERO_NOTES: Record<PuddingVariant, Callout[]> = {
  klasik: [
    {
      text: null, // "yang klasik!"
      at: [1, 17],
      tilt: -7,
      size: "lg",
      arrow: [
        [30.5, 16.5],
        [38, 14.5],
        [41.5, 23],
        [38.5, 32],
      ],
    },
    KARAMEL,
    SUSU,
  ],
  regal: [
    {
      text: null, // "ada kriuknya!"
      at: [0, 17],
      tilt: -7,
      size: "lg",
      arrow: [
        [31, 17],
        [34, 17.5],
        [36.5, 20.5],
        [38.5, 24.5],
      ],
      // Goresan "krek" memancar dari pinggir kanan atas biskuit
      marks: [
        {
          wideOnly: true,
          strokes: [
            [
              [61, 16],
              [63.5, 13.5],
            ],
            [
              [64.2, 22.5],
              [67, 21.7],
            ],
            [
              [54.5, 12.8],
              [55.3, 10],
            ],
          ],
        },
      ],
    },
    KARAMEL,
    SUSU,
  ],
  popcorn: [
    {
      text: null, // "banjir popcorn!"
      at: [-3, 17],
      tilt: -7,
      size: "lg",
      arrow: [
        [21, 20.5],
        [22, 26],
        [25, 29.5],
        [28.5, 31],
      ],
    },
    {
      text: "pop!",
      at: [57.5, 11],
      tilt: 12,
      size: "sm",
      wideOnly: true,
      marks: [
        {
          strokes: [
            [
              [54, 16.5],
              [56, 14.5],
            ],
            [
              [51.5, 14.5],
              [52.3, 12.2],
            ],
          ],
        },
      ],
    },
    KARAMEL,
    {
      text: "sampai tumpah!",
      at: [86, 49],
      tilt: -4,
      wideOnly: true,
      arrow: [
        [91, 53.5],
        [92, 58],
        [90, 63],
        [87, 66.5],
      ],
      marks: [{ ring: { center: [82.5, 72], radius: [8, 4.8], tilt: -6 } }],
    },
  ],
};

/** Ajakan mencolek puding: tetap di tempat, tidak ikut berganti varian. */
export const POKE_NOTE: Callout = {
  text: "colek aku!",
  at: [15, 90],
  align: "end",
  tilt: -6,
  arrow: [
    [16, 87.5],
    [18, 84],
    [21, 79],
    [24.5, 76],
  ],
};

/* ---------------------------------- Gambar ---------------------------------- */

const r2 = (value: number) => Math.round(value * 100) / 100;
const pt = ([x, y]: Pt) => `${r2(x)} ${r2(y)}`;

function arrowLine(points: Pt[]): string {
  const [start, ...rest] = points;
  let d = `M${pt(start)}`;
  for (let i = 0; i + 2 < rest.length; i += 3) d += `C${pt(rest[i])} ${pt(rest[i + 1])} ${pt(rest[i + 2])}`;
  return d;
}

/** Mata panah dua goresan, sedikit tidak simetris seperti ditarik tangan, searah ujung lengkung. */
function arrowHead(points: Pt[]): string {
  const tip = points[points.length - 1];
  const before = points[points.length - 2];
  const angle = Math.atan2(tip[1] - before[1], tip[0] - before[0]);
  const barb = (spread: number, length: number): Pt => [
    tip[0] - length * Math.cos(angle + spread),
    tip[1] - length * Math.sin(angle + spread),
  ];
  return `M${pt(barb(0.5, 3.4))}L${pt(tip)}L${pt(barb(-0.62, 2.9))}`;
}

/** Lingkaran spidol: 1⅛ putaran yang melebar sedikit, jadi ujungnya tidak bertemu rapi. */
function ringPath({ center, radius, tilt = 0 }: { center: Pt; radius: Pt; tilt?: number }): string {
  const steps = 14;
  const rot = (tilt * Math.PI) / 180;
  const points: Pt[] = Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const a = ((-150 + t * 405) * Math.PI) / 180;
    const grow = 0.94 + 0.14 * t;
    const x = radius[0] * grow * Math.cos(a);
    const y = radius[1] * grow * Math.sin(a);
    return [center[0] + x * Math.cos(rot) - y * Math.sin(rot), center[1] + x * Math.sin(rot) + y * Math.cos(rot)];
  });
  // Catmull-Rom → Bézier supaya lengkungnya halus
  let d = `M${pt(points[0])}`;
  for (let i = 0; i < steps; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, steps)];
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  }
  return d;
}

/* --------------------------------- Waktu --------------------------------- */

// Detik. Tiap catatan: teks ditulis dulu, lalu panah ditarik ke puding, lalu coretan tambahan.
const STAGGER = 0.3;
const writeTime = (text: string) => Math.min(0.85, 0.2 + text.length * 0.032);
const LINE_TIME = 0.5;
const HEAD_TIME = 0.18;
const MARK_TIME = 0.45;

const timing = (delay: number, duration: number): CSSProperties => ({
  animationDelay: `${r2(delay)}s`,
  animationDuration: `${r2(duration)}s`,
});

const DRAW = "animate-draw [stroke-dasharray:1] [stroke-dashoffset:1]";

// Ikut lebar kotak puding (cqw), dengan batas bawah supaya tetap terbaca di HP
const TEXT_SIZE = {
  lg: "text-[clamp(1.3rem,5.4cqw,2rem)]",
  md: "text-[clamp(1.1rem,4.5cqw,1.7rem)]",
  sm: "text-[clamp(1rem,3.8cqw,1.4rem)]",
} as const;

type HeroNotesProps = {
  callouts: Callout[];
  /** Catatan dari data menu, untuk callout dengan `text: null` */
  menuNote?: string;
  /** Jeda sebelum catatan pertama mulai ditulis (detik) */
  delay?: number;
  className?: string;
  ref?: Ref<HTMLDivElement>;
};

/** Lapisan coretan di atas puding. Murni dekoratif & tembus klik (puding tetap bisa dicolek/digeser). */
export function HeroNotes({ callouts, menuNote, delay = 0, className, ref }: HeroNotesProps) {
  const notes = callouts.flatMap((callout) => {
    const text = callout.text ?? menuNote;
    return text ? [{ ...callout, text }] : [];
  });

  const schedule = notes.map((note, index) => {
    const write = delay + index * STAGGER;
    const line = write + writeTime(note.text) * 0.75;
    const head = line + LINE_TIME * 0.85;
    return { write, line, head, marks: note.arrow ? head + HEAD_TIME : line };
  });

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 @container text-caramel-700 select-none", className)}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth={0.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute inset-0 size-full overflow-visible"
        focusable="false"
      >
        {notes.map((note, index) => {
          const time = schedule[index];
          return (
            <g key={index} className={cn(note.wideOnly && "max-lg:hidden")}>
              {note.arrow ? (
                <>
                  <path d={arrowLine(note.arrow)} pathLength={1} className={DRAW} style={timing(time.line, LINE_TIME)} />
                  <path d={arrowHead(note.arrow)} pathLength={1} className={DRAW} style={timing(time.head, HEAD_TIME)} />
                </>
              ) : null}
              {note.marks?.map((mark, markIndex) => (
                <g key={markIndex} className={cn(mark.wideOnly && "max-lg:hidden")}>
                  {"ring" in mark ? (
                    <path d={ringPath(mark.ring)} pathLength={1} className={DRAW} style={timing(time.marks, MARK_TIME)} />
                  ) : (
                    mark.strokes.map((stroke, strokeIndex) => (
                      <path
                        key={strokeIndex}
                        d={`M${stroke.map(pt).join("L")}`}
                        pathLength={1}
                        className={DRAW}
                        style={timing(time.marks + strokeIndex * 0.08, 0.16)}
                      />
                    ))
                  )}
                </g>
              ))}
            </g>
          );
        })}
      </svg>

      {notes.map((note, index) => {
        const end = note.align === "end";
        return (
          <span
            key={index}
            className={cn(
              "absolute animate-write font-hand leading-none whitespace-nowrap",
              TEXT_SIZE[note.size ?? "md"],
              note.wideOnly && "max-lg:hidden",
            )}
            style={{
              left: `${note.at[0]}%`,
              top: `${note.at[1]}%`,
              transform: `translate(${end ? "-100%" : "0"}, -50%) rotate(${note.tilt ?? 0}deg)`,
              transformOrigin: end ? "right center" : "left center",
              ...timing(schedule[index].write, writeTime(note.text)),
            }}
          >
            {note.text}
          </span>
        );
      })}
    </div>
  );
}

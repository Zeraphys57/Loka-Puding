import { cn } from "@/lib/cn";

// Siluet puding (dasar lebar, puncak membulat) & lapisan karamel yang menetes, dalam kotak 48×48
const BODY =
  "M12 37.4C12.9 30 14.4 22.6 16 17.2 16.4 14.8 19.4 13.4 24 13.4s7.6 1.4 8 3.8c1.6 5.4 3.1 12.8 4 20.2-3.2 1.8-7.4 2.6-12 2.6s-8.8-.8-12-2.6z";
const CARAMEL =
  "M4 4h40v21H31.4c0 1.3-.3 4.9-1.4 4.9s-1.4-3.6-1.4-4.9H21.1c0 1-.3 3.4-1.2 3.4s-1.2-2.4-1.2-3.4H4z";

type PuddingMarkProps = {
  className?: string;
  /** id unik per pemakaian (untuk clipPath SVG) */
  id?: string;
  /** Topping di puncak puding (tanpa topping = puding karamel klasik) */
  topping?: "regal" | "popcorn";
};

// Popcorn karamel bulat bertumpuk: [x, y, jari-jari], digambar dari yang paling belakang
const POPCORN: [number, number, number][] = [
  [21.6, 7.8, 3.1],
  [26.8, 7.4, 3.2],
  [19.2, 13.2, 3.4],
  [28.8, 13.2, 3.4],
  [24, 11.8, 3.9],
];

/** Biskuit berdiri menancap di karamel; bagian bawahnya tertutup badan puding (digambar lebih dulu). */
function BiscuitTopping() {
  return (
    <g transform="rotate(-8 24 13)">
      <circle cx="24" cy="10.2" r="6.6" fill="#e9b56d" className="stroke-pudding-caramel-800" strokeWidth="1.4" />
      <circle
        cx="24"
        cy="10.2"
        r="4.9"
        fill="none"
        className="stroke-pudding-caramel-700/60"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeDasharray="0.1 2"
      />
      <g className="fill-pudding-caramel-700/70">
        <circle cx="22" cy="8.8" r=".7" />
        <circle cx="26" cy="8.8" r=".7" />
        <circle cx="24" cy="11.6" r=".7" />
      </g>
    </g>
  );
}

function PopcornTopping() {
  return (
    <g className="stroke-pudding-caramel-800" strokeWidth="1.2">
      {POPCORN.map(([cx, cy, r]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill="#d99a4e" />
      ))}
      {/* Sebutir jatuh ke piring */}
      <circle cx="37.5" cy="39.2" r="2.3" fill="#d99a4e" />
      <g fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round" opacity=".7">
        <path d="M22.3 10.4c.6-.7 1.4-1 2.3-1" />
        <path d="M25.6 5.6c.5-.4 1-.6 1.6-.6" />
      </g>
    </g>
  );
}

/**
 * Ikon puding dua lapis: susu di bawah, karamel meleleh di atas. Dipakai di navbar & footer.
 * Memakai warna produk (pudding-*), jadi tetap karamel apa pun palet website-nya.
 */
export function PuddingMark({ className, id = "mark", topping }: PuddingMarkProps) {
  const clip = `${id}-clip`;
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={clip}>
          <path d={BODY} />
        </clipPath>
      </defs>
      <ellipse cx="24" cy="40.6" rx="20.5" ry="4.4" className="fill-saucer-deep" />
      <ellipse cx="24" cy="39.9" rx="15.5" ry="2.3" className="fill-saucer" />
      {topping === "regal" ? <BiscuitTopping /> : null}
      <path d={BODY} className="fill-pudding-milk" />
      <g clipPath={`url(#${clip})`}>
        <path d={CARAMEL} className="fill-pudding-caramel-600" />
        <path d="M4 22.6h40" className="stroke-pudding-caramel-900/40" strokeWidth="2.4" />
      </g>
      <path d={BODY} fill="none" className="stroke-pudding-caramel-800" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M18.6 16.6c.9-1.1 2.3-1.7 4.2-1.9" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity=".75" />
      <path d="M15.4 29.5c-.4 2.2-.6 4.3-.7 6.2" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity=".9" />
      {topping === "popcorn" ? <PopcornTopping /> : null}
    </svg>
  );
}

type LogoTone = "default" | "light" | "cream";

// [kata "Loka", kata "Pudding"] per latar
const LOGO_TEXT: Record<LogoTone, [string, string]> = {
  /** Latar terang */
  default: ["text-espresso", "text-caramel-600"],
  /** Latar gelap (navy/espresso) */
  light: ["text-milk-50", "text-caramel-300"],
  /** Di atas lapisan karamel (warna produk) */
  cream: ["text-pudding-cream", "text-pudding-caramel-200"],
};

/**
 * Logo teks "Loka Pudding". Letakkan di dalam elemen ber-class `group/logo`
 * agar ikonnya bergoyang saat hover. `tone="light"` untuk latar gelap, `"cream"` di atas karamel.
 */
export function Logo({ className, tone = "default", id }: { className?: string; tone?: LogoTone; id?: string }) {
  const [loka, pudding] = LOGO_TEXT[tone];
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <PuddingMark id={id} className="size-9 shrink-0 origin-bottom group-hover/logo:animate-jiggle-tap" />
      <span
        className={cn(
          "font-display text-[1.4rem] leading-none font-bold tracking-tight whitespace-nowrap transition-colors duration-500",
          loka,
        )}
      >
        Loka{" "}
        <span className={cn("font-wonky font-semibold italic transition-colors duration-500", pudding)}>Pudding</span>
      </span>
    </span>
  );
}

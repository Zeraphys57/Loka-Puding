import { PuddingFallback } from "@/components/three/PuddingFallback";
import { PuddingStage } from "@/components/three/PuddingStage";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ArrowRightIcon, SparkleIcon, WhatsAppIcon } from "@/components/ui/Icons";
import { WaveDivider } from "@/components/ui/WaveDivider";
import { whatsappOrderLink } from "@/lib/whatsapp";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const Noise = () => (
  <svg
    className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04] mix-blend-overlay z-0"
    xmlns="http://www.w3.org/2000/svg"
  >
    <filter id="noiseFilter">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
    </filter>
    <rect width="100%" height="100%" filter="url(#noiseFilter)" />
  </svg>
);

export function Hero() {
  return (
    <section
      id="beranda"
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden bg-cream pt-(--nav-h)"
    >
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); }
          50% { transform: translateY(-25px) rotate(10deg) scale(1.05); }
        }
        .animate-float {
          animation: float-slow 7s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-slow 8s ease-in-out infinite;
          animation-delay: -3.5s;
        }
        @keyframes scroll-line {
          0% { transform: scaleY(0); transform-origin: top; opacity: 0; }
          50% { transform: scaleY(1); transform-origin: top; opacity: 1; }
          50.1% { transform: scaleY(1); transform-origin: bottom; opacity: 1; }
          100% { transform: scaleY(0); transform-origin: bottom; opacity: 0; }
        }
        .animate-scroll-line {
          animation: scroll-line 2.5s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }
      `}</style>

      <HeroBackdrop />
      <Noise />

      {/* Decorative Floating Organic Shapes (Caramel Vibe) */}
      <div className="absolute top-[25%] left-[10%] w-8 h-8 rounded-[40%_60%_70%_30%] bg-gradient-to-br from-[#ffc94d] to-[#d97700] opacity-30 blur-[2px] animate-float z-0" />
      <div className="absolute top-[65%] right-[15%] w-12 h-12 rounded-[60%_40%_30%_70%] bg-gradient-to-br from-[#ffebd6] to-[#c27a29] opacity-40 blur-[3px] animate-float-delayed z-0" />
      <div className="absolute bottom-[25%] left-[20%] w-5 h-5 rounded-full bg-[#d97700] opacity-20 blur-[1px] animate-float z-0" />

      {/* Teks raksasa transparan di background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none opacity-[0.035] mix-blend-multiply">
        <span className="text-[30vw] font-black tracking-tighter text-[#c27a29] leading-none whitespace-nowrap">
          KARAMEL
        </span>
      </div>

      <Container className="relative flex flex-col items-center justify-center min-h-[calc(100svh-var(--nav-h))] py-12 lg:py-4">
        
        {/* Spinning Badge (Desktop Only) */}
        <div className="hidden lg:block absolute top-[12%] right-[5%] w-32 h-32 animate-[spin_12s_linear_infinite] opacity-50 z-20 pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-full h-full text-[#c27a29]">
            <path id="circlePath" d="M 50, 50 m -35, 0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0" fill="none" />
            <text className="text-[11.5px] font-bold uppercase tracking-[0.25em]" fill="currentColor">
              <textPath href="#circlePath" startOffset="0%">
                • 100% HOMEMADE • FRESHLY CRAFTED 
              </textPath>
            </text>
          </svg>
        </div>

        {/* Layout Typografi Editorial + 3D Pudding di tengah */}
        <div className="relative w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 items-center z-10 mt-6 lg:mt-0">
          
          {/* Teks Kiri */}
          <div className="text-center lg:text-left z-20 pointer-events-none mix-blend-multiply translate-y-12 lg:translate-y-0 lg:translate-x-12 relative">
            <div className="hidden lg:flex items-center gap-3 absolute -top-12 left-1 animate-rise opacity-60">
               <div className="h-[1px] w-12 bg-ink"></div>
               <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-ink">Signature Dish</span>
            </div>
            <h1 id="hero-title" className="text-[clamp(4rem,10vw,6.5rem)] leading-[0.8] font-black tracking-tighter text-ink animate-rise">
              <span className="block mb-2">LEMBUT</span>
              <span className={`block text-[#c27a29] ${playfair.className} italic font-normal text-[clamp(4.5rem,12vw,7.5rem)]`}>Lumer</span>
            </h1>
          </div>

          {/* Stage 3D Pudding */}
          <div className="relative w-[140%] -ml-[20%] lg:w-[130%] lg:-ml-[15%] aspect-square lg:scale-110 z-10 [pointer-events:auto]">
            <PuddingStage fallback={<PuddingFallback className="h-full w-full" />} />
          </div>

          {/* Teks Kanan */}
          <div className="text-center lg:text-right z-20 pointer-events-none mix-blend-multiply -translate-y-10 lg:translate-y-0 lg:-translate-x-12 relative">
            <h1 className="text-[clamp(4rem,10vw,6.5rem)] leading-[0.8] font-black tracking-tighter text-ink animate-rise [animation-delay:200ms]">
              <span className="block mb-2">BIKIN</span>
              <span className={`block text-[#d97700] ${playfair.className} italic font-normal text-[clamp(4.5rem,12vw,7.5rem)] relative`}>
                Nagih
                {/* SVG coretan estetis */}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 120 14"
                  preserveAspectRatio="none"
                  className="absolute -bottom-[0.1em] left-0 h-[0.26em] w-full overflow-visible opacity-80"
                >
                  <path
                    d="M3 9c12-7 22-7 30 0s18 7 28 0 18-7 28 0 18 7 28 0"
                    pathLength={1}
                    fill="none"
                    stroke="#ffc94d"
                    strokeWidth="6"
                    strokeLinecap="round"
                    className="animate-draw [animation-delay:0.8s] [stroke-dasharray:1] [stroke-dashoffset:1]"
                  />
                </svg>
              </span>
            </h1>
            <div className="hidden lg:flex items-center gap-3 absolute -bottom-12 right-2 animate-rise opacity-60 [animation-delay:400ms] justify-end">
               <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-ink">Taste the Magic</span>
               <div className="h-[1px] w-12 bg-ink"></div>
            </div>
          </div>
        </div>

        {/* Deskripsi & Call to Action (CTA) */}
        <div className="w-full max-w-5xl flex flex-col md:flex-row items-center justify-between gap-8 mt-10 lg:mt-16 z-20">
          <div className="flex flex-col items-center md:items-start gap-4">
            <p className="inline-flex animate-rise items-center gap-2 text-[11px] font-bold text-[#c27a29] uppercase tracking-[0.25em] [animation-delay:400ms]">
              <SparkleIcon className="size-4 text-[#d97700]" />
              Premium & Fresh
            </p>
            <p className="max-w-[400px] animate-rise text-center md:text-left text-lg leading-relaxed text-ink-muted [animation-delay:500ms]">
              Dibuat segar setiap pagi pakai susu asli dan saus karamel pilihan. Sensasi tekstur yang bikin kamu gak bisa berhenti di suapan pertama!
            </p>
          </div>
          
          <div className="flex w-full md:w-auto animate-rise flex-col sm:flex-row gap-4 [animation-delay:600ms]">
            <ButtonLink href="#menu" size="lg" className="w-full sm:w-auto rounded-full bg-[#0b1b3f] text-white hover:bg-opacity-90 border-none shadow-xl shadow-[#0b1b3f]/20 transition-transform hover:scale-105 active:scale-95">
              Lihat Menu
              <ArrowRightIcon />
            </ButtonLink>
            <ButtonLink
              href={whatsappOrderLink()}
              external
              variant="outline"
              size="lg"
              className="w-full sm:w-auto rounded-full border-ink/20 text-ink hover:bg-ink/5 transition-transform hover:scale-105 active:scale-95 bg-white/50 backdrop-blur-sm"
            >
              <WhatsAppIcon />
              Pesan via WhatsApp
            </ButtonLink>
          </div>
        </div>

      </Container>

      {/* Scroll Indicator */}
      <div className="hidden lg:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-3 animate-rise [animation-delay:800ms] opacity-50 z-20">
        <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-ink [writing-mode:vertical-lr] rotate-180">Scroll</span>
        <div className="w-[1px] h-12 bg-ink/20 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-full bg-ink animate-scroll-line" />
        </div>
      </div>

      <WaveDivider className="text-[#fff3e0] relative z-10" />
    </section>
  );
}

/** Latar lembut: gradasi radial disesuaikan ke warna karamel yang hangat. */
function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute -top-56 -right-48 size-[44rem] rounded-full bg-[radial-gradient(closest-side,#ffebd6,transparent)]" />
      <div className="absolute top-[38%] -left-72 size-[38rem] rounded-full bg-[radial-gradient(closest-side,#fff3e0,transparent)]" />
      <div className="absolute top-[16%] left-[4%] hidden size-3 rounded-full bg-[#c27a29]/80 lg:block" />
      <div className="absolute top-[62%] right-[5%] hidden size-4 rounded-full bg-[#d97700]/20 sm:block" />
      <div className="absolute bottom-[14%] left-[46%] hidden size-2.5 rounded-full bg-[#c27a29]/30 lg:block" />
    </div>
  );
}

import { Container } from "@/components/ui/Container";
import { InstagramIcon, TikTokIcon } from "@/components/ui/Icons";
import { siteConfig } from "@/config/site";
import { whatsappOrderLink } from "@/lib/whatsapp";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

export function Footer() {
  const { social } = siteConfig;

  return (
    // The wrapper has clip-path which makes the fixed child only visible when the wrapper is in view.
    // This creates an incredibly premium "Uncover / Lift the Blanket" footer reveal effect.
    <footer className="relative h-[70vh] sm:h-[80vh]" style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}>
      
      <div className="fixed bottom-0 left-0 w-full h-[70vh] sm:h-[80vh] flex flex-col justify-end pb-8 sm:pb-12 bg-[#0c0e12] overflow-hidden -z-10">
        
        {/* Massive Cinematic Text in Background */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center px-4 pointer-events-none">
           <h2 className={`text-[15vw] font-black text-white/[0.03] leading-none tracking-tighter ${playfair.className}`}>
             SAMPAI <br/> JUMPA
           </h2>
        </div>

        {/* Ambient Glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-[#c27a29] rounded-full mix-blend-screen filter blur-[200px] opacity-10 pointer-events-none" />

        <Container className="relative z-10 flex flex-col gap-10 sm:gap-16">
           
           <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 border-b border-white/10 pb-10 sm:pb-16">
              <div className="flex flex-col gap-6 sm:gap-8 max-w-2xl">
                 <h3 className="text-4xl sm:text-5xl lg:text-[4.5rem] font-black text-white leading-[1.1] tracking-tight">
                   Siap menikmati <br/> puding <span className="text-[#c27a29] italic">lumer</span> di mulut?
                 </h3>
                 <a href={whatsappOrderLink()} target="_blank" rel="noreferrer" className="w-fit bg-[#c27a29] text-white px-8 py-4 sm:px-10 sm:py-5 rounded-full font-bold uppercase tracking-[0.2em] text-xs transition-all hover:bg-white hover:text-ink hover:scale-105 active:scale-95 shadow-xl shadow-[#c27a29]/20">
                   Pesan Sekarang
                 </a>
              </div>

              <div className="flex gap-4">
                 <a href={social.instagram.url} target="_blank" rel="noreferrer" aria-label="Instagram" className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-[#E1306C] transition-colors shadow-lg">
                    <InstagramIcon className="w-6 h-6" />
                 </a>
                 <a href={social.tiktok.url} target="_blank" rel="noreferrer" aria-label="TikTok" className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-[#00f2fe] hover:text-black transition-colors shadow-lg">
                    <TikTokIcon className="w-6 h-6" />
                 </a>
              </div>
           </div>

           <div className="flex flex-col sm:flex-row justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 gap-2">
              <p>© {new Date().getFullYear()} {siteConfig.name}</p>
              <p>Made with 🔥 in Indonesia</p>
           </div>
        </Container>

      </div>
    </footer>
  );
}

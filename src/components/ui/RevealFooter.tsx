"use client";

import { useEffect, useRef, type ComponentPropsWithoutRef } from "react";

/**
 * <footer> yang "tersingkap": menempel (sticky) di belakang konten dan terlihat saat
 * section terakhir bergulir ke atas.
 *
 * Footer yang lebih tinggi dari layar (laptop 14", HP) tidak boleh ditempel di dasar layar:
 * bagian atasnya akan berada di luar layar dan tertutup section Lokasi selamanya.
 * Karena itu jarak `bottom` dibuat negatif sebesar kelebihannya: tepi atas footer
 * tertahan di atas layar, lalu footer ikut bergulir sampai bagian bawahnya terlihat.
 */
export function RevealFooter({ style, ...props }: ComponentPropsWithoutRef<"footer">) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const footer = ref.current;
    if (!footer) return;

    const update = () => {
      const overflow = Math.max(0, footer.offsetHeight - window.innerHeight);
      footer.style.setProperty("--footer-overflow", `${overflow}px`);
    };
    update();

    // Tinggi footer berubah saat font selesai dimuat / lebar layar berubah; tinggi layar berubah
    // saat bilah alamat HP muncul-hilang
    const observer = new ResizeObserver(update);
    observer.observe(footer);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return <footer ref={ref} style={{ bottom: "calc(var(--footer-overflow, 0px) * -1)", ...style }} {...props} />;
}

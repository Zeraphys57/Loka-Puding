/**
 * Semua angka yang menentukan "rasa" goyangan puding. Aman diubah.
 *
 * - stiffness (kekakuan pegas): makin besar → goyangan makin cepat & kaku.
 * - damping (redaman): makin besar → goyangan makin cepat berhenti.
 * - mass (massa): makin besar → makin berat & lambat.
 *
 * Tips: ubah sedikit demi sedikit (±10–20%), lalu colek pudingnya untuk merasakan bedanya.
 * Saat `npm run dev`, objek ini juga bisa diubah langsung lewat console: `window.__JIGGLE`.
 */
export const JIGGLE = {
  /**
   * Goyangan ke samping. Dimodelkan sebagai rantai 2 massa (tengah → puncak):
   * puncak sedikit "tertinggal" lalu mengayun melewati bagian tengah, seperti gelatin sungguhan.
   */
  sway: {
    stiffness: 240, // pegas dasar → tengah
    coupling: 420, // pegas tengah → puncak
    // Massa ringan: frekuensi ~2 Hz dengan ~2 ayunan yang terlihat (±1 detik).
    // Redaman dihitung per massa, jadi 4 di sini setara ±6–7 untuk massa 1.
    damping: 4,
    mass: 0.6,
  },

  /** Squash & stretch (memendek-meninggi) dengan volume kurang lebih tetap */
  squash: {
    stiffness: 220,
    damping: 9,
    mass: 1,
  },

  /** Lekukan kecil tepat di titik yang dicolek */
  dent: {
    stiffness: 260,
    damping: 12,
    mass: 1,
    radius: 0.32,
  },

  /** Kekuatan dorongan dari tiap interaksi (kecepatan awal yang diberikan ke pegas) */
  impulse: {
    tapSway: 3.4,
    tapSquash: 3,
    tapDent: 2.4,
    /** Seberapa jauh puncak condong ke arah kursor saat di-hover */
    hoverLean: 0.08,
    /** Dorongan kecil dari gerakan kursor di atas puding */
    hoverDrag: 0.6,
    /** Pengali perubahan kecepatan scroll (px/detik) */
    scroll: 0.00024,
  },

  /** "Napas" halus saat diam */
  idle: {
    amplitude: 0.011,
    speed: 1.2,
  },

  /** Batas aman agar puding tidak "meleleh" saat dicolek bertubi-tubi */
  limits: {
    sway: 0.3,
    squash: 0.24,
    dent: 0.16,
  },

  /** Langkah simulasi tetap (detik). Lebih kecil = lebih stabil, sedikit lebih berat. */
  step: 1 / 120,
};

export type JiggleConfig = typeof JIGGLE;

import type { JiggleConfig } from "./jiggle.config";

/**
 * Simulasi pegas-massa-redaman untuk goyangan puding (tanpa React, tanpa three.js).
 *
 * - Goyang samping: rantai 2 massa (tengah & puncak) di sumbu x dan z.
 * - Squash/stretch: 1 pegas (nilai negatif = memendek).
 * - Lekukan colekan: 1 pegas.
 *
 * Integrasi semi-implicit Euler dengan langkah tetap, jadi rasanya sama di layar 60/90/120 Hz
 * dan tetap stabil setelah tab tidak aktif lama (delta waktu dibatasi).
 */
export class JiggleSimulation {
  // Rantai samping: posisi & kecepatan (satuan dunia)
  midX = 0;
  midZ = 0;
  topX = 0;
  topZ = 0;
  private vMidX = 0;
  private vMidZ = 0;
  private vTopX = 0;
  private vTopZ = 0;

  squash = 0;
  private vSquash = 0;

  dent = 0;
  private vDent = 0;

  /** Posisi istirahat puncak (condong karena hover / napas) */
  private leanX = 0;
  private leanZ = 0;
  private squashRest = 0;

  private accumulator = 0;

  constructor(private readonly config: JiggleConfig) {}

  setRest(leanX: number, leanZ: number, squash: number): void {
    this.leanX = leanX;
    this.leanZ = leanZ;
    this.squashRest = squash;
  }

  /** Dorongan ke samping (kecepatan, arah x/z), sebagian diteruskan ke bagian tengah. */
  pushSway(vx: number, vz: number): void {
    this.vTopX += vx;
    this.vTopZ += vz;
    this.vMidX += vx * 0.45;
    this.vMidZ += vz * 0.45;
  }

  /** Dorongan vertikal: negatif = ditekan (memendek), positif = meregang. */
  pushSquash(v: number): void {
    this.vSquash += v;
  }

  pushDent(v: number): void {
    this.vDent += v;
  }

  /** Total "energi" gerak, berguna untuk tahu apakah puding sedang bergoyang. */
  get energy(): number {
    return (
      Math.abs(this.vTopX) + Math.abs(this.vTopZ) + Math.abs(this.vSquash) + Math.abs(this.vDent)
    );
  }

  update(delta: number): void {
    const step = this.config.step;
    // Batasi delta: setelah tab tidak aktif, jangan "mengejar" ratusan langkah
    this.accumulator += Math.min(Math.max(delta, 0), 0.05);
    while (this.accumulator >= step) {
      this.integrate(step);
      this.accumulator -= step;
    }
  }

  private integrate(h: number): void {
    const { sway, squash, dent, limits } = this.config;

    // --- Rantai samping (per sumbu), relatif terhadap posisi istirahat ---
    const restMidX = this.leanX * 0.4;
    const restMidZ = this.leanZ * 0.4;
    const mx = this.midX - restMidX;
    const mz = this.midZ - restMidZ;
    const tx = this.topX - this.leanX;
    const tz = this.topZ - this.leanZ;

    const aMidX = (-sway.stiffness * mx + sway.coupling * (tx - mx) - sway.damping * this.vMidX) / sway.mass;
    const aMidZ = (-sway.stiffness * mz + sway.coupling * (tz - mz) - sway.damping * this.vMidZ) / sway.mass;
    const aTopX = (-sway.coupling * (tx - mx) - sway.damping * this.vTopX) / sway.mass;
    const aTopZ = (-sway.coupling * (tz - mz) - sway.damping * this.vTopZ) / sway.mass;

    this.vMidX += aMidX * h;
    this.vMidZ += aMidZ * h;
    this.vTopX += aTopX * h;
    this.vTopZ += aTopZ * h;
    this.midX += this.vMidX * h;
    this.midZ += this.vMidZ * h;
    this.topX += this.vTopX * h;
    this.topZ += this.vTopZ * h;

    // --- Squash & stretch ---
    const aSquash =
      (-squash.stiffness * (this.squash - this.squashRest) - squash.damping * this.vSquash) / squash.mass;
    this.vSquash += aSquash * h;
    this.squash += this.vSquash * h;

    // --- Lekukan ---
    const aDent = (-dent.stiffness * this.dent - dent.damping * this.vDent) / dent.mass;
    this.vDent += aDent * h;
    this.dent += this.vDent * h;

    // --- Batas aman ---
    const swayLength = Math.hypot(this.topX, this.topZ);
    if (swayLength > limits.sway) {
      const k = limits.sway / swayLength;
      this.topX *= k;
      this.topZ *= k;
      this.vTopX *= 0.5;
      this.vTopZ *= 0.5;
    }
    if (Math.abs(this.squash) > limits.squash) {
      this.squash = Math.sign(this.squash) * limits.squash;
      this.vSquash *= 0.5;
    }
    if (Math.abs(this.dent) > limits.dent) {
      this.dent = Math.sign(this.dent) * limits.dent;
      this.vDent *= 0.5;
    }
  }
}

import { useSyncExternalStore } from "react";
import { HERO_VARIANTS, isPuddingVariant, type PuddingVariant } from "@/components/three/variants";

/**
 * Varian puding yang sedang dipilih di hero. Disimpan di luar React supaya beberapa komponen yang letaknya
 * berjauhan (puding, tombol varian, tombol Pesan) berbagi pilihan yang sama tanpa membungkus seluruh hero.
 * Varian awal bisa dipilih lewat URL, mis. `?varian=regal`.
 */

export type Direction = 1 | -1;

type SelectListener = (next: PuddingVariant, direction: Direction) => void;

const order = HERO_VARIANTS;
let selected: PuddingVariant | null = null;
const listeners = new Set<() => void>();
const selectListeners = new Set<SelectListener>();

function readUrl(): PuddingVariant | null {
  const value = new URLSearchParams(window.location.search).get("varian");
  return isPuddingVariant(value) && order.includes(value) ? value : null;
}

function getSnapshot(): PuddingVariant {
  selected ??= readUrl() ?? order[0] ?? "klasik";
  return selected;
}

const getServerSnapshot = (): PuddingVariant => order[0] ?? "klasik";

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Pilih varian. Arah (-1 = ke kiri/sebelumnya, 1 = ke kanan/berikutnya) menentukan arah animasi geser. */
export function selectVariant(next: PuddingVariant, direction?: Direction) {
  const current = getSnapshot();
  if (next === current || !order.includes(next)) return;
  selected = next;
  const dir = direction ?? (order.indexOf(next) > order.indexOf(current) ? 1 : -1);
  listeners.forEach((listener) => listener());
  selectListeners.forEach((listener) => listener(next, dir));
}

/** Varian sebelumnya/berikutnya, berputar dari ujung ke ujung. */
export function stepVariant(step: Direction) {
  if (order.length < 2) return;
  const index = order.indexOf(getSnapshot());
  selectVariant(order[(index + step + order.length) % order.length], step);
}

/** Dipanggil setiap kali varian berganti (untuk menjalankan animasi, bukan untuk merender). */
export function onVariantSelect(listener: SelectListener) {
  selectListeners.add(listener);
  return () => {
    selectListeners.delete(listener);
  };
}

export function useSelectedVariant(): PuddingVariant {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

import { siteConfig } from "@/config/site";

/**
 * Tanggal di Dapur disimpan sebagai teks "YYYY-MM-DD" (tanpa jam & zona waktu).
 * Format tampilan dihitung dalam UTC supaya hasil di server dan browser selalu sama.
 */

const DAY_MS = 86_400_000;

const storeDate = new Intl.DateTimeFormat("en-US", {
  timeZone: siteConfig.timeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Tanggal hari ini di zona waktu toko (bukan jam server, yang di hosting adalah UTC). */
export function todayISO(now: Date = new Date()): string {
  const parts = Object.fromEntries(storeDate.formatToParts(now).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function isISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = toDate(value);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function toDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function addDays(iso: string, days: number): string {
  return new Date(toDate(iso).getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

/** Selisih hari: positif kalau `iso` setelah `from`. */
export function daysBetween(from: string, iso: string): number {
  return Math.round((toDate(iso).getTime() - toDate(from).getTime()) / DAY_MS);
}

const longDate = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const shortDate = new Intl.DateTimeFormat("id-ID", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const shortDateYear = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const monthYear = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" });

/** "Kamis, 1 Oktober 2026" */
export function formatLongDate(iso: string): string {
  return longDate.format(toDate(iso));
}

/** "Kam, 1 Okt" */
export function formatShortDate(iso: string): string {
  return shortDate.format(toDate(iso));
}

/** "1 Okt 2026" */
export function formatDate(iso: string): string {
  return shortDateYear.format(toDate(iso));
}

const RELATIVE: Record<number, string> = { [-1]: "Kemarin", 0: "Hari ini", 1: "Besok", 2: "Lusa" };

/** "Hari ini", "Besok", … atau null kalau tanggalnya lebih jauh. */
export function relativeDay(iso: string, today: string): string | null {
  return RELATIVE[daysBetween(today, iso)] ?? null;
}

/** "Besok · Jum, 2 Okt" atau "Sen, 5 Okt" */
export function formatDueDate(iso: string, today: string): string {
  const relative = relativeDay(iso, today);
  return relative ? `${relative} · ${formatShortDate(iso)}` : formatShortDate(iso);
}

/* Bulan: "YYYY-MM" */

export function monthOf(iso: string): string {
  return iso.slice(0, 7);
}

export function isMonth(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function addMonths(month: string, delta: number): string {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, m - 1 + delta, 1));
  return date.toISOString().slice(0, 7);
}

/** "Oktober 2026" */
export function formatMonth(month: string): string {
  return monthYear.format(toDate(`${month}-01`));
}

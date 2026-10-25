import { TZ } from "./config";

export const fmt = (n: number): string => Number(n).toLocaleString("es-AR");

export const pad = (n: number): string => String(n).padStart(4, "0");

export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export const fmtDay = (iso: string): string =>
  new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: TZ,
  });

export const fmtDate = (iso: string): string => {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: TZ,
    }) +
    " " +
    d.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: TZ,
    })
  );
};

export function nowMinutesAR(): number {
  const parts = new Intl.DateTimeFormat("es-AR", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

export const toMin = (s?: string): number => {
  const [h, m] = String(s || "")
    .split(":")
    .map(Number);
  return (h || 0) * 60 + (m || 0);
};

/** Prints a sat amount as the decimal BTC string the original shows. */
export const btcFromSats = (sats: number): string =>
  (sats / 1e8)
    .toFixed(8)
    .replace(/0+$/, "")
    .replace(/\.$/, "");

export const reduceMotion = (): boolean =>
  !!(
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

export const ALBY_URL = "https://getalby.com/p/donacionesclubsatoshi";

export const DATA_URL =
  "https://raw.githubusercontent.com/club-satoshi/club-satoshi/donaciones/data/donaciones.json";
export const STALE_MS = 3 * 60 * 60 * 1000;

export type Donaciones = {
  received_sats: number;
  balance_sats: number;
  checked_at: string;
};

const satsFormatter = new Intl.NumberFormat("es-AR");

export function formatSats(n: number) {
  return satsFormatter.format(n);
}

export function parseDonaciones(raw: unknown): Donaciones | null {
  if (!raw || typeof raw !== "object") return null;
  const { received_sats, balance_sats, checked_at } = raw as Record<string, unknown>;
  if (
    !Number.isSafeInteger(received_sats) ||
    !Number.isSafeInteger(balance_sats) ||
    (received_sats as number) < 0 ||
    (balance_sats as number) < 0 ||
    typeof checked_at !== "string" ||
    Number.isNaN(Date.parse(checked_at))
  ) {
    return null;
  }
  return {
    received_sats: received_sats as number,
    balance_sats: balance_sats as number,
    checked_at,
  };
}

function plural(n: number, singular: string, pluralForm: string) {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}

export function haceCuanto(ms: number) {
  const minutos = Math.floor(ms / 60_000);
  if (minutos < 1) return "hace instantes";
  if (minutos < 60) return `hace ${plural(minutos, "minuto", "minutos")}`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${plural(horas, "hora", "horas")}`;
  return `hace ${plural(Math.floor(horas / 24), "día", "días")}`;
}

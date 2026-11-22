export const ALBY_URL = "https://getalby.com/p/donacionesclubsatoshi";

export const DATA_URL =
  "https://raw.githubusercontent.com/club-satoshi/club-satoshi/donaciones/data/donaciones.json";
export const STALE_MS = 3 * 60 * 60 * 1000;

export const HISTORIAL_LIMITE = 50;
export const MENSAJE_MAX = 280;

export type DonacionPublica = {
  id: string;
  sats: number;
  settled_at: string;
  mensaje?: string;
};

export type Donaciones = {
  received_sats: number;
  balance_sats: number;
  checked_at: string;
  donaciones: DonacionPublica[];
};

const satsFormatter = new Intl.NumberFormat("es-AR");

export function formatSats(n: number) {
  return satsFormatter.format(n);
}

const ID_PUBLICO = /^[0-9a-f]{12}$/;

function parseDonacion(raw: unknown): DonacionPublica | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  if (typeof item.id !== "string" || !ID_PUBLICO.test(item.id)) return null;
  if (typeof item.sats !== "number" || !Number.isSafeInteger(item.sats) || item.sats < 0) return null;
  if (typeof item.settled_at !== "string" || Number.isNaN(Date.parse(item.settled_at))) return null;

  const donacion: DonacionPublica = {
    id: item.id,
    sats: item.sats,
    settled_at: item.settled_at,
  };
  if ("mensaje" in item && item.mensaje != null) {
    if (typeof item.mensaje !== "string") return null;
    const mensaje = item.mensaje.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
    if (!mensaje || mensaje.length > MENSAJE_MAX) return null;
    donacion.mensaje = mensaje;
  }
  return donacion;
}

function parseLista(raw: unknown): DonacionPublica[] {
  if (!Array.isArray(raw)) return [];
  const vistos = new Set<string>();
  const lista: DonacionPublica[] = [];
  for (const item of raw) {
    const donacion = parseDonacion(item);
    if (!donacion || vistos.has(donacion.id)) continue;
    vistos.add(donacion.id);
    lista.push(donacion);
    if (lista.length >= HISTORIAL_LIMITE) break;
  }
  return lista;
}

export function parseDonaciones(raw: unknown): Donaciones | null {
  if (!raw || typeof raw !== "object") return null;
  const { received_sats, balance_sats, checked_at, donaciones } = raw as Record<string, unknown>;
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
    donaciones: parseLista(donaciones),
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

import { MODO_PRUEBA, VENDEDOR_PRUEBA } from "./config";
import type { P2PStore, Tx, Vendor, VendorStatus } from "./types";
import { fmt, nowMinutesAR, toMin } from "./utils";

export const withTest = (list: Vendor[]): Vendor[] =>
  MODO_PRUEBA
    ? [...list.filter((v) => v.id !== "prueba"), VENDEDOR_PRUEBA]
    : list;

export function inSchedule(v: Vendor): boolean {
  if (!v.desde || !v.hasta) return false;
  const n = nowMinutesAR();
  const a = toMin(v.desde);
  const b = toMin(v.hasta);
  if (a === b) return true; // same start and end = all day
  return a < b ? n >= a && n < b : n >= a || n < b; // crosses midnight
}

export const hasData = (v: {
  nombre?: unknown;
  apellido?: unknown;
  cbu?: unknown;
  alias?: unknown;
  usdt?: unknown;
}): boolean => !!(v.nombre && v.apellido && v.cbu && v.alias && v.usdt);

export const isOnline = (v: Vendor, authorized: Set<string>): boolean =>
  authorized.has(v.id) && !!v.activo && hasData(v) && inSchedule(v);

/** Sats already committed to orders the vendor has not finished yet. */
export const reserved = (allTx: Tx[], id: string): number =>
  allTx
    .filter(
      (t) =>
        t.vendedorId === id &&
        ["pendiente", "recibido", "vencida"].includes(t.estado as string),
    )
    .reduce((sum, t) => sum + (t.sats || 0), 0);

export const available = (v: Vendor, allTx: Tx[]): number =>
  Math.max(0, (Number(v.liquidez) || 0) - reserved(allTx, v.id));

export const onlineVendors = (vendors: Vendor[], authorized: Set<string>) =>
  vendors.filter((v) => isOnline(v, authorized));

export const eligibleVendors = (
  vendors: Vendor[],
  authorized: Set<string>,
  allTx: Tx[],
  sats: number,
) => onlineVendors(vendors, authorized).filter((v) => available(v, allTx) >= sats);

/**
 * Round-robin: the next vendor after the last assigned, among those with
 * enough balance. Mirrors the original, including the non-transactional turn write.
 */
export async function pickSeller(
  db: P2PStore | null,
  vendors: Vendor[],
  authorized: Set<string>,
  allTx: Tx[],
  sats: number,
): Promise<Vendor | null> {
  const eligible = eligibleVendors(vendors, authorized, allTx, sats).sort((a, b) =>
    a.id < b.id ? -1 : 1,
  );
  if (!eligible.length) return null;

  let last = "";
  try {
    const snap = await db!.doc("meta/turno").get();
    last = snap.exists ? String(snap.data()?.ultimo ?? "") : "";
  } catch {
    /* keep empty */
  }

  const next = eligible.find((v) => v.id > last) || eligible[0];
  try {
    await db!.doc("meta/turno").set({ ultimo: next.id });
  } catch {
    /* keep going */
  }
  return next;
}

export function vendorStatus(
  v: Vendor | null,
  authorized: Set<string>,
  allTx: Tx[],
): VendorStatus {
  if (!v || !hasData(v))
    return {
      on: false,
      t: "Completá tus datos",
      s: "Sin datos de cobro no podés recibir pedidos.",
    };
  if (!authorized.has(v.id))
    return {
      on: false,
      t: "Pendiente de habilitación",
      s: "El administrador tiene que habilitar tu cuenta.",
    };
  if (!v.activo)
    return { on: false, t: "Pausado", s: "Activá el interruptor para recibir pedidos." };
  if (!inSchedule(v))
    return {
      on: false,
      t: "Fuera de horario",
      s: `Tu horario es de ${v.desde} a ${v.hasta}.`,
    };
  return {
    on: true,
    t: "Online",
    s: `Recibís pedidos hasta las ${v.hasta}. Disponible: ${fmt(available(v, allTx))} Sats.`,
  };
}

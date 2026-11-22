import { createHash } from "node:crypto";

export const PAGE_SIZE = 50;
export const MAX_PAGES = 200;
export const REFRESH_MS = 2 * 60 * 60 * 1000;
export const HISTORIAL_LIMITE = 50;
export const MENSAJE_MAX = 280;

const TX_TYPES = new Set(["incoming", "outgoing"]);

// Los mensajes de este error se imprimen en logs públicos: nunca incluir valores recibidos.
export class DatosInconsistentes extends Error {
  constructor(message) {
    super(message);
    this.name = "DatosInconsistentes";
  }
}

function assertMsat(value, campo) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new DatosInconsistentes(`${campo} inválido`);
  }
}

// NIP-47 expresa saldos y montos en milisatoshis.
export function msatToSat(msat) {
  assertMsat(msat, "monto");
  return Math.floor(msat / 1000);
}

function assertTransaction(tx) {
  if (!tx || typeof tx !== "object") throw new DatosInconsistentes("transacción inválida");
  if (!TX_TYPES.has(tx.type)) throw new DatosInconsistentes("tipo de transacción inválido");
  if (typeof tx.state !== "string") throw new DatosInconsistentes("estado de transacción inválido");
  if (typeof tx.payment_hash !== "string" || tx.payment_hash === "") {
    throw new DatosInconsistentes("payment_hash inválido");
  }
  assertMsat(tx.amount, "amount");
}

/**
 * Recorre todas las páginas de `list_transactions` hasta recibir una página incompleta.
 * Deduplica por payment_hash porque una transacción nueva durante la paginación corre los offsets.
 */
export async function fetchIncomingTransactions(
  listTransactions,
  { pageSize = PAGE_SIZE, maxPages = MAX_PAGES } = {},
) {
  const byHash = new Map();
  for (let page = 0; page < maxPages; page++) {
    const response = await listTransactions({
      type: "incoming",
      limit: pageSize,
      offset: page * pageSize,
    });
    if (!response || !Array.isArray(response.transactions)) {
      throw new DatosInconsistentes("respuesta de list_transactions inválida");
    }
    const { transactions } = response;
    if (transactions.length > pageSize) {
      throw new DatosInconsistentes("página más grande que el límite pedido");
    }
    for (const tx of transactions) {
      assertTransaction(tx);
      if (!byHash.has(tx.payment_hash)) byHash.set(tx.payment_hash, tx);
    }
    if (transactions.length < pageSize) return [...byHash.values()];
  }
  throw new DatosInconsistentes("se superó el máximo de páginas");
}

export function donacionId(paymentHash) {
  return createHash("sha256").update(String(paymentHash)).digest("hex").slice(0, 12);
}

function unixToIso(seconds) {
  if (!Number.isSafeInteger(seconds) || seconds <= 0) return null;
  const date = new Date(seconds * 1000);
  if (Number.isNaN(date.getTime())) return null;
  return isoSeconds(date);
}

/**
 * Deja un texto apto para publicar. Descarta memos que son una factura,
 * un JSON o una URL, y no recorta: un mensaje demasiado largo se omite.
 */
export function sanitizeMensaje(value) {
  if (typeof value !== "string") return null;
  const cleaned = value
    .replace(/<[^>]*>/g, " ")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned || cleaned.length > MENSAJE_MAX) return null;
  if (/^(lnbc|lntb|lnbcrt|lno1)/i.test(cleaned)) return null;
  if (/^https?:\/\//i.test(cleaned)) return null;
  if (cleaned.startsWith("{") || cleaned.startsWith("[")) return null;
  return cleaned;
}

function mensajeDe(tx) {
  const comment = sanitizeMensaje(tx.metadata?.comment);
  if (comment) return comment;
  return sanitizeMensaje(tx.description);
}

/**
 * Historial público: solo pagos entrantes liquidados, del más nuevo al más viejo.
 * No copia factura, preimage, hash ni datos del pagador.
 */
export function buildHistorial(transactions, { limit = HISTORIAL_LIMITE, hiddenIds = new Set() } = {}) {
  const items = [];
  for (const tx of transactions) {
    assertTransaction(tx);
    if (tx.type !== "incoming" || tx.state !== "settled") continue;
    const sats = msatToSat(tx.amount);
    const mensaje = mensajeDe(tx);
    if (sats < 1 && !mensaje) continue;
    const settledAt = unixToIso(tx.settled_at) ?? unixToIso(tx.created_at);
    if (!settledAt) continue;
    const id = donacionId(tx.payment_hash);
    if (hiddenIds.has(id)) continue;
    const item = { id, sats, settled_at: settledAt };
    if (mensaje) item.mensaje = mensaje;
    items.push(item);
  }

  items.sort((a, b) => {
    if (a.settled_at !== b.settled_at) return a.settled_at < b.settled_at ? 1 : -1;
    if (a.id === b.id) return 0;
    return a.id < b.id ? -1 : 1;
  });

  const seen = new Set();
  const unique = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    unique.push(item);
    if (unique.length >= limit) break;
  }
  return unique;
}

export function sumReceivedMsat(transactions) {
  let total = 0;
  for (const tx of transactions) {
    assertTransaction(tx);
    if (tx.type === "incoming" && tx.state === "settled") {
      total += tx.amount;
    }
  }
  assertMsat(total, "total recibido");
  return total;
}

export async function computeTotals(client, { pageSize, maxPages, hiddenIds } = {}) {
  const balanceResponse = await client.getBalance();
  assertMsat(balanceResponse?.balance, "balance");

  const transactions = await fetchIncomingTransactions(
    (request) => client.listTransactions(request),
    { pageSize, maxPages },
  );

  return {
    received_sats: msatToSat(sumReceivedMsat(transactions)),
    balance_sats: msatToSat(balanceResponse.balance),
    donaciones: buildHistorial(transactions, { hiddenIds }),
  };
}

function isoSeconds(date) {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

const RECORD_KEYS = ["balance_sats", "checked_at", "data_changed_at", "donaciones", "received_sats"];
const ISO_SECONDS = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$/;

function parseItem(item) {
  if (!item || typeof item !== "object") return null;
  const keys = Object.keys(item).sort().join();
  if (keys !== "id,sats,settled_at" && keys !== "id,mensaje,sats,settled_at") return null;
  if (typeof item.id !== "string" || !/^[0-9a-f]{12}$/.test(item.id)) return null;
  if (!Number.isSafeInteger(item.sats) || item.sats < 0) return null;
  if (typeof item.settled_at !== "string" || !ISO_SECONDS.test(item.settled_at)) return null;
  if (Number.isNaN(Date.parse(item.settled_at))) return null;
  if (item.mensaje !== undefined) {
    if (typeof item.mensaje !== "string" || item.mensaje.length < 1 || item.mensaje.length > MENSAJE_MAX) {
      return null;
    }
  }
  return item;
}

function parseLista(value) {
  if (!Array.isArray(value) || value.length > HISTORIAL_LIMITE) return null;
  const items = [];
  for (const raw of value) {
    const item = parseItem(raw);
    if (!item) return null;
    items.push(item);
  }
  return items;
}

function sameLista(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (x.id !== y.id || x.sats !== y.sats || x.settled_at !== y.settled_at) return false;
    if ((x.mensaje ?? null) !== (y.mensaje ?? null)) return false;
  }
  return true;
}

function parsePrevious(previous) {
  if (!previous || typeof previous !== "object") return null;
  const { received_sats, balance_sats, data_changed_at, checked_at } = previous;
  const donaciones = parseLista(previous.donaciones);
  if (
    Object.keys(previous).sort().join() !== RECORD_KEYS.join() ||
    !Number.isSafeInteger(received_sats) ||
    !Number.isSafeInteger(balance_sats) ||
    !donaciones ||
    Number.isNaN(Date.parse(data_changed_at)) ||
    Number.isNaN(Date.parse(checked_at))
  ) {
    return null;
  }
  return { ...previous, donaciones };
}

/**
 * Devuelve el nuevo contenido de donaciones.json, o null si no hace falta commitear:
 * se reescribe si cambió un total, si cambió el historial, o si `checked_at` tiene más de REFRESH_MS.
 */
export function buildRecord(previous, totals, now, { refreshMs = REFRESH_MS } = {}) {
  const prev = parsePrevious(previous);
  const donaciones = parseLista(totals?.donaciones);
  if (!donaciones) throw new DatosInconsistentes("historial inválido");
  const nowIso = isoSeconds(now);

  const changed =
    !prev ||
    prev.received_sats !== totals.received_sats ||
    prev.balance_sats !== totals.balance_sats ||
    !sameLista(prev.donaciones, donaciones);
  const stale = !prev || now.getTime() - Date.parse(prev.checked_at) > refreshMs;

  if (!changed && !stale) return null;

  return {
    received_sats: totals.received_sats,
    balance_sats: totals.balance_sats,
    donaciones,
    data_changed_at: changed ? nowIso : prev.data_changed_at,
    checked_at: nowIso,
  };
}

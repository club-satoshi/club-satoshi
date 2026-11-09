export const PAGE_SIZE = 50;
export const MAX_PAGES = 200;
export const REFRESH_MS = 2 * 60 * 60 * 1000;

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

export async function computeTotals(client, { pageSize, maxPages } = {}) {
  const balanceResponse = await client.getBalance();
  assertMsat(balanceResponse?.balance, "balance");

  const transactions = await fetchIncomingTransactions(
    (request) => client.listTransactions(request),
    { pageSize, maxPages },
  );

  return {
    received_sats: msatToSat(sumReceivedMsat(transactions)),
    balance_sats: msatToSat(balanceResponse.balance),
  };
}

function isoSeconds(date) {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

const RECORD_KEYS = ["balance_sats", "checked_at", "data_changed_at", "received_sats"];

function parsePrevious(previous) {
  if (!previous || typeof previous !== "object") return null;
  const { received_sats, balance_sats, data_changed_at, checked_at } = previous;
  if (
    Object.keys(previous).sort().join() !== RECORD_KEYS.join() ||
    !Number.isSafeInteger(received_sats) ||
    !Number.isSafeInteger(balance_sats) ||
    Number.isNaN(Date.parse(data_changed_at)) ||
    Number.isNaN(Date.parse(checked_at))
  ) {
    return null;
  }
  return previous;
}

/**
 * Devuelve el nuevo contenido de donaciones.json, o null si no hace falta commitear:
 * solo se reescribe si cambió algún número o si `checked_at` tiene más de REFRESH_MS.
 */
export function buildRecord(previous, totals, now, { refreshMs = REFRESH_MS } = {}) {
  const prev = parsePrevious(previous);
  const nowIso = isoSeconds(now);

  const changed =
    !prev ||
    prev.received_sats !== totals.received_sats ||
    prev.balance_sats !== totals.balance_sats;
  const stale = !prev || now.getTime() - Date.parse(prev.checked_at) > refreshMs;

  if (!changed && !stale) return null;

  return {
    received_sats: totals.received_sats,
    balance_sats: totals.balance_sats,
    data_changed_at: changed ? nowIso : prev.data_changed_at,
    checked_at: nowIso,
  };
}

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildRecord,
  computeTotals,
  DatosInconsistentes,
  fetchIncomingTransactions,
  msatToSat,
  sumReceivedMsat,
} from "../src/calc.mjs";

const T0 = Date.parse("2026-11-09T15:00:00Z") / 1000;

let seq = 0;
function tx(overrides = {}) {
  seq += 1;
  return {
    type: "incoming",
    state: "settled",
    invoice: "lnbc...",
    description: "",
    description_hash: "",
    preimage: "",
    payment_hash: `hash-${seq}`,
    amount: 1000,
    fees_paid: 0,
    created_at: T0 + 10,
    settled_at: T0 + 20,
    expires_at: T0 + 3600,
    ...overrides,
  };
}

function pagedList(all) {
  const calls = [];
  const listTransactions = async (request) => {
    calls.push(request);
    const page = all.slice(request.offset, request.offset + request.limit);
    return { transactions: page, total_count: all.length };
  };
  return { calls, listTransactions };
}

test("msatToSat redondea hacia abajo", () => {
  assert.equal(msatToSat(0), 0);
  assert.equal(msatToSat(999), 0);
  assert.equal(msatToSat(1000), 1);
  assert.equal(msatToSat(21_000_999), 21_000);
});

test("msatToSat rechaza valores no enteros o negativos", () => {
  for (const value of [-1, 1.5, "1000", null, undefined, Number.NaN]) {
    assert.throws(() => msatToSat(value), DatosInconsistentes);
  }
});

test("sumReceivedMsat cuenta todas las entrantes liquidadas, sin importar la fecha", () => {
  const txs = [
    tx({ amount: 5000 }),
    tx({ amount: 7000, created_at: 1, settled_at: 2 }),
    tx({ amount: 200_000, type: "outgoing" }),
    tx({ amount: 300_000, state: "pending", settled_at: 0 }),
    tx({ amount: 400_000, state: "failed", settled_at: 0 }),
  ];
  assert.equal(sumReceivedMsat(txs), 12_000);
});

test("sumReceivedMsat rechaza transacciones malformadas", () => {
  assert.throws(() => sumReceivedMsat([tx({ amount: -1 })]), DatosInconsistentes);
  assert.throws(() => sumReceivedMsat([tx({ state: undefined })]), DatosInconsistentes);
});

test("fetchIncomingTransactions pagina hasta una página incompleta", async () => {
  const all = Array.from({ length: 120 }, () => tx());
  const { calls, listTransactions } = pagedList(all);

  const result = await fetchIncomingTransactions(listTransactions, { pageSize: 50 });

  assert.equal(result.length, 120);
  assert.deepEqual(
    calls.map((c) => c.offset),
    [0, 50, 100],
  );
  assert.ok(calls.every((c) => c.limit === 50 && c.type === "incoming"));
});

test("fetchIncomingTransactions pide una página extra cuando el total es múltiplo del límite", async () => {
  const all = Array.from({ length: 100 }, () => tx());
  const { calls, listTransactions } = pagedList(all);

  const result = await fetchIncomingTransactions(listTransactions, { pageSize: 50 });

  assert.equal(result.length, 100);
  assert.deepEqual(
    calls.map((c) => c.offset),
    [0, 50, 100],
  );
});

test("fetchIncomingTransactions deduplica si los offsets se corren durante la paginación", async () => {
  const all = Array.from({ length: 60 }, () => tx());
  const pages = [all.slice(0, 50), all.slice(49, 60)];
  let i = 0;
  const result = await fetchIncomingTransactions(async () => ({ transactions: pages[i++] }), {
    pageSize: 50,
  });
  assert.equal(result.length, 60);
});

test("fetchIncomingTransactions falla si nunca termina", async () => {
  const listTransactions = async ({ limit }) => ({
    transactions: Array.from({ length: limit }, () => tx()),
  });
  await assert.rejects(
    fetchIncomingTransactions(listTransactions, { pageSize: 10, maxPages: 3 }),
    DatosInconsistentes,
  );
});

test("fetchIncomingTransactions falla con respuestas malformadas", async () => {
  for (const response of [null, {}, { transactions: "x" }, { transactions: [{ type: "incoming" }] }]) {
    await assert.rejects(
      fetchIncomingTransactions(async () => response, { pageSize: 10 }),
      DatosInconsistentes,
    );
  }
});

test("computeTotals combina saldo y recibido en sats", async () => {
  const all = [
    ...Array.from({ length: 75 }, () => tx({ amount: 1500 })),
    tx({ amount: 999_000, created_at: 1, settled_at: 2 }),
    tx({ amount: 50_000, state: "pending", settled_at: 0 }),
  ];
  const { listTransactions } = pagedList(all);
  const client = { getBalance: async () => ({ balance: 21_000_500 }), listTransactions };

  const totals = await computeTotals(client, { pageSize: 50 });

  assert.deepEqual(totals, { received_sats: 1111, balance_sats: 21_000 });
});

test("computeTotals falla si el saldo es inválido", async () => {
  const client = { getBalance: async () => ({}), listTransactions: async () => ({ transactions: [] }) };
  await assert.rejects(computeTotals(client), DatosInconsistentes);
});

test("buildRecord crea el archivo cuando no hay datos previos", () => {
  const now = new Date("2026-11-09T18:00:00.123Z");
  assert.deepEqual(buildRecord(null, { received_sats: 10, balance_sats: 5 }, now), {
    received_sats: 10,
    balance_sats: 5,
    data_changed_at: "2026-11-09T18:00:00Z",
    checked_at: "2026-11-09T18:00:00Z",
  });
});

const previous = {
  received_sats: 10,
  balance_sats: 5,
  data_changed_at: "2026-11-09T17:00:00Z",
  checked_at: "2026-11-09T18:00:00Z",
};

test("buildRecord no reescribe si nada cambió y el chequeo es reciente", () => {
  const now = new Date("2026-11-09T20:00:00Z");
  assert.equal(buildRecord(previous, { received_sats: 10, balance_sats: 5 }, now), null);
});

test("buildRecord refresca checked_at pasadas 2 horas sin tocar data_changed_at", () => {
  const now = new Date("2026-11-09T20:00:01Z");
  assert.deepEqual(buildRecord(previous, { received_sats: 10, balance_sats: 5 }, now), {
    ...previous,
    checked_at: "2026-11-09T20:00:01Z",
  });
});

test("buildRecord actualiza data_changed_at cuando cambia un número", () => {
  const now = new Date("2026-11-09T18:30:00Z");
  assert.deepEqual(buildRecord(previous, { received_sats: 10, balance_sats: 4 }, now), {
    ...previous,
    balance_sats: 4,
    data_changed_at: "2026-11-09T18:30:00Z",
    checked_at: "2026-11-09T18:30:00Z",
  });
});

test("buildRecord trata un archivo previo malformado como inexistente", () => {
  const now = new Date("2026-11-09T18:30:00Z");
  const record = buildRecord({ ...previous, checked_at: "ayer" }, previous, now);
  assert.equal(record.data_changed_at, "2026-11-09T18:30:00Z");
});

test("buildRecord reescribe un archivo con el formato anterior (con since)", () => {
  const now = new Date("2026-11-09T18:30:00Z");
  const old = { since: "2026-11-09T16:00:00Z", ...previous };
  assert.deepEqual(buildRecord(old, { received_sats: 10, balance_sats: 5 }, now), {
    received_sats: 10,
    balance_sats: 5,
    data_changed_at: "2026-11-09T18:30:00Z",
    checked_at: "2026-11-09T18:30:00Z",
  });
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../src/main.mjs";

const FAKE_URL = "nostr+walletconnect://abc?relay=wss://relay.example&secret=supersecreto";

async function withTmp(fn) {
  const dir = await mkdtemp(join(tmpdir(), "donaciones-"));
  try {
    await fn(join(dir, "data", "donaciones.json"));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function capture() {
  const lines = [];
  return { lines, push: (line) => lines.push(line) };
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

test("run escribe el archivo e imprime solo los dos totales", async () => {
  await withTmp(async (outputPath) => {
    const out = capture();
    const err = capture();
    let closed = false;
    const client = {
      getBalance: async () => ({ balance: 42_000 }),
      listTransactions: async () => ({
        transactions: [
          {
            type: "incoming",
            state: "settled",
            payment_hash: "h1",
            preimage: "preimage-secreta",
            invoice: "lnbc-factura",
            amount: 21_000,
            settled_at: Date.parse("2026-11-10T00:00:00Z") / 1000,
          },
        ],
      }),
      close: () => {
        closed = true;
      },
    };

    const code = await run({
      nwcUrl: FAKE_URL,
      outputPath,
      createClient: () => client,
      now: () => new Date("2026-11-10T01:00:00Z"),
      out: out.push,
      err: err.push,
    });

    assert.equal(code, 0);
    assert.ok(closed);
    assert.deepEqual(out.lines, ["received_sats=21", "balance_sats=42"]);
    assert.deepEqual(err.lines, []);
    const saved = JSON.parse(await readFile(outputPath, "utf8"));
    assert.equal(saved.received_sats, 21);
    assert.equal(saved.balance_sats, 42);
  });
});

test("run no escribe nada y no filtra datos sensibles si NWC falla", async () => {
  await withTmp(async (outputPath) => {
    const out = capture();
    const err = capture();
    const failure = Object.assign(new Error(`relay dijo algo con ${FAKE_URL}`), { code: "OTHER" });
    const client = {
      getBalance: async () => {
        throw failure;
      },
      listTransactions: async () => ({ transactions: [] }),
      close: () => {},
    };

    const code = await run({
      nwcUrl: FAKE_URL,
      outputPath,
      createClient: () => client,
      out: out.push,
      err: err.push,
    });

    assert.equal(code, 1);
    assert.equal(await exists(outputPath), false);
    assert.deepEqual(out.lines, []);
    const logs = err.lines.join("\n");
    assert.match(logs, /código OTHER/);
    assert.doesNotMatch(logs, /supersecreto|walletconnect|relay dijo/);
  });
});

test("run falla si la respuesta es inconsistente", async () => {
  await withTmp(async (outputPath) => {
    const err = capture();
    const client = {
      getBalance: async () => ({ balance: -5 }),
      listTransactions: async () => ({ transactions: [] }),
      close: () => {},
    };

    const code = await run({
      nwcUrl: FAKE_URL,
      outputPath,
      createClient: () => client,
      out: () => {},
      err: err.push,
    });

    assert.equal(code, 1);
    assert.equal(await exists(outputPath), false);
    assert.match(err.lines.join("\n"), /inconsistente/);
  });
});

test("run falla por timeout sin escribir", async () => {
  await withTmp(async (outputPath) => {
    const client = {
      getBalance: () => new Promise(() => {}),
      listTransactions: async () => ({ transactions: [] }),
      close: () => {},
    };

    const code = await run({
      nwcUrl: FAKE_URL,
      outputPath,
      createClient: () => client,
      out: () => {},
      err: () => {},
      timeoutMs: 20,
    });

    assert.equal(code, 1);
    assert.equal(await exists(outputPath), false);
  });
});

test("run exige NWC_URL con el formato esperado", async () => {
  const err = capture();
  const code = await run({
    nwcUrl: undefined,
    outputPath: "/tmp/no-se-usa.json",
    createClient: () => {
      throw new Error("no debería llamarse");
    },
    err: err.push,
  });
  assert.equal(code, 1);
  assert.match(err.lines[0], /NWC_URL/);
});

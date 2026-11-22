import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { buildRecord, computeTotals, DatosInconsistentes } from "./calc.mjs";

const DEFAULT_OCULTOS_PATH = join(dirname(fileURLToPath(import.meta.url)), "..", "ocultos.json");

const OVERALL_TIMEOUT_MS = 120_000;
const NWC_PREFIX = "nostr+walletconnect://";

// Los logs de Actions son públicos: solo se describe el tipo de error, nunca su mensaje ni datos.
function describeError(error) {
  if (error instanceof DatosInconsistentes) {
    return `respuesta inconsistente de NWC (${error.message})`;
  }
  const code = error?.code;
  if (typeof code === "string" && /^[A-Z_]{2,40}$/.test(code)) {
    return `falló la consulta NWC (código ${code})`;
  }
  return "falló la consulta NWC";
}

async function readPrevious(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return null;
  }
}

async function writeAtomic(path, data) {
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  await writeFile(tmp, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await rename(tmp, path);
}

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("timeout")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

const ID_OCULTO = /^[0-9a-f]{12}$/;

/** Ids (sha256 truncado) que no se publican. Un archivo ausente no oculta nada. */
export async function loadOcultos(path) {
  let raw;
  try {
    raw = await readFile(path, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return new Set();
    throw error;
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new DatosInconsistentes("lista de ocultos inválida");
  }
  if (!Array.isArray(parsed) || parsed.some((id) => typeof id !== "string" || !ID_OCULTO.test(id))) {
    throw new DatosInconsistentes("lista de ocultos inválida");
  }
  return new Set(parsed);
}

/** Devuelve el código de salida del proceso. Solo escribe `outputPath` si NWC respondió bien. */
export async function run({
  nwcUrl,
  outputPath,
  createClient,
  now = () => new Date(),
  out = (line) => process.stdout.write(`${line}\n`),
  err = (line) => process.stderr.write(`${line}\n`),
  timeoutMs = OVERALL_TIMEOUT_MS,
  ocultosPath = DEFAULT_OCULTOS_PATH,
}) {
  if (!outputPath) {
    err("Error: falta la ruta de salida (uso: node src/main.mjs <ruta/donaciones.json>)");
    return 1;
  }
  if (typeof nwcUrl !== "string" || !nwcUrl.startsWith(NWC_PREFIX)) {
    err("Error: NWC_URL no está definido o no tiene el formato esperado");
    return 1;
  }

  let hiddenIds;
  try {
    hiddenIds = await loadOcultos(ocultosPath);
  } catch (error) {
    err(`Error: ${describeError(error)}. No se escribió nada.`);
    return 1;
  }

  let client;
  let totals;
  try {
    client = await createClient(nwcUrl);
    totals = await withTimeout(computeTotals(client, { hiddenIds }), timeoutMs);
  } catch (error) {
    err(`Error: ${describeError(error)}. No se escribió nada.`);
    return 1;
  } finally {
    try {
      client?.close();
    } catch {
      // ignorado: el proceso termina igual
    }
  }

  out(`received_sats=${totals.received_sats}`);
  out(`balance_sats=${totals.balance_sats}`);

  const record = buildRecord(await readPrevious(outputPath), totals, now());
  if (record) await writeAtomic(outputPath, record);
  return 0;
}

function silenceConsole() {
  const noop = () => {};
  for (const method of ["log", "info", "warn", "error", "debug", "trace", "dir", "table"]) {
    console[method] = noop;
  }
}

async function cli() {
  // El SDK (y nostr-tools) escriben en console por su cuenta, a veces con payloads de relays.
  silenceConsole();
  const fatal = () => {
    process.stderr.write("Error: falló la consulta NWC. No se escribió nada.\n");
    process.exit(1);
  };
  process.on("unhandledRejection", fatal);
  process.on("uncaughtException", fatal);

  const { NWCClient } = await import("@getalby/sdk/nwc");
  const code = await run({
    nwcUrl: process.env.NWC_URL,
    outputPath: process.argv[2],
    createClient: (url) =>
      new NWCClient({ nostrWalletConnectUrl: url, logger: { debug: () => {} } }),
  });
  // Los sockets de los relays pueden quedar abiertos: se termina explícitamente.
  process.exit(code);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await cli();
}

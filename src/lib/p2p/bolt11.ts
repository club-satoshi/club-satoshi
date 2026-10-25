import { fmt } from "./utils";

/**
 * Reads the amount encoded in a BOLT11 invoice and compares it with the purchase.
 * Ported verbatim from the original `checkInvoice` — including its naive parsing.
 * Returns an error message, or null when the invoice is usable.
 */
export function checkInvoice(raw: string, lockSats: number): string | null {
  const s = raw.trim().toLowerCase().replace(/^lightning:/, "");
  if (!s) return "Pegá la factura que generaste en tu billetera.";
  if (/^ln(tb|tbs|bcrt)/.test(s))
    return "Esa factura es de una red de prueba. Generá una factura de Bitcoin real.";
  if (!/^lnbc[0-9a-z]+$/.test(s) || s.length < 90)
    return "Eso no parece una factura Lightning. Tiene que empezar con “lnbc”.";

  const hrp = s.slice(0, s.lastIndexOf("1"));
  const m = hrp.match(/^lnbc(\d*)([munp]?)$/);
  if (!m) return "No pudimos leer la factura. Copiala de nuevo desde tu billetera.";
  if (!m[1])
    return `La factura no tiene monto. Generala por exactamente ${fmt(lockSats)} Sats.`;

  const mult: Record<string, number> = { "": 1e8, m: 1e5, u: 100, n: 0.1, p: 0.0001 };
  const sats = Number(m[1]) * mult[m[2]];
  if (Math.abs(sats - lockSats) >= 1)
    return `La factura es por ${fmt(Math.round(sats))} Sats, pero tu compra es de ${fmt(lockSats)} Sats. Generá una nueva por el monto correcto.`;

  return null;
}

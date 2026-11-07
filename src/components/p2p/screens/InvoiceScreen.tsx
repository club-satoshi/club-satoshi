"use client";

import { useState } from "react";
import s from "../p2p.module.css";
import { checkInvoice } from "@/lib/p2p/bolt11";

interface InvoiceScreenProps {
  satsText: string;
  /** Numeric sat amount, needed to validate the BOLT11 amount. */
  lockSats: number;
  onSend: (invoice: string) => Promise<string | null>;
}

export default function InvoiceScreen({
  satsText,
  lockSats,
  onSend,
}: InvoiceScreenProps) {
  const [invoice, setInvoice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const problem = checkInvoice(invoice, lockSats);
    setError(problem || "");
    if (problem) return;
    setBusy(true);
    const failure = await onSend(invoice);
    setBusy(false);
    if (failure) {
      setError(failure);
      return;
    }
    setError("");
    setInvoice("");
  };

  return (
    <section className={`${s.screen} ${s.active}`} id="s-invoice">
      <h2 className={s.display}>Ahora pegá tu factura Lightning</h2>
      <p className={s.sub}>
        Abrí tu billetera, tocá “Recibir” y generá una factura por exactamente{" "}
        <b>{satsText}</b>. Copiala y pegala acá.
      </p>

      <div className={s.field}>
        <label htmlFor="invoice">Factura Lightning</label>
        <textarea
          id="invoice"
          rows={4}
          placeholder="lnbc..."
          autoComplete="off"
          spellCheck={false}
          className={error ? s.bad : undefined}
          value={invoice}
          onChange={(event) => {
            setInvoice(event.target.value);
            if (error) setError("");
          }}
        />
        <p className={s["inv-err"]} role="alert">
          {error}
        </p>
      </div>

      <button className={`${s.btn} ${s.dark}`} disabled={busy} onClick={submit}>
        Enviar factura
      </button>
    </section>
  );
}

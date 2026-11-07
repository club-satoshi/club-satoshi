"use client";

import { useState } from "react";
import s from "../p2p.module.css";
import type { Method, Vendor } from "@/lib/p2p/types";
import { fmt } from "@/lib/p2p/utils";

interface PayScreenProps {
  seller: Vendor | null;
  method: Method;
  onMethod: (method: Method) => void;
  lock: { sats: number; ars: number };
  amount: number;
  satsText: string;
  onPaid: () => void;
  onBack: () => void;
}

function CopyRow({
  label,
  value,
  copy = true,
}: {
  label: string;
  value: string;
  copy?: boolean;
}) {
  const [done, setDone] = useState(false);

  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      /* clipboard denied */
    }
    setDone(true);
    window.setTimeout(() => setDone(false), 1500);
  };

  return (
    <div className={s.row}>
      <div>
        <small>{label}</small>
        <code>{value}</code>
      </div>
      {copy && (
        <button
          className={`${s.copy} ${done ? s.done : ""}`}
          type="button"
          onClick={doCopy}
        >
          {done ? "Copiado" : "Copiar"}
        </button>
      )}
    </div>
  );
}

export default function PayScreen({
  seller,
  method,
  onMethod,
  lock,
  amount,
  satsText,
  onPaid,
  onBack,
}: PayScreenProps) {
  if (!seller) return null;

  return (
    <section className={`${s.screen} ${s.active}`} id="s-pay">
      <h2 className={s.display}>Elegí cómo pagar</h2>
      <p className={s.sub}>
        Vas a recibir <b>{satsText}</b> en tu billetera Lightning. Pero primero, ¿cómo
        vas a pagar?
      </p>

      <div className={s.methods} role="radiogroup" aria-label="Método de pago">
        <button
          className={`${s.method} ${method === "cbu" ? s.on : ""}`}
          role="radio"
          aria-checked={method === "cbu"}
          onClick={() => onMethod("cbu")}
        >
          <strong>Pesos</strong>
          <span>Transferencia a CBU/CVU</span>
        </button>
        <button
          className={`${s.method} ${method === "usdt" ? s.on : ""}`}
          role="radio"
          aria-checked={method === "usdt"}
          onClick={() => onMethod("usdt")}
        >
          <strong>USDT</strong>
          <span>Red Tron (TRC‑20)</span>
        </button>
      </div>

      <div className={s.paybox}>
        {method === "cbu" ? (
          <>
            <div className={s.total}>
              Enviá exactamente
              <b>${fmt(lock.ars)}</b>
            </div>
            <CopyRow
              label="Titular"
              value={`${seller.nombre ?? ""} ${seller.apellido ?? ""}`.trim()}
              copy={false}
            />
            <CopyRow label="CBU/CVU" value={seller.cbu ?? ""} />
            <CopyRow label="Alias" value={seller.alias ?? ""} />
            <p className={s.warn}>
              En tu cuenta bancaria o billetera virtual, por favor verificá que
              coincidan los datos.
            </p>
          </>
        ) : (
          <>
            <div className={s.total}>
              Enviá exactamente
              <b>{amount} USDT</b>
            </div>
            <CopyRow label="Dirección" value={seller.usdt ?? ""} />
            <CopyRow label="Red" value="Tron (TRC-20)" copy={false} />
            <p className={s.warn}>
              Usá solo la red Tron (TRC-20). Si enviás por otra red, los fondos se
              pierden. Por favor, controlá la dirección de envío.
            </p>
          </>
        )}
      </div>

      <button className={`${s.btn} ${s.dark}`} onClick={onPaid}>
        {method === "usdt" ? "Ya transferí los USDT" : "Ya transferí los Pesos"}
      </button>
      <button className={s.link} onClick={onBack}>
        Volver
      </button>
    </section>
  );
}

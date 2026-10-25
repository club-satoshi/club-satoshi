"use client";

import { useEffect, useRef, useState } from "react";
import s from "../p2p.module.css";
import { BLUE_RECARGO, ROTAR_CADA_MS, ROW_H, SPREAD } from "@/lib/p2p/config";
import type { Tx } from "@/lib/p2p/types";
import { fmt, pad } from "@/lib/p2p/utils";
import Reel from "../Reel";

interface AmountScreenProps {
  amount: number;
  onAmountChange: (value: number) => void;
  btcUsd: number;
  dolarBlue: number;
  secsLeft: number;
  vendorsLoaded: boolean;
  storeReady: boolean;
  onlineCount: number;
  hasEligibleFor: (sats: number) => boolean;
  onBuy: () => void;
  /** null means the database is unavailable. */
  txs: Tx[] | null;
}

interface QueueItem {
  /** Index into the list of completed sales. */
  i: number;
  /** Comment colour slot: 0, 1 or 2. */
  c: number;
}

function pickIndex(length: number, exclude: number): number {
  if (length < 2) return 0;
  let i: number;
  do {
    i = Math.floor(Math.random() * length);
  } while (i === exclude);
  return i;
}

function TxTicker({ txs }: { txs: Tx[] }) {
  // Two rows are mounted; the track slides one row up and the first one is dropped.
  const [items, setItems] = useState<QueueItem[]>([{ i: 0, c: 0 }]);
  const [view, setView] = useState({ offset: 0, animate: false });
  const colorTurn = useRef(1);
  const [count, setCount] = useState(txs.length);

  // New rows arrive from the database: restart the reel at the first one.
  if (count !== txs.length) {
    setCount(txs.length);
    setItems([{ i: 0, c: 0 }]);
    setView({ offset: 0, animate: false });
  }

  useEffect(() => {
    if (txs.length < 2) return;
    let advance: number | undefined;
    const id = window.setInterval(() => {
      setView({ offset: ROW_H, animate: true });
      advance = window.setTimeout(() => {
        setItems((current) => {
          const next = current.slice(1);
          const exclude = current.length > 1 ? current[1].i : -1;
          next.push({ i: pickIndex(txs.length, exclude), c: colorTurn.current++ % 3 });
          return next;
        });
        setView({ offset: 0, animate: false });
      }, 760);
    }, ROTAR_CADA_MS);
    return () => {
      window.clearInterval(id);
      if (advance) window.clearTimeout(advance);
    };
  }, [txs.length]);

  const row = (item: QueueItem | undefined) => {
    if (!item) return null;
    const tx = txs[item.i];
    if (!tx) return null;
    return (
      <div className={`${s.tx} ${s["c" + item.c]}`}>
        <span className={s["tx-code"]}>#{pad(tx.n)}</span>
        <span className={s["tx-comment"]} title={tx.comentario || undefined}>
          {tx.comentario ? `“${tx.comentario}”` : ""}
        </span>
        <span className={s["tx-sats"]}>{fmt(tx.sats)} Sats</span>
      </div>
    );
  };

  return (
    <div className={s["tx-list"]} id="txList">
      <div
        className={s["tx-track"]}
        style={{
          transition: view.animate
            ? "transform .7s cubic-bezier(.65, 0, .35, 1)"
            : "none",
          transform: `translateY(-${view.offset}px)`,
        }}
      >
        {row(items[0])}
        {row(items[1])}
      </div>
    </div>
  );
}


export default function AmountScreen({
  amount,
  onAmountChange,
  btcUsd,
  dolarBlue,
  secsLeft,
  vendorsLoaded,
  storeReady,
  onlineCount,
  hasEligibleFor,
  onBuy,
  txs,
}: AmountScreenProps) {
  const [raw, setRaw] = useState(String(amount));
  const [badInput, setBadInput] = useState(false);

  const parsed = Number(raw);
  const valid = Number.isInteger(parsed) && parsed >= 1 && parsed <= 10;
  const bad = badInput;

  const sats = Math.floor((valid ? parsed : 0) / btcUsd * 1e8);
  const arsUsd = dolarBlue * (1 + BLUE_RECARGO);
  const ars = Math.ceil((valid ? parsed : 0) * arsUsd * (1 + SPREAD));

  let hint = "Entre 1 y 10 dólares";
  let isError = false;
  let canBuy = valid;

  if (!storeReady) {
    hint = "La compra no está disponible en este momento.";
    isError = true;
    canBuy = false;
  } else if (bad || (raw !== "" && !valid)) {
    isError = true;
    hint =
      bad || (Number.isFinite(parsed) && !Number.isInteger(parsed))
        ? "Tienen que ser números enteros entre 1 y 10, sin centavos."
        : "El monto tiene que ser de 1 a 10 dólares.";
  } else if (valid && vendorsLoaded) {
    if (onlineCount === 0) {
      hint = "No hay vendedores online en este momento. Probá más tarde.";
      isError = true;
      canBuy = false;
    } else if (!hasEligibleFor(sats)) {
      hint = "Ahora no hay saldo disponible para este monto. Probá con uno menor.";
      isError = true;
      canBuy = false;
    }
  }

  const commit = (value: number) => {
    const next = Math.min(10, Math.max(1, value));
    setRaw(String(next));
    onAmountChange(next);
  };

  const step = (delta: number) => {
    const cur = Math.round(Number(raw));
    const next =
      Number.isFinite(cur) && cur >= 1 && cur <= 10 ? cur + delta : 1;
    commit(next);
  };

  const payItems = [
    <div key="ars" className={s["pay-item"]}>
      <div className={s["sw-pay"]}>
        <svg className={s.flag} viewBox="0 0 30 20" aria-label="Argentina" role="img">
          <rect width="30" height="20" fill="#74acdf" />
          <rect y="6.67" width="30" height="6.67" fill="#fff" />
          <circle cx="15" cy="10" r="2.2" fill="#f6b40e" />
        </svg>
        <span>${fmt(ars)}</span>
      </div>
      <small className={s["sw-sub"]}>CBU/CVU/ALIAS</small>
    </div>,
    <div key="usd" className={s["pay-item"]}>
      <div className={s["sw-pay"]}>
        <svg className={s.flag} viewBox="0 0 30 20" aria-label="Estados Unidos" role="img">
          <rect width="30" height="20" fill="#fff" />
          <g fill="#b22234">
            <rect width="30" height="1.54" />
            <rect y="3.08" width="30" height="1.54" />
            <rect y="6.15" width="30" height="1.54" />
            <rect y="9.23" width="30" height="1.54" />
            <rect y="12.31" width="30" height="1.54" />
            <rect y="15.38" width="30" height="1.54" />
            <rect y="18.46" width="30" height="1.54" />
          </g>
          <rect width="12" height="10.77" fill="#3c3b6e" />
        </svg>
        <span>{valid ? parsed : 0} USD</span>
      </div>
      <small className={s["sw-sub"]}>USDT RED TRON (TRC20)</small>
    </div>,
    <div key="ars2" className={s["pay-item"]} aria-hidden="true">
      <div className={s["sw-pay"]}>
        <svg className={s.flag} viewBox="0 0 30 20" aria-label="Argentina" role="img">
          <rect width="30" height="20" fill="#74acdf" />
          <rect y="6.67" width="30" height="6.67" fill="#fff" />
          <circle cx="15" cy="10" r="2.2" fill="#f6b40e" />
        </svg>
        <span>${fmt(ars)}</span>
      </div>
      <small className={s["sw-sub"]}>CBU/CVU/ALIAS</small>
    </div>,
  ];

  return (
    <section className={`${s.screen} ${s.active}`} id="s-amount">
      <div className={s.disclaimer}>
        <p className={s["disc-full"]}>
          <em className={s["disc-title"]}>
            Don’t trust, verify ⚡ No confíes, verifica
          </em>
        </p>
      </div>

      <p className={s.eyebrow}>EL P2P DE CLUB SATOSHI</p>
      <h1 className={s.display}>¿Cuántos Satoshis acumulás hoy?</h1>

      <div className={s["amount-wrap"]}>
        <span>US$</span>
        <input
          className={s.amount}
          id="amount"
          type="number"
          inputMode="numeric"
          min={1}
          max={10}
          step={1}
          value={raw}
          aria-label="Monto en dólares, de 1 a 10"
          onChange={(event) => {
            setRaw(event.target.value);
            setBadInput(event.target.validity.badInput);
            const value = Number(event.target.value);
            if (Number.isInteger(value) && value >= 1 && value <= 10) {
              onAmountChange(value);
            }
          }}
        />
        <div className={s.stepper}>
          <button
            className={s.step}
            type="button"
            aria-label="Sumar un dólar"
            disabled={valid && parsed >= 10}
            onClick={() => step(1)}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 15l6-6 6 6" />
            </svg>
          </button>
          <button
            className={s.step}
            type="button"
            aria-label="Restar un dólar"
            disabled={valid && parsed <= 1}
            onClick={() => step(-1)}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
      </div>
      <p className={`${s.hint} ${isError ? s.err : ""}`}>{hint}</p>

      <div className={`${s.result} ${s.swap}`} aria-live="polite">
        <div className={`${s["sw-col"]} ${s["sw-left"]}`}>
          <p className={s["sw-label"]}>Vas a transferir</p>
          <Reel
            items={payItems}
            itemHeight={52}
            intervalMs={3500}
            className={s["pay-reel"]}
          />
        </div>
        <svg className={s["sw-arrow"]} viewBox="0 0 24 48" width="20" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 8l12 16-12 16" />
        </svg>
        <div className={`${s["sw-col"]} ${s["sw-right"]}`}>
          <p className={s["sw-label"]}>Vas a recibir</p>
          <div className={s["sw-sats"]}>
            <span>{fmt(sats)}</span>
          </div>
          <small className={s["sw-sub"]}>SATS</small>
        </div>
      </div>

      <p className={s.countdown} aria-live="off">
        Actualizamos cotización en <b>{secsLeft}</b> s
      </p>
      <button className={s.btn} disabled={!canBuy} onClick={onBuy}>
        Comprar
      </button>

      <div className={s.history} aria-live="polite">
        <h3 className={s.display}>Últimas transacciones</h3>
        {txs === null ? (
          <div className={`${s["tx-list"]} ${s.empty}`} id="txList">
            <p className={s["tx-empty"]}>
              El historial no está disponible en este momento.
            </p>
          </div>
        ) : txs.length === 0 ? (
          <div className={`${s["tx-list"]} ${s.empty}`} id="txList">
            <p className={s["tx-empty"]}>
              Todavía no hay compras. La primera puede ser la tuya!
            </p>
          </div>
        ) : (
          <TxTicker txs={txs} />
        )}
      </div>
    </section>
  );
}

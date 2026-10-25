"use client";

import { useState } from "react";
import s from "../p2p.module.css";
import Reel from "../Reel";

interface HomeScreenProps {
  onStart: () => void;
  /** Returns an error message, or null when the order was opened. */
  onTrack: (code: string) => Promise<string | null>;
}

const PHRASES = [
  <span key="en1" className={s["hr-item"]}>
    “Don’t trust, verify.”
  </span>,
  <span key="es" className={`${s["hr-item"]} ${s["hr-es"]}`}>
    “No confíes, verifica.”
  </span>,
  <span key="en2" className={s["hr-item"]} aria-hidden="true">
    “Don’t trust, verify.”
  </span>,
];

export default function HomeScreen({ onStart, onTrack }: HomeScreenProps) {
  const [trackOpen, setTrackOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const digits = code.replace(/\D/g, "");
    if (!Number(digits)) {
      setError("Escribí el código de tu pedido, por ejemplo 0005.");
      return;
    }
    const problem = await onTrack(digits);
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    setCode("");
    setTrackOpen(false);
  };

  return (
    <section className={`${s.screen} ${s.active} ${s.home}`} id="s-home">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={s["home-logo"]}
        src="/images/p2p-hero.svg"
        alt="Club Satoshi, comunidad bitcoiner"
      />
      <svg
        className={s["home-flag"]}
        viewBox="0 0 30 20"
        role="img"
        aria-label="Argentina"
      >
        <rect width="30" height="20" fill="#74acdf" />
        <rect y="6.67" width="30" height="6.67" fill="#fff" />
        <circle cx="15" cy="10" r="2.2" fill="#f6b40e" />
      </svg>

      <div className={s["home-rule"]}>
        <h1
          className={`${s.display} ${s["home-reel"]}`}
          aria-label="Don’t trust, verify. No confíes, verifica."
        >
          <Reel
            items={PHRASES}
            itemHeight="auto"
            intervalMs={3200}
            trackClassName={s["hr-track"]}
          />
        </h1>
      </div>

      <p className={s["home-lead"]}>⚡ BIENVENIDO AL P2P DE CLUB SATOSHI ⚡</p>
      <p className={s["home-text"]}>
        En esta web vas a poder cambiar tus <b>Pesos o USDT</b> por Satoshis. Los Sats
        te los venden miembros del <b>Club Satoshi</b>. Si ya nos conocés,{" "}
        <b>ya verificaste!</b> Si no nos conocés, te recomendamos no operar en esta
        web.
      </p>
      <p className={s["home-text"]}>
        Si de igual manera lo querés hacer, todo OK, somos buena gente y eso también lo
        podrás verificar 😉.
      </p>
      <p className={`${s["home-text"]} ${s["home-last"]}`}>Bienvenido!</p>

      <button className={`${s.btn} ${s["home-btn"]}`} type="button" onClick={onStart}>
        Quiero comprar Satoshis!
      </button>

      <button
        className={`${s.link} ${s["track-link"]}`}
        type="button"
        onClick={() => {
          setTrackOpen((v) => !v);
          setError("");
        }}
      >
        ¿Ya hiciste un pedido? Seguí tu pedido
      </button>

      {trackOpen && (
        <form className={s.track} onSubmit={submit} noValidate>
          <input
            inputMode="numeric"
            placeholder="Tu código, ej: 0005"
            autoComplete="off"
            aria-label="Código de operación"
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
          <button className={s.btn} type="submit">
            Ver mi pedido
          </button>
          <p className={s["inv-err"]} role="alert">
            {error}
          </p>
        </form>
      )}
    </section>
  );
}

"use client";

import { useState } from "react";
import s from "./p2p.module.css";

export const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "¿Club Satoshi?",
    a: "Sí! Somos Club Satoshi, una comunidad bitcoiner tucumana dedicada a generar espacios educativos para enseñar y seguir aprendiendo sobre Bitcoin. Esta web es solo un proyecto más de la comunidad para facilitar a los principiantes la compra de pequeñas cantidades de Satoshis. Bienvenido!",
  },
  {
    q: "¿Qué es un Satoshi?",
    a: "Es la unidad más pequeña de Bitcoin. Un bitcoin tiene 100 millones de Satoshis, así que podés comprar una partecita con muy poca plata.",
  },
  {
    q: "¿Quién me vende los Sats?",
    a: "Miembros activos del Club Satoshi que ya conocés. Nadie más vende en esta página, así evitamos estafas.",
  },
  {
    q: "¿Por qué solo hasta 10 dólares?",
    a: "Esta página está pensada para dar los primeros pasos en la compra de Bitcoin. Para montos más grandes, consultá en la comunidad.",
  },
  {
    q: "¿Qué necesito antes de comprar?",
    a: "Una billetera Lightning instalada en tu celular, por ejemplo Wallet of Satoshi, Blink, Lemon, etc. Ahí vas a recibir los Sats.",
  },
  {
    q: "¿Cuánto tarda?",
    a: "Unos minutos. El vendedor recibe un aviso, verifica tu pago y te manda los Sats por Lightning al toque. Recordá que somos una comunidad, no una empresa. Podemos demorar un poco en contestar. Paciencia :)",
  },
  {
    q: "No me llegaron los Satoshis",
    a: "Tranqui, quizás no vimos el aviso. Comunicate con la comunidad Club Satoshi, te van a solicitar tu código de operación (por ejemplo, #0005) y el comprobante de tu transferencia. Si ya conocés el número de WhatsApp de alguno de los miembros activos, comunicate directamente con él y te da una mano.",
  },
];

interface FaqProps {
  /** The quote screen shows the questions open; every other screen folds them. */
  folded: boolean;
}

export default function Faq({ folded }: FaqProps) {
  const [open, setOpen] = useState(false);
  const [wasFolded, setWasFolded] = useState(folded);

  // Leaving the quote screen folds the list again, exactly like the original
  // show(), which removed "open" on every screen change.
  if (wasFolded !== folded) {
    setWasFolded(folded);
    if (!folded) setOpen(false);
  }

  const isOpen = folded && open;

  return (
    <section className={`${s.faq} ${folded ? s.folded : ""} ${isOpen ? s.open : ""}`}>
      <h3 className={s.display}>
        <button
          className={s["faq-toggle"]}
          type="button"
          aria-expanded={!folded || isOpen}
          aria-controls="faqList"
          onClick={() => {
            if (!folded) return;
            setOpen((v) => !v);
          }}
        >
          Preguntas frecuentes
        </button>
      </h3>
      <div className={s["faq-list"]} id="faqList">
        {FAQ_ITEMS.map((item) => (
          <details key={item.q}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import { ExternalLink, Zap } from "lucide-react";
import { ALBY_URL, formatSats, haceCuanto, type DonacionPublica } from "@/lib/donaciones";
import { useDonaciones } from "@/lib/useDonaciones";

const VISIBLES = 9;

function Tarjeta({ donacion, ahora }: { donacion: DonacionPublica; ahora: number }) {
  const edad = Math.max(0, ahora - Date.parse(donacion.settled_at));

  return (
    <li className={`flex h-full flex-col rounded-2xl border border-gray-100 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-950 ${donacion.mensaje ? "" : "justify-center"}`}>
      {donacion.mensaje ? (
        <p className="text-sm leading-5 text-secondary dark:text-white">{donacion.mensaje}</p>
      ) : (
        <span className="sr-only">Aporte</span>
      )}
      <p className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-gray-500 dark:text-gray-400 ${donacion.mensaje ? "mt-auto pt-2" : ""}`}>
        <Zap className="h-3.5 w-3.5 fill-primary text-primary" aria-hidden="true" />
        <span className="font-bold tabular-nums text-secondary dark:text-white">
          {formatSats(donacion.sats)} sats
        </span>
        <time dateTime={donacion.settled_at}>{haceCuanto(edad)}</time>
      </p>
    </li>
  );
}

export default function HistorialDonaciones() {
  const state = useDonaciones();
  const [expanded, setExpanded] = useState(false);
  const lista =
    state.status === "ok" && Array.isArray(state.data.donaciones) ? state.data.donaciones : [];
  const visibles = expanded ? lista : lista.slice(0, VISIBLES);

  return (
    <section
      aria-busy={state.status === "loading"}
      className="bg-gray-50 py-20 dark:bg-gray-900"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-8 text-center animate-fade-in">
          <h1 className="mb-6 text-3xl font-bold text-secondary dark:text-white md:text-5xl">
            Aportes de la comunidad
          </h1>
          {state.status === "loading" && (
            <div className="mx-auto mb-6 h-24 w-64 rounded-2xl bg-gray-100 motion-safe:animate-pulse dark:bg-white/5" aria-hidden="true" />
          )}
          {state.status === "ok" && (
            <p className="mb-6 flex flex-col items-center" aria-live="polite">
              <span className="flex items-center gap-3 text-secondary dark:text-white">
                <Zap className="h-8 w-8 fill-primary text-primary md:h-12 md:w-12" aria-hidden="true" />
                <span className="font-heading text-5xl font-bold tabular-nums tracking-tight md:text-7xl">
                  {formatSats(state.data.received_sats)}
                </span>
              </span>
              <span className="mt-1 text-lg font-semibold tracking-wide text-orange-700 dark:text-primary md:text-2xl">
                sats recibidos
              </span>
            </p>
          )}
          <p className="mx-auto max-w-2xl text-xl text-gray-500">
            Cada aporte en sats nos ayuda a sostener Club Satoshi: encuentros, juntadas, materiales y los gastos de la comunidad. Si dejás un mensaje al donar, puede aparecer acá.
          </p>
        </div>

        {state.status === "loading" && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="h-16 rounded-2xl bg-gray-100 motion-safe:animate-pulse dark:bg-white/5" />
            ))}
          </div>
        )}

        {state.status === "ok" && (
          <>
            {lista.length > 0 && (
              <ul aria-label="Historial de aportes" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {visibles.map((donacion) => (
                  <Tarjeta key={donacion.id} donacion={donacion} ahora={state.ahora} />
                ))}
              </ul>
            )}

            {lista.length > VISIBLES && (
              <div className="mt-5 text-center">
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setExpanded((open) => !open)}
                  className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-bold text-secondary transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus-visible:ring-offset-gray-900"
                >
                  {expanded ? "Ver menos" : "Ver más"}
                </button>
              </div>
            )}
          </>
        )}

        <div className="mt-8 text-center">
          <a
            href={ALBY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:focus-visible:ring-offset-gray-900"
          >
            Donar con Lightning
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}

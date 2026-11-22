"use client";

import { useState } from "react";
import { ExternalLink, Zap } from "lucide-react";
import { ALBY_URL, formatSats, haceCuanto, type DonacionPublica } from "@/lib/donaciones";
import { useDonaciones } from "@/lib/useDonaciones";

const VISIBLES = 12;

function Tarjeta({ donacion, ahora }: { donacion: DonacionPublica; ahora: number }) {
  const edad = Math.max(0, ahora - Date.parse(donacion.settled_at));

  return (
    <li className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      {donacion.mensaje && (
        <p className="text-base leading-relaxed text-secondary dark:text-white">“{donacion.mensaje}”</p>
      )}
      <p className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600 dark:text-gray-300 ${donacion.mensaje ? "mt-4" : ""}`}>
        <Zap className="h-4 w-4 fill-primary text-primary" aria-hidden="true" />
        <span className="font-bold tabular-nums text-secondary dark:text-white">
          {formatSats(donacion.sats)} sats
        </span>
        <time dateTime={donacion.settled_at} className="text-gray-500 dark:text-gray-400">
          {haceCuanto(edad)}
        </time>
      </p>
    </li>
  );
}

export default function HistorialDonaciones() {
  const state = useDonaciones();
  const [expanded, setExpanded] = useState(false);
  const lista = state.status === "ok" ? state.data.donaciones : [];
  const visibles = expanded ? lista : lista.slice(0, VISIBLES);

  return (
    <section
      id="donaciones"
      aria-busy={state.status === "loading"}
      className="scroll-mt-24 border-t border-gray-100 bg-gray-50 py-20 dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-12 text-center animate-fade-in">
          <h2 className="mb-4 text-3xl font-bold text-secondary dark:text-white md:text-5xl">
            Aportes de la comunidad
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-gray-500">
            Cada aporte en sats cubre encuentros, materiales e insumos. Si dejás un mensaje al donar, puede aparecer acá.
          </p>
        </div>

        {state.status === "loading" && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="h-36 rounded-2xl bg-gray-100 motion-safe:animate-pulse dark:bg-white/5" />
            ))}
          </div>
        )}

        {state.status === "ok" && (
          <>
            <p className="mb-8 flex items-center justify-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
              <Zap className="h-4 w-4 fill-primary text-primary" aria-hidden="true" />
              <span className="font-bold tabular-nums text-secondary dark:text-white">
                {formatSats(state.data.received_sats)} sats
              </span>
              recibidos
            </p>

            {lista.length > 0 && (
              <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {visibles.map((donacion) => (
                  <Tarjeta key={donacion.id} donacion={donacion} ahora={state.ahora} />
                ))}
              </ul>
            )}

            {lista.length > VISIBLES && (
              <div className="mt-8 text-center">
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setExpanded((open) => !open)}
                  className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-secondary transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus-visible:ring-offset-gray-900"
                >
                  {expanded ? "Ver menos" : "Ver más"}
                </button>
              </div>
            )}
          </>
        )}

        <div className="mt-10 text-center">
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

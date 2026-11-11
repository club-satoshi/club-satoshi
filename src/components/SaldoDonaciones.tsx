"use client";

import { formatSats, haceCuanto } from "@/lib/donaciones";
import { useDonaciones } from "@/lib/useDonaciones";

export default function SaldoDonaciones() {
  const state = useDonaciones();

  if (state.status !== "ok") return null;

  const { data, edad, stale } = state;

  return (
    <div className="mt-4 max-w-md rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-sm md:text-base text-white/90">
      <p>
        Total recibido: <span className="font-bold text-white">{formatSats(data.received_sats)} sats</span>
      </p>
      <p>
        Saldo disponible: <span className="font-bold text-white">{formatSats(data.balance_sats)} sats</span>
      </p>
      <p className="mt-2 text-xs md:text-sm text-white/70">
        Actualizado {haceCuanto(edad)} · Los nuevos aportes pueden demorar en verse reflejados.
      </p>
      {stale && (
        <p className="mt-1 text-xs md:text-sm text-white/70">El dato puede estar desactualizado.</p>
      )}
    </div>
  );
}

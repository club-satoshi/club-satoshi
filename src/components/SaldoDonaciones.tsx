"use client";

import { useEffect, useState } from "react";

const DATA_URL =
  "https://raw.githubusercontent.com/club-satoshi/club-satoshi/donaciones/data/donaciones.json";
const STALE_MS = 3 * 60 * 60 * 1000;

type Donaciones = {
  received_sats: number;
  balance_sats: number;
  checked_at: string;
};

const sats = new Intl.NumberFormat("es-AR");

function parseDonaciones(raw: unknown): Donaciones | null {
  if (!raw || typeof raw !== "object") return null;
  const { received_sats, balance_sats, checked_at } = raw as Record<string, unknown>;
  if (
    !Number.isSafeInteger(received_sats) ||
    !Number.isSafeInteger(balance_sats) ||
    (received_sats as number) < 0 ||
    (balance_sats as number) < 0 ||
    typeof checked_at !== "string" ||
    Number.isNaN(Date.parse(checked_at))
  ) {
    return null;
  }
  return {
    received_sats: received_sats as number,
    balance_sats: balance_sats as number,
    checked_at,
  };
}

function plural(n: number, singular: string, pluralForm: string) {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}

function haceCuanto(ms: number) {
  const minutos = Math.floor(ms / 60_000);
  if (minutos < 1) return "hace instantes";
  if (minutos < 60) return `hace ${plural(minutos, "minuto", "minutos")}`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${plural(horas, "hora", "horas")}`;
  return `hace ${plural(Math.floor(horas / 24), "día", "días")}`;
}

export default function SaldoDonaciones() {
  const [data, setData] = useState<Donaciones | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch(DATA_URL, { cache: "no-store", signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        setData(parseDonaciones(json));
        setNow(Date.now());
      })
      .catch(() => setData(null));

    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, []);

  if (!data || now === 0) return null;

  const edad = Math.max(0, now - Date.parse(data.checked_at));

  return (
    <div className="mt-4 max-w-md rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-sm md:text-base text-white/90">
      <p>
        Total recibido: <span className="font-bold text-white">{sats.format(data.received_sats)} sats</span>
      </p>
      <p>
        Saldo disponible: <span className="font-bold text-white">{sats.format(data.balance_sats)} sats</span>
      </p>
      <p className="mt-2 text-xs md:text-sm text-white/70">Actualizado: {haceCuanto(edad)}</p>
      {edad > STALE_MS && (
        <p className="mt-1 text-xs md:text-sm text-white/70">El dato puede estar desactualizado.</p>
      )}
    </div>
  );
}

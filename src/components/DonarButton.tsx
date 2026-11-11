"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import { ExternalLink, HeartHandshake, Zap } from "lucide-react";
import { ALBY_URL, formatSats, haceCuanto } from "@/lib/donaciones";
import { useDonaciones } from "@/lib/useDonaciones";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function DonarButton({ open, onOpenChange }: Props) {
  const panelId = useId();
  const titleId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const donaciones = useDonaciones(open);

  // Mover el foco al panel solo al abrirlo (no en cada re-render).
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onOpenChange(false);
        triggerRef.current?.focus();
      }
    }
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) onOpenChange(false);
    }

    // Los clics dentro de un iframe (p. ej. el mapa de BTC Map) no disparan
    // pointerdown en este documento, pero sí quitan el foco a la ventana.
    function onWindowBlur() {
      onOpenChange(false);
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("blur", onWindowBlur);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("blur", onWindowBlur);
    };
  }, [open, onOpenChange]);

  return (
    <div ref={rootRef} className="md:relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        className={`group inline-flex items-center gap-1.5 h-9 pl-3 pr-3.5 rounded-full text-sm font-bold ring-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black ${
          open
            ? "bg-primary/20 text-orange-700 ring-primary/50 dark:text-primary"
            : "bg-primary/10 text-orange-700 ring-primary/30 hover:bg-primary/20 hover:ring-primary/50 dark:bg-primary/15 dark:text-primary"
        }`}
      >
        <Zap
          aria-hidden="true"
          className={`w-4 h-4 fill-current ${open ? "" : "motion-safe:animate-zap"}`}
        />
        Donar
      </button>

      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-labelledby={titleId}
          tabIndex={-1}
          className="absolute inset-x-4 top-full mt-2 md:inset-x-auto md:right-0 md:mt-3 md:w-80 rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-xl shadow-black/10 outline-none dark:border-gray-800 dark:bg-gray-950 motion-safe:animate-pop-in"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <HeartHandshake className="w-5 h-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id={titleId} className="text-base font-bold text-secondary dark:text-white">
                Apoyá a Club Satoshi
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                Somos una comunidad voluntaria. Tu aporte en sats cubre eventos, materiales e insumos.
              </p>
            </div>
          </div>

          {donaciones.status === "loading" && (
            <div className="mt-4 h-[3.75rem] rounded-xl bg-gray-100 dark:bg-white/5 motion-safe:animate-pulse" aria-hidden="true" />
          )}
          {donaciones.status === "ok" && (
            <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3 ring-1 ring-gray-100 dark:bg-white/5 dark:ring-white/10">
              <p className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                <Zap className="w-4 h-4 fill-primary text-primary" aria-hidden="true" />
                <span className="font-bold text-secondary dark:text-white tabular-nums">
                  {formatSats(donaciones.data.received_sats)} sats
                </span>
                recibidos
              </p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Datos públicos · actualizado {haceCuanto(donaciones.edad)}
              </p>
            </div>
          )}

          <a
            href={ALBY_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onOpenChange(false)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-950"
          >
            Donar con Lightning
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>
          <Link
            href="/#donar"
            onClick={() => onOpenChange(false)}
            className="mt-3 block text-center text-xs font-medium text-gray-500 underline-offset-2 hover:text-primary hover:underline dark:text-gray-400"
          >
            Ver más sobre las donaciones
          </Link>
        </div>
      )}
    </div>
  );
}

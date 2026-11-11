import { useEffect, useRef, useState } from "react";
import { DATA_URL, STALE_MS, parseDonaciones, type Donaciones } from "./donaciones";

export type DonacionesState =
  | { status: "idle" | "loading" | "error" }
  | { status: "ok"; data: Donaciones; edad: number; stale: boolean };

/**
 * Lee el total de donaciones publicado por el workflow `donaciones`.
 * Con `enabled = false` no hace ningún request (útil para cargar recién
 * cuando el usuario abre el panel). Una vez obtenido el dato, no se vuelve
 * a pedir mientras el componente siga montado.
 */
export function useDonaciones(enabled = true): DonacionesState {
  const [data, setData] = useState<Donaciones | null>(null);
  const [settled, setSettled] = useState(false);
  const [now, setNow] = useState(0);
  const loaded = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();

    if (!loaded.current) {
      fetch(DATA_URL, { cache: "no-store", signal: controller.signal })
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          const parsed = parseDonaciones(json);
          if (parsed) loaded.current = true;
          setData(parsed);
          setNow(Date.now());
          setSettled(true);
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setData(null);
          setSettled(true);
        });
    }

    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [enabled]);

  if (data && now !== 0) {
    const edad = Math.max(0, now - Date.parse(data.checked_at));
    return { status: "ok", data, edad, stale: edad > STALE_MS };
  }
  if (!enabled && !settled) return { status: "idle" };
  return { status: settled ? "error" : "loading" };
}

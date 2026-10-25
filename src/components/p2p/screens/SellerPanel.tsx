"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import s from "../p2p.module.css";
import { sendPush } from "@/lib/p2p/effects";
import type { Tx, Vendor } from "@/lib/p2p/types";
import { fmt, fmtDate, pad } from "@/lib/p2p/utils";
import { available, hasData, reserved, vendorStatus } from "@/lib/p2p/vendors";

interface SellerPanelProps {
  /** false while the store is still being created. */
  ready: boolean;
  myId: string | null;
  isAdmin: boolean;
  vendors: Vendor[];
  authorized: Set<string>;
  allTx: Tx[];
  vendorsLoaded: boolean;
  /** Bumped by the shell when an order is completed, to refill the form. */
  formResetToken: number;
  onLogin: () => Promise<string | null>;
  onLogout: () => void;
  onSaveVendor: (patch: Partial<Vendor>) => Promise<void>;
  onAuthorize: (id: string, granted: boolean) => Promise<void>;
  onOrderAction: (
    n: number,
    act: "recibido" | "vencida" | "rechazar" | "enviado",
  ) => Promise<void>;
}

const ESTADOS: Record<string, { t: string; c: string }> = {
  pendiente: { t: "Esperando verificación", c: "st-pend" },
  recibido: { t: "Pago recibido, falta enviar", c: "st-rec" },
  completada: { t: "Completada", c: "st-ok" },
  rechazada: { t: "Rechazada: no llegó el pago", c: "st-rej" },
  vencida: { t: "Factura vencida, esperando una nueva", c: "st-pend" },
  cancelada: { t: "Cancelada por el comprador", c: "st-rej" },
};

interface FormState {
  nombre: string;
  apellido: string;
  cbu: string;
  alias: string;
  usdt: string;
  ntfy: string;
  liquidez: string;
  desde: string;
  hasta: string;
}

const EMPTY_FORM: FormState = {
  nombre: "",
  apellido: "",
  cbu: "",
  alias: "",
  usdt: "",
  ntfy: "",
  liquidez: "",
  desde: "09:00",
  hasta: "18:00",
};

function validateForm(f: FormState): string | null {
  if (!f.desde || !f.hasta) return "Completá tu horario.";
  if (!(Number(f.liquidez) >= 0) || !Number.isInteger(Number(f.liquidez)))
    return "Los Satoshis disponibles tienen que ser un número entero.";
  if (!f.nombre || !f.apellido)
    return "Completá tu nombre y apellido como figuran en tu cuenta.";
  if (!/^\d{22}$/.test(f.cbu)) return "El CBU o CVU tiene que tener 22 números.";
  if (!/^[a-zA-Z0-9.\-]{6,20}$/.test(f.alias))
    return "El alias tiene que tener entre 6 y 20 caracteres (letras, números, puntos o guiones).";
  if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(f.usdt))
    return "La dirección USDT de Tron empieza con T y tiene 34 caracteres.";
  if (f.ntfy && !/^[A-Za-z0-9_-]{8,64}$/.test(f.ntfy))
    return "El canal de avisos tiene que tener entre 8 y 64 letras, números o guiones, sin espacios.";
  return null;
}

function CopyButton({
  value,
  label,
  className,
}: {
  value: string;
  label: string;
  className?: string;
}) {
  const [done, setDone] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      /* clipboard denied */
    }
    setDone(true);
    window.setTimeout(() => setDone(false), 1500);
  };

  return (
    <button
      className={`${className ?? s.copy} ${done ? s.done : ""}`}
      type="button"
      onClick={copy}
    >
      {done ? "Copiado" : label}
    </button>
  );
}

export default function SellerPanel({
  ready,
  myId,
  isAdmin,
  vendors,
  authorized,
  allTx,
  vendorsLoaded,
  formResetToken,
  onLogin,
  onLogout,
  onSaveVendor,
  onAuthorize,
  onOrderAction,
}: SellerPanelProps) {
  const [formMsg, setFormMsg] = useState("");
  const [formMsgError, setFormMsgError] = useState(false);
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginMsg, setLoginMsg] = useState("");
  const [saveBusy, setSaveBusy] = useState(false);
  const [ntfyBusy, setNtfyBusy] = useState(false);
  const [rejectArm, setRejectArm] = useState<number | null>(null);
  const [acting, setActing] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [histLimit, setHistLimit] = useState(20);
  const [openRows, setOpenRows] = useState<Set<number>>(new Set());

  const formRef = useRef<HTMLFormElement>(null);

  const v = useMemo(
    () => vendors.find((item) => item.id === myId) ?? null,
    [vendors, myId],
  );
  const st = vendorStatus(v, authorized, allTx);

  // Uncontrolled form, like the original: remounting on these changes refills it.
  const formKey = `${myId}|${vendorsLoaded}|${formResetToken}`;
  const fieldValue = (key: keyof FormState): string => {
    const value = ((v || {}) as Record<string, unknown>)[key];
    return value === undefined || value === null ? EMPTY_FORM[key] : String(value);
  };

  useEffect(() => {
    if (rejectArm === null) return;
    const id = window.setTimeout(() => {
      setRejectArm((current) => (current === rejectArm ? null : current));
    }, 8000);
    return () => window.clearTimeout(id);
  }, [rejectArm]);

  const readForm = (): FormState => {
    const elements = formRef.current?.elements;
    const get = (key: keyof FormState) =>
      ((elements?.namedItem(key) as HTMLInputElement | null)?.value || "").trim();
    return {
      nombre: get("nombre"),
      apellido: get("apellido"),
      cbu: get("cbu").replace(/\s/g, ""),
      alias: get("alias"),
      usdt: get("usdt"),
      ntfy: get("ntfy"),
      liquidez: get("liquidez"),
      desde: get("desde"),
      hasta: get("hasta"),
    };
  };

  const showMsg = (text: string, isError: boolean) => {
    setFormMsg(text);
    setFormMsgError(isError);
  };

  const login = async () => {
    setLoginBusy(true);
    const problem = await onLogin();
    setLoginBusy(false);
    setLoginMsg(problem || "");
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const values = readForm();
    const problem = validateForm(values);
    if (problem) {
      showMsg(problem, true);
      return;
    }
    setSaveBusy(true);
    try {
      await onSaveVendor({
        ...values,
        liquidez: Number(values.liquidez) || 0,
        activo: (v || {}).activo ?? false,
      });
      showMsg("Cambios guardados.", false);
    } catch {
      showMsg("No se pudieron guardar los cambios. Probá de nuevo.", true);
    }
    setSaveBusy(false);
  };

  const toggleActive = async (on: boolean) => {
    if (on && !hasData({ ...(v || {}), ...readForm() })) {
      showMsg("Completá y guardá tus datos de cobro antes de activarte.", true);
      return;
    }
    try {
      await onSaveVendor({ activo: on });
    } catch {
      showMsg("No se pudo cambiar tu estado. Probá de nuevo.", true);
    }
  };

  const ntfyField = () =>
    formRef.current?.elements.namedItem("ntfy") as HTMLInputElement | null;

  const generateTopic = async () => {
    const chars = "abcdefghijkmnpqrstuvwxyz23456789";
    const rnd = Array.from(
      crypto.getRandomValues(new Uint8Array(14)),
      (b) => chars[b % chars.length],
    ).join("");
    const topic = "cs-" + rnd;
    const field = ntfyField();
    if (field) field.value = topic;
    try {
      await onSaveVendor({ ntfy: topic });
      showMsg(
        "Canal generado y guardado. Suscribite a ese canal en la app ntfy.",
        false,
      );
    } catch {
      showMsg('Canal generado, pero no se pudo guardar. Tocá "Guardar cambios".', true);
    }
  };

  const testTopic = async () => {
    const topic = (ntfyField()?.value || "").trim();
    if (!topic) {
      showMsg("Primero generá o escribí tu canal de avisos.", true);
      return;
    }
    if (!/^[A-Za-z0-9_-]{8,64}$/.test(topic)) {
      showMsg(
        "El canal de avisos tiene que tener entre 8 y 64 letras, números o guiones, sin espacios.",
        true,
      );
      return;
    }
    setNtfyBusy(true);
    // Buyers use the SAVED channel: if the field differs, save it before testing.
    if ((v || {}).ntfy !== topic) {
      try {
        await onSaveVendor({ ntfy: topic });
      } catch {
        setNtfyBusy(false);
        showMsg("No se pudo guardar el canal. Probá de nuevo.", true);
        return;
      }
    }
    const ok = await sendPush(
      { ntfy: topic },
      "Prueba de Club Satoshi",
      "Si ves esto, los avisos de pedidos te van a llegar al celular.",
    );
    setNtfyBusy(false);
    showMsg(
      ok
        ? "Canal guardado y aviso enviado. Fijate si te llegó al celular."
        : "No se pudo enviar el aviso. Revisá el canal o tu conexión.",
      !ok,
    );
  };

  const act = async (
    n: number,
    action: "recibido" | "vencida" | "rechazar" | "enviado",
  ) => {
    if (action === "rechazar" && rejectArm !== n) {
      setRejectArm(n);
      return;
    }
    if (action === "rechazar") setRejectArm(null);
    // The original disables the button while the update runs: "enviado" also
    // subtracts liquidity, so a double click must not fire twice.
    if (acting !== null) return;
    setActing(n);
    try {
      await onOrderAction(n, action);
    } finally {
      setActing(null);
    }
  };

  const mineOrders = useMemo(
    () =>
      allTx
        .filter(
          (t) =>
            t.vendedorId === myId &&
            ["pendiente", "recibido", "vencida"].includes(t.estado as string),
        )
        .sort((a, b) => a.n - b.n),
    [allTx, myId],
  );

  const historyRows = useMemo(() => {
    const q = search.replace(/\D/g, "");
    let rows = (isAdmin ? allTx : allTx.filter((t) => t.vendedorId === myId))
      .slice()
      .sort((a, b) => b.n - a.n);
    if (q) {
      const padded = q.padStart(Math.min(q.length, 4), "0");
      rows = rows.filter(
        (t) => pad(t.n).includes(padded) || String(t.n) === String(Number(q)),
      );
    }
    return rows;
  }, [allTx, isAdmin, myId, search]);

  const toggleRow = (n: number) => {
    setOpenRows((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  };

  const orderCard = (t: Tx) => {
    const pago =
      t.metodo === "usdt"
        ? `${fmt(t.usdt ?? 0)} USDT por red Tron`
        : `$${fmt(t.ars ?? 0)} por transferencia`;

    if (t.estado === "pendiente") {
      return (
        <div className={s.order} key={t.n}>
          <div className={s["order-head"]}>
            <b>#{pad(t.n)}</b>
            <span>{fmtDate(t.fecha)}</span>
          </div>
          <span className={`${s.tag} ${s.go}`}>
            {t.reclamado ? "El comprador dice que ya transfirió" : "Verificá el pago"}
          </span>
          {t.reclamado && <p>Antes marcaste que no llegó. Revisá de nuevo tu cuenta.</p>}
          <p>
            Te enviaron <b>{pago}</b>.
          </p>
          <p>
            Tenés que enviar <b>{fmt(t.sats)} Sats</b>.
          </p>
          <div className={s.actions}>
            <button
              className={`${s.btn} ${s.dark}`}
              type="button"
              disabled={acting === t.n}
              onClick={() => act(t.n, "recibido")}
            >
              Confirmar que recibí el pago
            </button>
            <button
              className={`${s.btn} ${s.ghost} ${rejectArm === t.n ? s.armed : ""}`}
              type="button"
              disabled={acting === t.n}
              onClick={() => act(t.n, "rechazar")}
            >
              {rejectArm === t.n
                ? "TOCÁ DE NUEVO PARA CONFIRMAR"
                : "No me llegó el pago"}
            </button>
          </div>
        </div>
      );
    }

    if (t.estado === "vencida") {
      return (
        <div className={s.order} key={t.n}>
          <div className={s["order-head"]}>
            <b>#{pad(t.n)}</b>
            <span>{fmtDate(t.fecha)}</span>
          </div>
          <span className={s.tag}>Esperando factura nueva</span>
          <p>
            Le pedimos al comprador una factura nueva por{" "}
            <b>{fmt(t.sats)} Sats</b>. Cuando la envíe, te avisamos y aparece acá.
          </p>
        </div>
      );
    }

    return (
      <div className={s.order} key={t.n}>
        <div className={s["order-head"]}>
          <b>#{pad(t.n)}</b>
          <span>{fmtDate(t.fecha)}</span>
        </div>
        <span className={s.tag}>
          {t.factura_nueva_at ? "Factura nueva recibida" : "Pago recibido"}
        </span>
        <p>
          Pagá esta factura de <b>{fmt(t.sats)} Sats</b> desde tu billetera:
        </p>
        <div className={s.inv}>{t.invoice}</div>
        <div className={s.actions}>
          <CopyButton
            className={s.copy}
            value={t.invoice ?? ""}
            label="Copiar"
          />
          <button
            className={s.btn}
            type="button"
            disabled={acting === t.n}
            onClick={() => act(t.n, "enviado")}
          >
            Ya envié los Sats
          </button>
          <button
            className={`${s.btn} ${s.ghost}`}
            type="button"
            disabled={acting === t.n}
            onClick={() => act(t.n, "vencida")}
          >
            La factura venció
          </button>
        </div>
      </div>
    );
  };

  const historyRow = (t: Tx) => {
    const e = ESTADOS[t.estado as string] || ESTADOS.completada;
    const vendor = vendors.find((item) => item.id === t.vendedorId);
    const pago =
      t.metodo === "usdt"
        ? `${fmt(t.usdt ?? 0)} USDT por red Tron`
        : t.ars
          ? `$${fmt(t.ars)} por transferencia`
          : "—";
    const open = openRows.has(t.n);

    return (
      <details className={s.hrow} key={t.n} open={open}>
        <summary
          onClick={(event) => {
            event.preventDefault();
            toggleRow(t.n);
          }}
        >
          <span className={`${s.hdot} ${s[e.c]}`} aria-hidden="true" />
          <span className={s["tx-code"]}>#{pad(t.n)}</span>
          <span className={s["tx-date"]}>{fmtDate(t.fecha)}</span>
          <span className={s["tx-sats"]}>{fmt(t.sats)} Sats</span>
        </summary>
        {open && (
          <div className={s.hbody}>
            <p>
              <b>Estado:</b> {e.t}
            </p>
            <p>
              <b>Pago:</b> {pago}
            </p>
            {t.comentario && (
              <p>
                <b>Comentario del comprador:</b> “{t.comentario}”
              </p>
            )}
            {isAdmin && (
              <p>
                <b>Vendedor:</b>{" "}
                {vendor
                  ? `${vendor.nombre || ""} ${vendor.apellido || ""}`.trim()
                  : t.vendedorId || "—"}
              </p>
            )}
            {t.invoice ? (
              <>
                <p>
                  <b>Factura Lightning:</b>
                </p>
                <div className={s.inv}>{t.invoice}</div>
                <CopyButton
                  className={s.copy}
                  value={t.invoice}
                  label="Copiar factura"
                />
              </>
            ) : (
              <p>
                <b>Factura Lightning:</b> no registrada
              </p>
            )}
          </div>
        )}
      </details>
    );
  };

  if (!ready) {
    return (
      <section className={`${s.screen} ${s.active} ${s.panel}`} id="s-seller">
        <h2 className={s.display}>Panel de vendedores</h2>
        <p className={s.sub}>
          Indicá tu horario, tu saldo disponible y tus datos de cobro. Acá te van a
          llegar los pedidos.
        </p>
        <div id="sellerRoot">
          <div className={s.notice}>El panel no está disponible en este momento.</div>
        </div>
      </section>
    );
  }

  if (!myId) {
    return (
      <section className={`${s.screen} ${s.active} ${s.panel}`} id="s-seller">
        <h2 className={s.display}>Panel de vendedores</h2>
        <p className={s.sub}>
          Indicá tu horario, tu saldo disponible y tus datos de cobro. Acá te van a
          llegar los pedidos.
        </p>
        <div id="sellerRoot">
          <div className={s.card}>
            <h3>Ingresá con tu cuenta</h3>
            <p>
              Usá tu cuenta de Google. Solo los vendedores habilitados por el
              administrador reciben pedidos.
            </p>
            <button
              className={`${s.btn} ${s.dark}`}
              type="button"
              disabled={loginBusy}
              onClick={login}
            >
              Ingresar con Google
            </button>
            <p className={`${s["form-msg"]} ${s.err}`}>{loginMsg}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`${s.screen} ${s.active} ${s.panel}`} id="s-seller">
      <h2 className={s.display}>Panel de vendedores</h2>
      <p className={s.sub}>
        Indicá tu horario, tu saldo disponible y tus datos de cobro. Acá te van a
        llegar los pedidos.
      </p>

      <div id="sellerRoot">
        {!authorized.has(myId) && (
          <div className={s.notice}>
            Tu cuenta todavía no está habilitada como vendedor. Podés cargar tus
            datos igual; pedile al administrador que te habilite.
            <br />
            <small>
              Tu ID: <code>{myId}</code>
            </small>
          </div>
        )}

        <div className={`${s.card} ${s["status-card"]}`}>
          <div>
            <div className={s.st}>
              <span className={`${s["st-dot"]} ${st.on ? s.on : ""}`} />
              {st.t}
            </div>
            <div className={s["st-sub"]}>{st.s}</div>
          </div>
          <label className={s.switch} aria-label="Estoy activo">
            <input
              type="checkbox"
              checked={!!(v && v.activo)}
              onChange={(event) => toggleActive(event.target.checked)}
            />
            <span />
          </label>
        </div>

        <h3 className={s.display} style={{ fontSize: 20, margin: "24px 0 10px" }}>
          Pedidos
        </h3>
        <div id="ordersList">
          {mineOrders.length === 0 ? (
            <p className={s["tx-empty"]} style={{ border: 0, padding: "0 0 12px" }}>
              No tenés pedidos pendientes. Cuando alguien te pague, aparece acá.
            </p>
          ) : (
            mineOrders.map(orderCard)
          )}
        </div>

        <form key={formKey} ref={formRef} className={s.card} onSubmit={save} noValidate>
          <h3>Disponibilidad</h3>
          <p>Solo vas a recibir pedidos dentro de este horario (hora de Argentina).</p>
          <div className={s.grid2}>
            <div className={s.field}>
              <label htmlFor="f_desde">Desde</label>
              <input
                id="f_desde"
                name="desde"
                type="time"
                required
                defaultValue={fieldValue("desde")}
              />
            </div>
            <div className={s.field}>
              <label htmlFor="f_hasta">Hasta</label>
              <input
                id="f_hasta"
                name="hasta"
                type="time"
                required
                defaultValue={fieldValue("hasta")}
              />
            </div>
          </div>
          <div className={s.field}>
            <label htmlFor="f_liquidez">Satoshis disponibles para vender</label>
            <input
              id="f_liquidez"
              name="liquidez"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              placeholder="Ej: 50000"
              defaultValue={fieldValue("liquidez")}
            />
          </div>
          <p className={s["liq-meta"]}>
            Comprometido en pedidos: {fmt(reserved(allTx, myId))} Sats · Disponible:{" "}
            {fmt(available(v ?? { id: myId }, allTx))} Sats
          </p>

          <h3 style={{ marginTop: 22 }}>Datos de cobro</h3>
          <p>Es donde te van a pagar los compradores antes de que envíes los Sats.</p>
          <div className={s.grid2}>
            <div className={s.field}>
              <label htmlFor="f_nombre">Nombre</label>
              <input
                id="f_nombre"
                name="nombre"
                autoComplete="given-name"
                defaultValue={fieldValue("nombre")}
              />
            </div>
            <div className={s.field}>
              <label htmlFor="f_apellido">Apellido</label>
              <input
                id="f_apellido"
                name="apellido"
                autoComplete="family-name"
                defaultValue={fieldValue("apellido")}
              />
            </div>
          </div>
          <div className={s.field}>
            <label htmlFor="f_cbu">CBU / CVU</label>
            <input
              id="f_cbu"
              name="cbu"
              inputMode="numeric"
              maxLength={22}
              placeholder="22 números"
              defaultValue={fieldValue("cbu")}
            />
          </div>
          <div className={s.field}>
            <label htmlFor="f_alias">Alias</label>
            <input
              id="f_alias"
              name="alias"
              autoCapitalize="none"
              spellCheck={false}
              defaultValue={fieldValue("alias")}
            />
          </div>
          <div className={s.field}>
            <label htmlFor="f_usdt">Dirección USDT (red Tron, TRC-20)</label>
            <input
              id="f_usdt"
              name="usdt"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="Empieza con T"
              defaultValue={fieldValue("usdt")}
            />
            <small>Revisala bien: si está mal, el pago se pierde.</small>
          </div>

          <h3 style={{ marginTop: 22 }}>Avisos en el celular</h3>
          <p>
            Para que te llegue un aviso aunque tengas el celular bloqueado: instalá la
            app gratuita <b>ntfy</b>, tocá &quot;+&quot; y suscribite al canal que
            figura acá abajo. Tratalo como una contraseña: no lo compartas.
          </p>
          <div className={s.field}>
            <label htmlFor="f_ntfy">Tu canal de avisos</label>
            <div className={s["ntfy-row"]}>
              <input
                id="f_ntfy"
                name="ntfy"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="cs-…"
                defaultValue={fieldValue("ntfy")}
              />
              <button
                className={s.copy}
                type="button"
                onClick={generateTopic}
              >
                Generar
              </button>
            </div>
            <small>
              Opcional. Guardá los cambios y después tocá &quot;Probar aviso&quot;.
            </small>
          </div>
          <button
            className={s.btn}
            type="button"
            style={{ marginBottom: 14 }}
            disabled={ntfyBusy}
            onClick={testTopic}
          >
            Probar aviso
          </button>
          <button
            className={`${s.btn} ${s.dark}`}
            type="submit"
            disabled={saveBusy}
          >
            Guardar cambios
          </button>
          <p
            className={`${s["form-msg"]} ${formMsgError ? s.err : s.ok}`}
            role="status"
          >
            {formMsg}
          </p>
        </form>

        <div className={s.card}>
          <h3>Historial de órdenes</h3>
          <p>
            {isAdmin
              ? "Todas las órdenes, con la factura que pegó cada comprador."
              : "Tus órdenes, con la factura que pegó cada comprador."}
          </p>
          <div className={s.field} style={{ marginBottom: 6 }}>
            <input
              type="search"
              inputMode="numeric"
              placeholder="Buscar por código, ej: 0005"
              autoComplete="off"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setHistLimit(20);
              }}
            />
          </div>
          <div id="histList">
            {historyRows.length === 0 ? (
              <p className={s["tx-empty"]} style={{ border: 0 }}>
                {search.replace(/\D/g, "")
                  ? "No hay órdenes con ese código."
                  : "Todavía no hay órdenes."}
              </p>
            ) : (
              historyRows.slice(0, histLimit).map(historyRow)
            )}
          </div>
          {historyRows.length - histLimit > 0 && (
            <button
              className={s.link}
              type="button"
              onClick={() => setHistLimit((n) => n + 20)}
            >
              Ver más ({historyRows.length - histLimit} restantes)
            </button>
          )}
        </div>

        {isAdmin && (
          <div className={s.card}>
            <h3>Administración</h3>
            <p>Habilitá a quién puede vender en la web.</p>
            <div id="adminList">
              {vendors.filter((item) => item.id !== "prueba").length === 0 ? (
                <p className={s["tx-empty"]} style={{ border: 0 }}>
                  Todavía nadie cargó sus datos de vendedor.
                </p>
              ) : (
                vendors
                  .filter((item) => item.id !== "prueba")
                  .map((item) => (
                    <div className={s["admin-row"]} key={item.id}>
                      <div>
                        <b>
                          {item.nombre || "Sin nombre"} {item.apellido || ""}
                        </b>
                        <small>{item.id}</small>
                      </div>
                      <label
                        className={s.switch}
                        aria-label={`Habilitar a ${item.nombre || "vendedor"}`}
                      >
                        <input
                          type="checkbox"
                          checked={authorized.has(item.id)}
                          onChange={(event) =>
                            onAuthorize(item.id, event.target.checked)
                          }
                        />
                        <span />
                      </label>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        <button className={s.link} type="button" onClick={onLogout}>
          Cerrar sesión
        </button>
      </div>
    </section>
  );
}

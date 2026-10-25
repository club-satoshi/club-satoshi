"use client";

import { useEffect, useRef, useState } from "react";
import s from "../p2p.module.css";
import { checkInvoice } from "@/lib/p2p/bolt11";
import type { Tx } from "@/lib/p2p/types";
import { confetti } from "@/lib/p2p/effects";
import { btcFromSats, fmt, pad } from "@/lib/p2p/utils";

interface WaitScreenProps {
  tx: Tx;
  vendorName: string;
  onSentAgain: () => Promise<string | null>;
  onCancel: () => Promise<string | null>;
  onRenew: (invoice: string) => Promise<string | null>;
  onComment: (text: string) => Promise<string | null>;
  onMoreSats: () => void;
}

type StepState = "done" | "now" | "";

function stepsFor(estado: Tx["estado"]): [StepState, StepState] {
  // Only the last two steps change; the first two stay done for the whole flow.
  if (estado === "vencida") return ["done", ""];
  if (estado === "recibido") return ["done", "now"];
  if (estado === "completada") return ["done", "done"];
  if (estado === "rechazada" || estado === "cancelada") return ["", ""];
  // pendiente, or an old order with no estado: same as the original markup.
  return ["now", ""];
}

export default function WaitScreen({
  tx,
  vendorName,
  onSentAgain,
  onCancel,
  onRenew,
  onComment,
  onMoreSats,
}: WaitScreenProps) {
  const [renewValue, setRenewValue] = useState("");
  const [renewError, setRenewError] = useState("");
  const [renewBusy, setRenewBusy] = useState(false);
  const [rejectError, setRejectError] = useState("");
  const [armedFor, setArmedFor] = useState<number | null>(null);
  const [commentValue, setCommentValue] = useState("");
  const [commentMsg, setCommentMsg] = useState("");
  const [commentIsError, setCommentIsError] = useState(false);
  const [commentBusy, setCommentBusy] = useState(false);
  const celebrated = useRef<number | null>(null);

  const estado = tx.estado;
  const name = vendorName || "el vendedor";
  // Arming resets by itself whenever the order leaves the rejected state.
  const cancelArmed = estado === "rechazada" && armedFor === tx.n;

  useEffect(() => {
    if (estado === "completada" && celebrated.current !== tx.n) {
      celebrated.current = tx.n;
      confetti();
    }
  }, [estado, tx.n]);

  const [step2, step3] = stepsFor(estado);

  let icon = "spinner";
  let iconText = "";
  let title: React.ReactNode =
    "Danos unos minutos, ya solicitamos el pago de tus Satoshis";
  let sub = "";
  let showThanks = false;
  let hideOpHint = false;

  if (estado === "vencida") {
    icon = "check";
    iconText = "!";
    title = "Tu factura venció";
    sub = `Generá una nueva por exactamente ${fmt(tx.sats)} Sats (${btcFromSats(
      tx.sats,
    )} BTC) y pegala acá. Tu pago ya está confirmado: no hace falta que transfieras de nuevo.`;
  } else if (estado === "pendiente") {
    title = tx.reclamado
      ? "Le avisamos al vendedor que ya enviaste la transferencia"
      : "Danos unos minutos, ya solicitamos el pago de tus Satoshis";
    sub = tx.reclamado
      ? `${name} va a revisar de nuevo si llegó tu pago.`
      : `Le avisamos a ${name}. Apenas confirme que llegó tu pago, te envía los Sats.`;
  } else if (estado === "recibido") {
    title = "Tu pago llegó, estamos enviando tus Satoshis";
    sub = `${name} confirmó tu pago y te está enviando los Sats.`;
  } else if (estado === "completada") {
    icon = "check";
    iconText = "✓";
    title = (
      <>
        Listo! Tus {fmt(tx.sats)} Sats
        <br />
        fueron enviados!
      </>
    );
    sub = "Revisá tu billetera Lightning";
    showThanks = true;
    hideOpHint = true;
  } else if (estado === "rechazada") {
    icon = "check";
    iconText = "!";
    if (!tx.reclamado) {
      title = "El vendedor informa que el pago no llegó";
      sub = "Por favor, controlá que se haya enviado correctamente.";
    } else {
      title = "No pudimos confirmar tu pago";
      sub = `${name} sigue sin encontrar tu transferencia. Comunicate con la comunidad, informá tu código de operación y adjuntá el comprobante.`;
    }
  } else if (estado === "cancelada") {
    icon = "check";
    iconText = "×";
    title = "Cancelaste la operación";
    sub =
      "Si ya habías transferido, comunicate con la comunidad Club Satoshi con tu código de operación y el comprobante.";
  }

  const sub0 =
    tx.metodo === "usdt"
      ? `Enviaste ${fmt(tx.usdt ?? 0)} USDT`
      : `$${fmt(tx.ars ?? 0)} ARS`;
  const sub1 = `${fmt(tx.sats)} Sats`;
  const sub2 = ["recibido", "vencida", "completada"].includes(estado as string)
    ? "Recibido"
    : "";
  const sub3 =
    estado === "completada" ? "Revisá tu billetera Lightning" : "";

  const sendAgain = async () => {
    setRejectError("");
    const problem = await onSentAgain();
    if (problem) setRejectError(problem);
  };

  const cancelOp = async () => {
    if (!cancelArmed) {
      setArmedFor(tx.n);
      return;
    }
    setArmedFor(null);
    setRejectError("");
    const problem = await onCancel();
    if (problem) setRejectError(problem);
  };

  const renew = async () => {
    const problem = checkInvoice(renewValue, tx.sats);
    setRenewError(problem || "");
    if (problem) return;
    setRenewBusy(true);
    const failure = await onRenew(renewValue);
    setRenewBusy(false);
    if (failure) {
      setRenewError(failure);
      return;
    }
    setRenewValue("");
  };

  const sendComment = async () => {
    const text = commentValue.trim();
    if (!text) {
      setCommentMsg("Escribí algo antes de enviar.");
      setCommentIsError(true);
      return;
    }
    setCommentBusy(true);
    const problem = await onComment(text.slice(0, 50));
    setCommentBusy(false);
    if (problem) {
      setCommentMsg(problem);
      setCommentIsError(true);
      return;
    }
    setCommentMsg("");
    setCommentIsError(false);
  };

  const renderStep = (
    index: number,
    state: StepState,
    label: string,
    stepSub: string,
  ) => (
    <li className={s[state] || undefined} key={index}>
      <span className={s.dot}>{state === "done" ? "✓" : ""}</span>
      <span className={s["step-txt"]}>
        {label}
        <small className={s["step-sub"]}>{stepSub}</small>
      </span>
    </li>
  );

  return (
    <section className={`${s.screen} ${s.active}`} id="s-wait">
      <div className={s.status}>
        <div className={s[icon]} id="statusIcon">
          {iconText}
        </div>
        <h2 className={s.display}>{title}</h2>
        <p className={s.sub}>{sub}</p>

        <div className={s.opcode}>
          <small>Tu código de operación</small>
          <b>#{pad(tx.n)}</b>
          {!hideOpHint && (
            <span>
              Guardalo: lo vas a necesitar si tenés algún problema con tu compra.
            </span>
          )}
        </div>

        {estado === "vencida" && (
          <div className={`${s.field} ${s.renew}`}>
            <label htmlFor="renewInvoice">Nueva factura Lightning</label>
            <textarea
              id="renewInvoice"
              rows={4}
              placeholder="lnbc..."
              autoComplete="off"
              spellCheck={false}
              value={renewValue}
              onChange={(event) => {
                setRenewValue(event.target.value);
                if (renewError) setRenewError("");
              }}
            />
            <p className={s["inv-err"]} role="alert">
              {renewError}
            </p>
            <button
              className={`${s.btn} ${s.dark}`}
              type="button"
              disabled={renewBusy}
              onClick={renew}
            >
              Enviar nueva factura
            </button>
          </div>
        )}

        {estado === "rechazada" && (
          <div className={s["reject-box"]}>
            {!tx.reclamado && (
              <button className={`${s.btn} ${s.dark}`} type="button" onClick={sendAgain}>
                Transferencia enviada
              </button>
            )}
            <button
              className={`${s.btn} ${s.ghost} ${cancelArmed ? s.armed : ""}`}
              type="button"
              onClick={cancelOp}
            >
              {cancelArmed ? "Tocá de nuevo para confirmar" : "Cancelar operación"}
            </button>
            <p className={s["inv-err"]} role="alert">
              {rejectError}
            </p>
          </div>
        )}

        <ol className={s.steps}>
          {renderStep(0, "done", "Avisaste del pago.", sub0)}
          {renderStep(1, "done", "Enviaste tu factura Lightning.", sub1)}
          {renderStep(2, step2, "El vendedor verifica el pago.", sub2)}
          {renderStep(3, step3, "Se envían los Sats.", sub3)}
        </ol>

        {showThanks && (
          <div className={s.thanks}>
            {!tx.comentario ? (
              <div className={s.comment}>
                <label htmlFor="commentText">
                  Dejanos un comentario buena onda :)
                </label>
                <textarea
                  id="commentText"
                  rows={2}
                  maxLength={50}
                  placeholder="¿Cómo te fue con tu compra?"
                  value={commentValue}
                  onChange={(event) => {
                    setCommentValue(event.target.value);
                    if (commentMsg) {
                      setCommentMsg("");
                      setCommentIsError(false);
                    }
                  }}
                />
                <p className={s["comment-note"]}>
                  &gt; Este comentario se mostrará en la web.
                </p>
                <div className={s["comment-foot"]}>
                  <span>{commentValue.length}/50</span>
                  <button
                    className={`${s.btn} ${s["comment-btn"]}`}
                    type="button"
                    disabled={commentBusy}
                    onClick={sendComment}
                  >
                    Enviar
                  </button>
                </div>
                <p
                  className={`${s["form-msg"]} ${commentIsError ? s.err : ""}`}
                  role="status"
                >
                  {commentMsg}
                </p>
              </div>
            ) : (
              <div className={s["comment-done"]}>
                <p>Gracias por tu comentario! 🧡</p>
                <button
                  className={`${s.btn} ${s["more-btn"]}`}
                  type="button"
                  onClick={onMoreSats}
                >
                  Quiero más Satoshis!
                </button>
              </div>
            )}
            <p>Seguinos en nuestras redes</p>
            <div className={s.socials}>
              <a
                className={s.social}
                href="https://www.instagram.com/club.satoshi/"
                target="_blank"
                rel="noopener"
              >
                Instagram
              </a>
              <a
                className={s.social}
                href="https://x.com/ClubSatoshi_"
                target="_blank"
                rel="noopener"
              >
                X
              </a>
              <a
                className={s.social}
                href="https://www.youtube.com/@Club.Satoshi"
                target="_blank"
                rel="noopener"
              >
                YouTube
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

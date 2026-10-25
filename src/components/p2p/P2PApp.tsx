"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import s from "./p2p.module.css";
import Faq from "./Faq";
import AmountScreen from "./screens/AmountScreen";
import HomeScreen from "./screens/HomeScreen";
import InvoiceScreen from "./screens/InvoiceScreen";
import PayScreen from "./screens/PayScreen";
import SellerPanel from "./screens/SellerPanel";
import WaitScreen from "./screens/WaitScreen";
import {
  ADMIN_EMAILS,
  BLUE_RECARGO,
  DEFAULT_BTC_USD,
  DEFAULT_DOLAR_BLUE,
  MODO_PRUEBA,
  ORDER_KEY,
  PANEL_SECRETO,
  QUOTE_SECONDS,
  SPREAD,
} from "@/lib/p2p/config";
import { sendPush, beep } from "@/lib/p2p/effects";
import { createFirebaseStore, createLocalStore } from "@/lib/p2p/store";
import type { FirebaseAuthLike, FirebaseLike } from "@/lib/p2p/store";
import type { Method, P2PStore, Screen, Tx, Vendor } from "@/lib/p2p/types";
import { btcFromSats, fmt, pad } from "@/lib/p2p/utils";
import {
  eligibleVendors,
  hasData,
  onlineVendors,
  pickSeller,
  withTest,
} from "@/lib/p2p/vendors";

function rememberOrder(n: number | null) {
  try {
    if (n) localStorage.setItem(ORDER_KEY, String(n));
    else localStorage.removeItem(ORDER_KEY);
  } catch {
    /* private mode */
  }
}

export default function P2PApp() {
  const [screen, setScreen] = useState<Screen>("home");
  const [amount, setAmount] = useState(1);
  const [method, setMethod] = useState<Method>("cbu");
  const [seller, setSeller] = useState<Vendor | null>(null);
  const [lock, setLock] = useState({ sats: 0, ars: 0 });
  const [tx, setTx] = useState<Tx | null>(null);
  const [txN, setTxN] = useState<number | null>(null);
  const [btcUsd, setBtcUsd] = useState(DEFAULT_BTC_USD);
  const [dolarBlue, setDolarBlue] = useState(DEFAULT_DOLAR_BLUE);
  const [secsLeft, setSecsLeft] = useState(QUOTE_SECONDS);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [authorized, setAuthorized] = useState<Set<string>>(
    () => new Set(MODO_PRUEBA ? ["prueba"] : []),
  );
  const [allTx, setAllTx] = useState<Tx[]>([]);
  const [vendorsLoaded, setVendorsLoaded] = useState(false);
  const [ready, setReady] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [alert, setAlert] = useState("");
  const [formResetToken, setFormResetToken] = useState(0);
  const [hidden, setHidden] = useState(false);

  const storeRef = useRef<P2PStore | null>(null);
  const firebaseRef = useRef<FirebaseLike | null>(null);
  const authRef = useRef<FirebaseAuthLike | null>(null);
  const adminTopicRef = useRef<string | null>(null);
  const alertTimerRef = useRef<number | null>(null);
  const seenOrdersRef = useRef<Set<string> | null>(null);
  const seenRenewRef = useRef<Set<string> | null>(null);
  const vendorsRef = useRef<Vendor[]>([]);
  const myIdRef = useRef<string | null>(null);
  const isAdminRef = useRef(false);
  const screenRef = useRef<Screen>("home");

  vendorsRef.current = vendors;
  myIdRef.current = myId;
  isAdminRef.current = isAdmin;
  screenRef.current = screen;

  const rate = `1 BTC ≈ US$ ${fmt(btcUsd)}`;

  const alertBar = useCallback((text: string) => {
    setAlert(text);
    if (alertTimerRef.current) window.clearTimeout(alertTimerRef.current);
    alertTimerRef.current = window.setTimeout(() => setAlert(""), 6000);
  }, []);

  const show = useCallback((id: Screen, orderN: number | null = null) => {
    setScreen(id);
    window.scrollTo({ top: 0 });
    // The open order is remembered so a refresh returns to the same screen.
    rememberOrder(id === "wait" ? orderN : null);
  }, []);

  const openOrder = useCallback((n: number, data: Tx) => {
    setTxN(n);
    setTx(data);
    show("wait", n);
  }, [show]);

  // "Volver a la web": the seller panel is entered by hash only.
  const backToWeb = useCallback(() => {
    if (window.location.hash) {
      try {
        history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search,
        );
      } catch {
        /* ignore */
      }
    }
    show("home");
  }, [show]);

  const refreshQuote = useCallback(async () => {
    let quote: { btc: number; blue: number } | null = null;
    try {
      const [b, c] = await Promise.all([
        fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT").then((r) =>
          r.json(),
        ),
        fetch("https://criptoya.com/api/dolar").then((r) => r.json()),
      ]);
      const btc = Number(b && b.price);
      const blue = Number(c && c.blue && (c.blue.ask ?? c.blue.venta));
      if (!(btc > 0 && blue > 0)) throw new Error("Cotización incompleta");
      quote = { btc, blue };
    } catch {
      /* no direct access: use the stored quote */
    }

    const store = storeRef.current;
    if (!quote && store) {
      try {
        const snap = await store.doc("meta/cotizacion").get();
        const d = snap.exists ? snap.data() : null;
        if (d && Number(d.btc_usd) > 0 && Number(d.dolar_blue) > 0) {
          quote = { btc: Number(d.btc_usd), blue: Number(d.dolar_blue) };
        }
      } catch (error) {
        console.error("No se pudo leer la cotización guardada", error);
      }
    }

    if (quote) {
      setBtcUsd(quote.btc);
      setDolarBlue(quote.blue);
    }
  }, []);

  // Store, subscriptions and auth. Runs once.
  useEffect(() => {
    let disposed = false;
    const unsubs: (() => void)[] = [];

    const start = async () => {
      let store: P2PStore | null = null;
      let auth: FirebaseAuthLike | null = null;
      let firebase: FirebaseLike | null = null;

      if (MODO_PRUEBA) {
        store = createLocalStore();
      } else {
        try {
          const created = await createFirebaseStore();
          store = created.store;
          auth = created.auth;
          firebase = created.firebase;
        } catch (error) {
          // Same as the original: without the database the app stays read-only.
          console.error("No se pudo conectar la base de datos", error);
          store = null;
        }
      }

      if (disposed) return;

      storeRef.current = store;
      firebaseRef.current = firebase;
      authRef.current = auth;
      setReady(true);
      await refreshQuote();

      if (!store) {
        setVendorsLoaded(true);
        setHidden(false);
        return;
      }

      unsubs.push(
        store.doc("meta/admin").onSnapshot((snap) => {
          adminTopicRef.current = snap.exists
            ? ((snap.data()?.ntfy as string) || null)
            : null;
        }),
      );

      unsubs.push(
        store.collection("vendedores").onSnapshot(
          (snap) => {
            setVendors(withTest(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Vendor[]));
            setVendorsLoaded(true);
          },
          () => setVendorsLoaded(true),
        ),
      );

      unsubs.push(
        store.collection("autorizados").onSnapshot((snap) => {
          const ids = new Set(snap.docs.map((d) => d.id));
          if (MODO_PRUEBA) ids.add("prueba");
          setAuthorized(ids);
        }),
      );

      unsubs.push(
        store.collection("transacciones").orderBy("n", "desc").limit(500).onSnapshot(
          (snap) => setAllTx(snap.docs.map((d) => d.data() as unknown as Tx)),
          (error) => console.error(error),
        ),
      );

      if (auth) {
        unsubs.push(
          auth.onAuthStateChanged((u) => {
            setMyId(u ? u.uid : null);
            setIsAdmin(
              !!(
                u &&
                u.email &&
                ADMIN_EMAILS.map((x) => x.toLowerCase()).includes(
                  String(u.email).toLowerCase(),
                )
              ),
            );
            seenOrdersRef.current = null;
            seenRenewRef.current = null;
          }),
        );
      } else if (MODO_PRUEBA) {
        // Local store (demo): the original signs in a fake vendor and grants admin.
        setMyId("vendedor-demo");
        setIsAdmin(true);
      }

      // Restore an open order, unless the seller panel was requested by hash.
      if (window.location.hash === "#" + PANEL_SECRETO) {
        setHidden(false);
        show("seller");
        return;
      }

      let restored = 0;
      try {
        restored = Number(localStorage.getItem(ORDER_KEY)) || 0;
      } catch {
        restored = 0;
      }

      if (!restored) {
        setHidden(false);
        return;
      }

      setHidden(true); // avoid flashing the landing screen before the order loads
      const reveal = window.setTimeout(() => setHidden(false), 3000);
      try {
        const snap = await store.doc("transacciones/" + pad(restored)).get();
        if (snap.exists) openOrder(restored, snap.data() as unknown as Tx);
        else rememberOrder(null);
      } catch {
        /* keep the landing screen */
      } finally {
        window.clearTimeout(reveal);
        setHidden(false);
      }
    };

    void start();

    return () => {
      disposed = true;
      unsubs.forEach((fn) => {
        try {
          fn();
        } catch {
          /* ignore */
        }
      });
    };
  }, [openOrder, refreshQuote, show]);

  // Quote countdown: one tick per second, refresh every 60.
  useEffect(() => {
    const id = window.setInterval(() => {
      setSecsLeft((current) => {
        if (current <= 1) {
          void refreshQuote();
          return QUOTE_SECONDS;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [refreshQuote]);

  // Live order subscription.
  useEffect(() => {
    const store = storeRef.current;
    if (!ready || !store || txN === null) return;
    const ref = store.doc("transacciones/" + pad(txN));
    return ref.onSnapshot((snap) => {
      if (snap.exists) setTx(snap.data() as unknown as Tx);
    });
  }, [ready, txN]);

  // Notifications for new orders and renewed invoices (seller side).
  useEffect(() => {
    if (!myId) return;
    const renewed = allTx
      .filter(
        (t) => t.vendedorId === myId && t.estado === "recibido" && t.factura_nueva_at,
      )
      .map((t) => t.n + "|" + t.factura_nueva_at);
    if (seenRenewRef.current === null) {
      seenRenewRef.current = new Set(renewed);
    } else {
      const fresh = renewed.filter((k) => !seenRenewRef.current!.has(k));
      fresh.forEach((k) => seenRenewRef.current!.add(k));
      if (fresh.length) {
        alertBar(
          `Pedido #${pad(Number(fresh[0].split("|")[0]))}: el comprador envió una factura nueva`,
        );
        beep();
        try {
          navigator.vibrate?.([200, 100, 200]);
        } catch {
          /* unsupported */
        }
      }
    }

    const pending = allTx
      .filter((t) => t.vendedorId === myId && t.estado === "pendiente")
      .map((t) => t.n + "|" + (t.reclamo_at || ""));
    if (seenOrdersRef.current === null) {
      seenOrdersRef.current = new Set(pending);
      return;
    }
    const fresh = pending.filter((k) => !seenOrdersRef.current!.has(k));
    pending.forEach((k) => seenOrdersRef.current!.add(k));
    if (!fresh.length) return;

    const t = allTx.find((x) => x.n === Number(fresh[0].split("|")[0]));
    if (!t) return;
    if (t.reclamo_at) {
      alertBar(`Pedido #${pad(t.n)}: el comprador dice que ya transfirió`);
      beep();
      try {
        navigator.vibrate?.([200, 100, 200]);
      } catch {
        /* unsupported */
      }
      return;
    }
    const pago =
      t.metodo === "usdt" ? `${fmt(t.usdt ?? 0)} USDT` : `$${fmt(t.ars ?? 0)}`;
    alertBar(`Nuevo pedido #${pad(t.n)}: te enviaron ${pago} por ${fmt(t.sats)} Sats`);
    try {
      navigator.vibrate?.([200, 100, 200]);
    } catch {
      /* unsupported */
    }
    beep();
    if (screenRef.current !== "seller") show("seller");
  }, [allTx, myId, alertBar, show]);

  // Hash entry point for the seller panel.
  useEffect(() => {
    const onHash = () => {
      if (window.location.hash === "#" + PANEL_SECRETO) show("seller");
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [show]);

  // The admin's own ntfy channel is where new-vendor notices are sent.
  const myNtfy = myId
    ? vendors.find((item) => item.id === myId)?.ntfy || null
    : null;
  useEffect(() => {
    const store = storeRef.current;
    if (!ready || !isAdmin || !store || !myNtfy) return;
    if (adminTopicRef.current === myNtfy) return;
    // Set it now so the snapshot echo does not trigger another write.
    adminTopicRef.current = myNtfy;
    store.doc("meta/admin").set({ ntfy: myNtfy }).catch(() => {
      adminTopicRef.current = null;
    });
  }, [ready, isAdmin, myNtfy]);

  const onlineCount = onlineVendors(vendors, authorized).length;
  const hasEligibleFor = (sats: number) =>
    eligibleVendors(vendors, authorized, allTx, sats).length > 0;

  const buy = async () => {
    const store = storeRef.current;
    if (!store) return;
    const nextLock = {
      sats: Math.floor((amount / btcUsd) * 1e8),
      ars: Math.ceil(amount * dolarBlue * (1 + BLUE_RECARGO) * (1 + SPREAD)),
    };
    setLock(nextLock);
    const picked = await pickSeller(store, vendors, authorized, allTx, nextLock.sats);
    if (!picked) return;
    setSeller(picked);
    show("pay");
  };

  const sendInvoice = async (raw: string): Promise<string | null> => {
    const store = storeRef.current;
    if (!store || !seller) return "No pudimos registrar la operación. Intentá de nuevo en unos segundos.";
    const invoice = raw.trim().replace(/^lightning:/i, "");
    try {
      const n = await store.nextCode((code) => ({
        n: code,
        fecha: new Date().toISOString(),
        estado: "pendiente",
        sats: lock.sats,
        vendedorId: seller.id,
        metodo: method,
        ars: lock.ars,
        usdt: amount,
        invoice,
      }));

      const pagoAviso =
        method === "usdt"
          ? `${amount} USDT por red Tron`
          : `$${fmt(lock.ars)} por transferencia`;
      void sendPush(
        seller,
        `Nuevo pedido #${pad(n)}`,
        `Te enviaron ${pagoAviso}. Tenés que enviar ${fmt(lock.sats)} Sats.`,
      );

      openOrder(n, {
        n,
        fecha: new Date().toISOString(),
        estado: "pendiente",
        sats: lock.sats,
        vendedorId: seller.id,
        metodo: method,
        ars: lock.ars,
        usdt: amount,
        invoice,
      });

      // Test mode: the fake vendor confirms payment and delivery on its own.
      if (seller.id === "prueba") {
        const ref = store.doc("transacciones/" + pad(n));
        window.setTimeout(() => {
          ref
            .update({ estado: "recibido", recibido_at: new Date().toISOString() })
            .catch(() => {});
        }, 4000);
        window.setTimeout(() => {
          ref
            .update({ estado: "completada", completada: new Date().toISOString() })
            .catch(() => {});
        }, 8000);
      }

      return null;
    } catch (error) {
      console.error("Error creando la operación", error);
      return "No pudimos registrar la operación. Intentá de nuevo en unos segundos.";
    }
  };

  const trackOrder = async (code: string): Promise<string | null> => {
    const store = storeRef.current;
    if (!store) return "No pudimos buscar tu pedido en este momento.";
    const n = Number(code);
    if (!n) return "Escribí el código de tu pedido, por ejemplo 0005.";
    try {
      const snap = await store.doc("transacciones/" + pad(n)).get();
      if (!snap.exists) return "No encontramos un pedido con ese código.";
      openOrder(n, snap.data() as unknown as Tx);
      return null;
    } catch {
      return "No pudimos buscar tu pedido. Probá de nuevo.";
    }
  };

  const orderAction = async (
    n: number,
    act: "recibido" | "vencida" | "rechazar" | "enviado",
  ) => {
    const store = storeRef.current;
    if (!store) return;
    const ref = store.doc("transacciones/" + pad(n));
    const current = allTx.find((x) => x.n === n);
    try {
      if (act === "recibido") {
        await ref.update({ estado: "recibido", recibido_at: new Date().toISOString() });
      }
      if (act === "vencida") {
        await ref.update({ estado: "vencida", vencida_at: new Date().toISOString() });
      }
      if (act === "rechazar") {
        await ref.update({ estado: "rechazada", rechazada_at: new Date().toISOString() });
      }
      if (act === "enviado" && current) {
        await ref.update({
          estado: "completada",
          completada: new Date().toISOString(),
        });
        const vendor = vendorsRef.current.find((v) => v.id === myIdRef.current);
        if (vendor) {
          await saveVendor({
            liquidez: Math.max(0, (Number(vendor.liquidez) || 0) - (current.sats || 0)),
          });
        }
        setFormResetToken((value) => value + 1);
      }
    } catch {
      alertBar("No se pudo actualizar el pedido. Probá de nuevo.");
    }
  };

  const saveVendor = async (patch: Partial<Vendor>) => {
    const store = storeRef.current;
    const id = myIdRef.current;
    if (!store || !id) return;
    const base = { ...(vendorsRef.current.find((v) => v.id === id) || {}) };
    delete base.id;
    const next = { ...base, ...patch, actualizado: new Date().toISOString() };
    await store.doc("vendedores/" + id).set(next);
    // A new vendor filling their data for the first time: tell the admin.
    if (
      !isAdminRef.current &&
      !hasData(base) &&
      hasData(next) &&
      adminTopicRef.current
    ) {
      void sendPush(
        { ntfy: adminTopicRef.current },
        "Nuevo vendedor",
        `${next.nombre} ${next.apellido} cargó sus datos de vendedor. Entrá a Administración para revisarlo y habilitarlo.`,
      );
    }
  };

  const login = async (): Promise<string | null> => {
    const firebase = firebaseRef.current;
    const auth = authRef.current;
    if (!firebase || !auth) return "No se pudo ingresar. Probá de nuevo.";
    try {
      await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
      return null;
    } catch {
      return "No se pudo ingresar. Probá de nuevo.";
    }
  };

  const authorize = async (id: string, granted: boolean) => {
    const store = storeRef.current;
    if (!store) return;
    try {
      if (granted) {
        await store
          .doc("autorizados/" + id)
          .set({ habilitado: true, fecha: new Date().toISOString() });
      } else {
        await store.doc("autorizados/" + id).delete();
      }
    } catch {
      alertBar("No tenés permiso para cambiar esto.");
    }
  };

  const renewInvoice = async (raw: string): Promise<string | null> => {
    const store = storeRef.current;
    if (!store || txN === null || !tx) return "No pudimos enviar la factura. Probá de nuevo.";
    try {
      await store.doc("transacciones/" + pad(txN)).update({
        invoice: raw.trim().replace(/^lightning:/i, ""),
        estado: "recibido",
        factura_nueva_at: new Date().toISOString(),
      });
      const vendor = vendors.find((v) => v.id === tx.vendedorId);
      void sendPush(
        vendor,
        `Factura nueva #${pad(txN)}`,
        "El comprador envió una factura nueva. Ya podés pagarla.",
      );
      return null;
    } catch {
      return "No pudimos enviar la factura. Probá de nuevo.";
    }
  };

  const sentAgain = async (): Promise<string | null> => {
    const store = storeRef.current;
    if (!store || txN === null) return null;
    try {
      await store.doc("transacciones/" + pad(txN)).update({
        estado: "pendiente",
        reclamado: true,
        reclamo_at: new Date().toISOString(),
      });
      const current = allTx.find((x) => x.n === txN);
      const vendor = current && vendors.find((v) => v.id === current.vendedorId);
      void sendPush(
        vendor,
        `Revisá de nuevo #${pad(txN)}`,
        "El comprador dice que la transferencia fue enviada. Verificá el pago otra vez.",
      );
      return null;
    } catch {
      return "No pudimos enviar el aviso. Probá de nuevo.";
    }
  };

  const cancelOrder = async (): Promise<string | null> => {
    const store = storeRef.current;
    if (!store || txN === null) return null;
    try {
      await store.doc("transacciones/" + pad(txN)).update({
        estado: "cancelada",
        cancelada_at: new Date().toISOString(),
      });
      return null;
    } catch {
      return "No pudimos cancelar la operación. Probá de nuevo.";
    }
  };

  const comment = async (text: string): Promise<string | null> => {
    const store = storeRef.current;
    if (!store || txN === null) return null;
    try {
      await store.doc("transacciones/" + pad(txN)).update({
        comentario: text.slice(0, 50),
        comentario_at: new Date().toISOString(),
      });
      return null;
    } catch {
      return "No pudimos enviar tu comentario. Probá de nuevo.";
    }
  };

  const moreSats = () => {
    setTxN(null);
    setTx(null);
    show("amount");
  };

  const vendorName =
    (tx && vendors.find((v) => v.id === tx.vendedorId)?.nombre) || "el vendedor";

  return (
    <div
      className={`${s.root} ${screen === "home" ? s.homeMode : ""} ${
        screen === "seller" ? s.sellerMode : ""
      }`}
      style={hidden ? { visibility: "hidden" } : undefined}
    >
      <header>
        <div className={s["header-meta"]} style={{ marginLeft: "auto" }}>
          <span className={s.rate}>{rate}</span>
          <span className={`${s.online} ${onlineCount === 0 ? s.off : ""}`}>
            {onlineCount === 0
              ? "Sin vendedores online"
              : onlineCount === 1
                ? "1 vendedor online"
                : `${onlineCount} vendedores online`}
          </span>
        </div>
      </header>

      <main>
        {screen === "home" && (
          <HomeScreen onStart={() => show("amount")} onTrack={trackOrder} />
        )}

        {screen === "amount" && (
          <AmountScreen
            amount={amount}
            onAmountChange={setAmount}
            btcUsd={btcUsd}
            dolarBlue={dolarBlue}
            secsLeft={secsLeft}
            vendorsLoaded={vendorsLoaded}
            storeReady={ready && !!storeRef.current}
            onlineCount={onlineCount}
            hasEligibleFor={hasEligibleFor}
            onBuy={buy}
            txs={
              ready
                ? allTx.filter((t) => !t.estado || t.estado === "completada")
                : null
            }
          />
        )}

        {screen === "pay" && (
          <PayScreen
            seller={seller}
            method={method}
            onMethod={setMethod}
            lock={lock}
            amount={amount}
            satsText={`${fmt(lock.sats)} Sats (${btcFromSats(lock.sats)} BTC)`}
            onPaid={() => show("invoice")}
            onBack={() => show("amount")}
          />
        )}

        {screen === "invoice" && (
          <InvoiceScreen
            satsText={`${fmt(lock.sats)} Sats (${btcFromSats(lock.sats)} BTC)`}
            lockSats={lock.sats}
            onSend={sendInvoice}
          />
        )}

        {screen === "wait" && tx && (
          <WaitScreen
            tx={tx}
            vendorName={vendorName}
            onSentAgain={sentAgain}
            onCancel={cancelOrder}
            onRenew={renewInvoice}
            onComment={comment}
            onMoreSats={moreSats}
          />
        )}

        {screen === "seller" && (
          <SellerPanel
            ready={ready && !!storeRef.current}
            myId={myId}
            isAdmin={isAdmin}
            vendors={vendors}
            authorized={authorized}
            allTx={allTx}
            vendorsLoaded={vendorsLoaded}
            formResetToken={formResetToken}
            onLogin={login}
            onLogout={() => {
              void authRef.current?.signOut();
            }}
            onSaveVendor={saveVendor}
            onAuthorize={authorize}
            onOrderAction={orderAction}
          />
        )}
      </main>

      <Faq folded={screen !== "amount"} />

      {screen === "seller" && (
        <footer>
          <button className={s["seller-link"]} type="button" onClick={backToWeb}>
            Volver a la web
          </button>
        </footer>
      )}

      <div className={s["alert-bar"]} role="status" hidden={!alert}>
        {alert}
      </div>
    </div>
  );
}

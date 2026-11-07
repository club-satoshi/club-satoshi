import type { Vendor } from "./types";

/**
 * Ported verbatim from the original index.html (project csp2p-609d0).
 * These are public client-side Firebase credentials by design; they are not secrets.
 */
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDhALbQPrO-IVwdcQaR7_wv6E5XtCZpSIQ",
  authDomain: "csp2p-609d0.firebaseapp.com",
  projectId: "csp2p-609d0",
  storageBucket: "csp2p-609d0.firebasestorage.app",
  messagingSenderId: "371786920815",
  appId: "1:371786920815:web:a0d3595d5de42496382e9a",
};

/** Must match firestore.rules. */
export const ADMIN_EMAILS = ["diegocorreadg@gmail.com"];

export const BLUE_RECARGO = 0.03;
export const SPREAD = 0.0;
export const TZ = "America/Argentina/Buenos_Aires";

export const DEFAULT_BTC_USD = 100000;
export const DEFAULT_DOLAR_BLUE = 1200;

export const QUOTE_SECONDS = 60;
export const ROTAR_CADA_MS = 3500;
export const ROW_H = 48;
export const PAY_REEL_H = 52;

export const ORDER_KEY = "cs_pedido_activo";

/** Kept at false, exactly as the original ships it. */
export const MODO_PRUEBA = false;

export const VENDEDOR_PRUEBA: Vendor = {
  id: "prueba",
  nombre: "Vendedor",
  apellido: "Prueba",
  cbu: "0000003100012345678901",
  alias: "club.satoshi.prueba",
  usdt: "TPrueba1111111111111111111111111",
  liquidez: 1e9,
  desde: "00:00",
  hasta: "00:00",
  activo: true,
};

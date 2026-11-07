import type { Metadata } from "next";
import P2PApp from "@/components/p2p/P2PApp";

export const metadata: Metadata = {
  title: "P2P | Club Satoshi",
  description:
    "Comprá entre 1 y 10 dólares en satoshis a vendedores del Club Satoshi, con Pesos o USDT.",
  // Accesible solo por URL directa: no aparece en el menú ni en buscadores.
  robots: { index: false, follow: false },
};

export default function P2PPage() {
  return <P2PApp />;
}

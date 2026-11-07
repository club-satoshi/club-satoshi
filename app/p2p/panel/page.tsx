import type { Metadata } from "next";
import P2PApp from "@/components/p2p/P2PApp";

export const metadata: Metadata = {
  title: "Panel de vendedor | Club Satoshi",
  description: "Pedidos, historial y datos de cobro para vendedores del P2P.",
  robots: { index: false, follow: false },
};

export default function SellerPanelPage() {
  return <P2PApp initialScreen="seller" />;
}

import type { Metadata } from "next";
import P2PApp from "@/components/p2p/P2PApp";

export const metadata: Metadata = {
  title: "P2P | Club Satoshi",
  description:
    "Comprá entre 1 y 10 dólares en satoshis a vendedores del Club Satoshi, con Pesos o USDT.",
};

const FONTS =
  "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;600&display=swap";

export default function P2PPage() {
  return (
    <>
      {/* Same typography as the standalone P2P app. */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link rel="stylesheet" href={FONTS} precedence="p2p-fonts" />
      <P2PApp />
    </>
  );
}

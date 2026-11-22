import type { Metadata } from "next";
import HistorialDonaciones from "@/components/HistorialDonaciones";

export const metadata: Metadata = {
  title: "Aportes de la comunidad | Club Satoshi",
  description:
    "Historial de donaciones en sats para Club Satoshi. Si dejás un mensaje al donar, puede aparecer acá.",
};

export default function DonacionesPage() {
  return (
    <main className="flex-1 flex flex-col">
      <HistorialDonaciones />
    </main>
  );
}

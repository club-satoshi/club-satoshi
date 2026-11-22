import Hero from "@/components/Hero";
import About from "@/components/About";
import Resources from "@/components/Resources";
import BitcoinMap from "@/components/BitcoinMap";
import HistorialDonaciones from "@/components/HistorialDonaciones";
import Contact from "@/components/Contact";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col">
      <Hero />
      <About />
      <Resources />
      {/* TODO: Should add Communities here */}
      <BitcoinMap />
      <HistorialDonaciones />
      <Contact />
    </main>
  );
}

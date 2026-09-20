import Link from "next/link";
import { Diamond, MessageCircle } from "lucide-react";

const METODOLOGIA = [
  "Enseñamos Bitcoin de persona a persona. Solo es cuestión de coordinar día, horario y lugar para reunirnos.",
  "En lo posible tratamos de mantener reuniones semanales para que todos puedan sacarse sus dudas y podamos tener un espacio de conversación frecuente. Te podes sumar a cualquier fecha.",
  'Durante el año organizamos un par de fechas para dar nuestra charla "Bitcoin Desde Cero", para todo público, donde explicamos las bases de Bitcoin para principiantes.',
  "Los encuentros los coordinamos por nuestro grupo de WhatsApp, son libres y gratuitos.",
  "Si no sabes nada de Bitcoin, Club Satoshi es el espacio ideal para comenzar!",
];

const NORMAS = [
  {
    titulo: "Somos 100% Bitcoin",
    descripcion:
      "Compartí únicamente contenido relacionado con Bitcoin. Evitá mensajes irrelevantes, spam o publicidad no autorizada.",
  },
  {
    titulo: "Ayuda",
    descripcion:
      "Usá el grupo para dejar todas tus consultas y dudas. La idea es ayudarte a aprender sobre Bitcoin de la mejor manera.",
  },
  {
    titulo: "Comportamiento general",
    descripcion:
      "Esperamos una participación activa y respetuosa. Mantené un lenguaje adecuado y amigable. Se prohíben groserías, contenido explícito, ofensas personales, incitación a la violencia y discursos de odio o discriminación. No se permiten debates sobre política o religión. No compartas información personal de otros miembros sin su consentimiento.",
  },
  {
    titulo: "No spam",
    descripcion:
      "Prohibido compartir plataformas de trading y todo lo vinculado a ese tema. No se permite promocionar servicios crypto, altcoins, tokens, NFTs, o cualquier otra inversión. Somos 100% Bitcoiners.",
  },
  {
    titulo: "Por último",
    descripcion:
      "Nadie del Club Satoshi o en nombre del Club se va a comunicar por privado para ofrecerte algo, todo se resuelve en el chat general de la comunidad. Al ingresar al grupo, comprendés y aceptás estas normas. En caso de no cumplirlas, serás advertido y/o baneado.",
  },
];

export default function UnirsePage() {
  return (
    <main className="flex-1">
      {/* SECCIÓN 1 — Hero */}
      <section className="bg-secondary dark:bg-gray-950 text-white py-20 px-4 md:px-6">
        <div className="container mx-auto max-w-3xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Antes de sumarte, conocé cómo trabajamos
          </h1>
          <p className="text-lg md:text-xl text-white/80 leading-relaxed">
            Club Satoshi es una comunidad abierta. Te pedimos que leas nuestra
            metodología y normas antes de unirte.
          </p>
        </div>
      </section>

      {/* SECCIÓN 2 — Metodología */}
      <section className="py-16 px-4 md:px-6 bg-white dark:bg-gray-900">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold text-secondary dark:text-white mb-10">
            Nuestra metodología
          </h2>
          <ul className="flex flex-col gap-6">
            {METODOLOGIA.map((item, i) => (
              <li key={i} className="flex items-start gap-4">
                <Diamond className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {item}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* SECCIÓN 3 — Normas de convivencia */}
      <section className="py-16 px-4 md:px-6 bg-gray-50 dark:bg-black">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold text-secondary dark:text-white mb-4">
            Normas de convivencia
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-10 leading-relaxed">
            Para mantener una comunidad sana y de calidad, te pedimos que
            respetes estas normas al ingresar al grupo.
          </p>
          <ol className="flex flex-col gap-8">
            {NORMAS.map((norma, i) => (
              <li key={i} className="flex gap-5">
                <span className="shrink-0 w-8 h-8 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-bold text-secondary dark:text-white uppercase tracking-wide text-sm mb-1">
                    {norma.titulo}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                    {norma.descripcion}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* SECCIÓN 4 — CTA final */}
      <section className="py-20 px-4 md:px-6 bg-primary text-white text-center">
        <div className="container mx-auto max-w-2xl">
          <p className="text-xl md:text-2xl font-bold mb-2">
            ¿Estás de acuerdo con estas normas?
          </p>
          <p className="text-white/80 text-lg mb-10">
            Agradecemos mucho el aporte de cada uno para mantener el espacio alineado con nuestra misión.
          </p>
          <a
            href="https://chat.whatsapp.com/JbqF5ZxvJuX6XaCHkXlZIs?mode=gi_t"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-10 py-5 bg-white text-primary font-bold rounded-full text-lg hover:bg-white/90 transition-all hover:scale-105 shadow-2xl"
          >
            <MessageCircle className="w-6 h-6" />
            Unirme al grupo de WhatsApp
          </a>
          <p className="mt-8 text-white/60 text-sm">
            <Link href="/" className="hover:text-white transition-colors">
              ← Volver al inicio
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

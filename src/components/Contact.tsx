import Link from "next/link";
import { Mail, ExternalLink } from "lucide-react";

export default function Contact() {
  return (
    <section id="contact" className="py-20 bg-primary text-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">

          {/* Columna izquierda — Unirse */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ¿Querés ser parte?
            </h2>
            <p className="text-lg text-white/90 mb-8 leading-relaxed">
              Somos una comunidad abierta, voluntaria y apasionada por Bitcoin.
              Conocé cómo funciona el club y unite al grupo.
            </p>
            <div className="flex flex-col items-start gap-4">
              <Link
                href="/unirse"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary font-bold rounded-full hover:bg-white/90 transition-all hover:scale-105 shadow-lg text-base"
              >
                Quiero unirme
              </Link>
              <div>
                <a
                  href="https://getalby.com/p/clubsatoshi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 border-2 border-white text-white font-bold rounded-full hover:bg-white/10 transition-all hover:scale-105 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
                >
                  Apoyar la comunidad
                  <ExternalLink className="w-4 h-4" />
                </a>
                <p className="mt-3 text-sm md:text-base text-white/90 leading-relaxed max-w-md">
                  Tu aporte ayuda a costear los eventos de la comunidad: materiales, insumos y lo que haga falta.
                </p>
              </div>
            </div>
          </div>

          {/* Columna derecha — Consultas */}
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
            <h3 className="text-2xl font-bold mb-6">¿Tenés alguna consulta?</h3>

            <a
              href="https://forms.gle/HVYxetvqdH3iBtrQA"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 w-full justify-center px-6 py-4 bg-white text-primary font-bold rounded-xl hover:bg-white/90 transition-all mb-6 text-base"
            >
              Completar formulario
              <ExternalLink className="w-4 h-4" />
            </a>

            <div className="flex items-center gap-3 text-white/80">
              <Mail className="w-5 h-5 shrink-0" />
              <a
                href="mailto:clubsatoshiok@gmail.com"
                className="hover:text-white transition-colors underline underline-offset-2"
              >
                clubsatoshiok@gmail.com
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

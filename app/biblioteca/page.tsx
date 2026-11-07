import Link from "next/link";
import { BookOpen, Coins, Library, Undo2 } from "lucide-react";

export default function BibliotecaPage() {
    return (
        <main className="flex-1">
            <section className="py-12 md:py-20 bg-white dark:bg-black">
                <div className="container mx-auto px-4 md:px-6">

                    <div className="text-center mb-16 animate-fade-in">
                        <span className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                            </span>
                            Próximamente
                        </span>
                        <h1 className="text-3xl md:text-5xl font-bold mb-4 text-secondary dark:text-white flex items-center justify-center gap-3">
                            <Library className="w-8 h-8 md:w-10 md:h-10 text-primary shrink-0" />
                            Biblioteca
                        </h1>
                        <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                            Una biblioteca comunitaria para compartir conocimiento y facilitar el acceso a libros dentro de la comunidad, utilizando un sistema de préstamo con garantía en Bitcoin, sats o pesos argentinos.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 mb-12">
                        <StepCard
                            step="01"
                            icon={<BookOpen className="w-8 h-8 text-primary" />}
                            title="Elegí un libro"
                            description="Explorá los libros que los miembros de la comunidad ponen a disposición y pedí el que quieras leer."
                            delay="0.1s"
                        />
                        <StepCard
                            step="02"
                            icon={<Coins className="w-8 h-8 text-primary" />}
                            title="Dejá una garantía"
                            description="Abonás una garantía en BTC, sats o pesos argentinos que queda reservada mientras el libro está en tus manos."
                            delay="0.2s"
                        />
                        <StepCard
                            step="03"
                            icon={<Undo2 className="w-8 h-8 text-primary" />}
                            title="Devolvé y recuperá"
                            description="Al devolver el libro recuperás tu garantía, descontando la parte del dueño del libro y de Club Satoshi."
                            delay="0.3s"
                        />
                    </div>

                    <div className="max-w-3xl mx-auto bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm animate-slide-up" style={{ animationDelay: "0.4s" }}>
                        <blockquote className="border-l-4 border-primary pl-4 text-lg text-gray-600 dark:text-gray-300 leading-relaxed italic">
                            Elegí un libro, dejá una garantía y disfrutá de su lectura. Cuando lo devuelvas, recuperás tu garantía, descontando la parte correspondiente al dueño del libro y a Club Satoshi.
                        </blockquote>

                        <div className="mt-6 flex flex-wrap items-center gap-3">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Garantía en:</span>
                            <CurrencyChip label="Bitcoin (BTC)" />
                            <CurrencyChip label="Satoshis (sats)" />
                            <CurrencyChip label="Pesos (ARS)" />
                        </div>
                    </div>

                    <div className="mt-12 text-center animate-slide-up" style={{ animationDelay: "0.5s" }}>
                        <p className="text-gray-500 mb-6">Todavía estamos definiendo los detalles del proyecto. ¿Querés aportar libros o ideas?</p>
                        <Link href="/#contact" className="inline-flex items-center gap-2 px-6 py-2 border border-gray-300 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <BookOpen className="w-4 h-4" />
                            Escribinos
                        </Link>
                    </div>

                    <div className="mt-12 text-center">
                        <Link href="/" className="text-sm text-gray-500 hover:text-primary transition-colors">
                            ← Volver al inicio
                        </Link>
                    </div>

                </div>
            </section>
        </main>
    );
}

function StepCard({ step, icon, title, description, delay }: { step: string, icon: React.ReactNode, title: string, description: string, delay?: string }) {
    return (
        <div className="relative p-8 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-all hover:-translate-y-1 animate-slide-up" style={{ animationDelay: delay }}>
            <span className="absolute top-6 right-6 text-4xl font-bold text-gray-100 dark:text-gray-800 select-none">{step}</span>
            <div className="mb-4">{icon}</div>
            <h2 className="text-xl font-bold mb-3 text-secondary dark:text-white">{title}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{description}</p>
        </div>
    );
}

function CurrencyChip({ label }: { label: string }) {
    return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-white dark:bg-black text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
            {label}
        </span>
    );
}

import type { ReactNode } from "react";
import Link from "next/link";
import { BookOpen, Video, FileText, ShieldCheck } from "lucide-react";

export default function Resources() {
    return (
        <section id="resources" className="py-20 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
            <div className="container mx-auto px-4 md:px-6">

                <div className="text-center mb-16 animate-fade-in">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4 text-secondary dark:text-white">Recursos</h2>
                    <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                        Recursos seleccionados para entender Bitcoin.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 mb-12">
                    {/* Card 1 - Article */}
                    <ResourceCard
                        category="Artículos"
                        icon={<FileText className="w-5 h-5 text-blue-500" />}
                        title="¿Qué es Bitcoin?"
                        description="La guía definitiva para entender Bitcoin desde cero: escasez, descentralización y libertad."
                        color="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        delay="0.1s"
                        href="/resources/que-es-bitcoin"
                    />

                    {/* Card 2 - Guide */}
                    <ResourceCard
                        category="Guías Prácticas"
                        icon={<BookOpen className="w-5 h-5 text-green-500" />}
                        title="Tu primera compra"
                        description="Paso a paso seguiros: aprende a comprar tus primeros satoshis sin miedo."
                        color="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                        delay="0.2s"
                        href="/resources/mi-primer-compra-satoshis"
                    />

                    {/* Card 3 - Video */}
                    <ResourceCard
                        category="Guías Prácticas"
                        icon={<ShieldCheck className="w-5 h-5 text-orange-500" />}
                        title="Billeteras"
                        description="Guía para elegir y usar tu primera billetera Bitcoin."
                        color="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                        delay="0.3s"
                        href="/resources/mi-primer-billetera-bitcoin"
                    />
                </div>

                <div className="text-center animate-slide-up" style={{ animationDelay: "0.4s" }}>
                    <Link href="/resources" className="inline-flex items-center gap-2 px-8 py-3 bg-secondary hover:bg-black text-white font-bold rounded-full transition-all hover:scale-105 shadow-lg">
                        Explorar Recursos
                        <span className="text-xl">&rarr;</span>
                    </Link>
                </div>


            </div>
        </section>
    );
}

interface ResourceCardProps {
    category: string;
    icon: ReactNode;
    title: string;
    description: string;
    color: string;
    delay: string;
    href: string;
}

function ResourceCard({ category, icon, title, description, color, delay, href }: ResourceCardProps) {
    return (
        <Link href={href} className="group block bg-white dark:bg-black p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all hover:-translate-y-1 animate-slide-up cursor-pointer" style={{ animationDelay: delay }}>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4 ${color}`}>
                {icon}
                {category}
            </div>
            <h3 className="text-xl font-bold mb-3 text-secondary dark:text-white">{title}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{description}</p>
            <span className="text-sm font-bold text-secondary dark:text-white group-hover:text-primary transition-colors">
                Leer más →
            </span>
        </Link>
    );
}

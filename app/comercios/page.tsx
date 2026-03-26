"use client";

import { useState } from "react";
import Link from "next/link";

const MAP_LAT = -27.02610;
const MAP_LONG = -65.34119;
const MAP_ZOOM = 9;

export default function ComerciosPage() {
    const [loading, setLoading] = useState(true);
    const mapUrl = `https://btcmap.org/map#${MAP_ZOOM}/${MAP_LAT}/${MAP_LONG}`;

    return (
        <main className="flex-1">
            <section className="py-12 md:py-20 bg-white dark:bg-black">
                <div className="container mx-auto px-4 md:px-6 max-w-6xl space-y-10">

                    <div className="animate-fade-in">
                        <h1 className="text-3xl md:text-5xl font-bold mb-4 text-secondary dark:text-white">
                            Comercios Bitcoin en Tucumán
                        </h1>
                        <p className="text-lg text-gray-500 dark:text-gray-400">
                            Descubrí dónde podés gastar tus sats en la provincia. El mapa se actualiza automáticamente con nuevos comercios.
                        </p>
                    </div>

                    <div className="relative w-full h-[600px] rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                        {loading && (
                            <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center z-10">
                                <div className="text-center">
                                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
                                    <p className="mt-4 text-gray-500 dark:text-gray-400">Cargando mapa...</p>
                                </div>
                            </div>
                        )}
                        <iframe
                            src={mapUrl}
                            className="w-full h-full border-0"
                            title="BTC Map Tucumán - Comercios Bitcoin"
                            loading="lazy"
                            allow="geolocation"
                            onLoad={() => setLoading(false)}
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 animate-fade-in" style={{ animationDelay: "0.4s" }}>
                        <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                            <h2 className="text-2xl font-bold mb-4 text-secondary dark:text-white">¿Tenés un comercio?</h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                Completá el formulario para agregar tu comercio al mapa.
                            </p>
                            <a
                                href="https://docs.google.com/forms/d/e/1FAIpQLSfJVej8JOKnAiI76VRUuenllznWqv1AjqT-t9aGFh8foAXCEw/viewform?usp=dialog"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block px-6 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-full transition-colors shadow-lg shadow-orange-500/20"
                            >
                                Agregar mi comercio
                            </a>
                        </div>

                        <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                            <h2 className="text-2xl font-bold mb-4 text-secondary dark:text-white">¿Cómo funciona?</h2>
                            <ul className="text-gray-500 dark:text-gray-400 space-y-3">
                                <li className="flex items-start gap-2"><span className="text-primary font-bold">✓</span> 100% código abierto y descentralizado</li>
                                <li className="flex items-start gap-2"><span className="text-primary font-bold">✓</span> Sin registro ni custodia de datos</li>
                                <li className="flex items-start gap-2"><span className="text-primary font-bold">✓</span> Actualización automática en tiempo real</li>
                                <li className="flex items-start gap-2"><span className="text-primary font-bold">✓</span> Verificado por la comunidad global</li>
                            </ul>
                        </div>
                    </div>

                    <div className="p-6 bg-accent/10 border border-accent/30 rounded-2xl animate-fade-in" style={{ animationDelay: "0.6s" }}>
                        <h3 className="text-lg font-bold mb-2 text-secondary dark:text-white">Tip</h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            Podés hacer zoom, moverte por el mapa y hacer clic en los markers para ver detalles de cada comercio.
                            Los datos vienen directamente de{" "}
                            <a
                                href="https://btcmap.org"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline font-medium"
                            >
                                btcmap.org
                            </a>.
                        </p>
                    </div>

                    <div className="text-center">
                        <Link href="/" className="text-sm text-gray-500 hover:text-primary transition-colors">
                            ← Volver al inicio
                        </Link>
                    </div>

                </div>
            </section>
        </main>
    );
}

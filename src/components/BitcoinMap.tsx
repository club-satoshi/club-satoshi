"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";

interface BitcoinMapProps {
    lat?: number;
    long?: number;
    zoom?: number;
}

export default function BitcoinMap({
    lat = -27.02610,
    long = -65.34119,
    zoom = 9,
}: BitcoinMapProps) {
    const [loading, setLoading] = useState(true);
    const mapUrl = `https://btcmap.org/map#${zoom}/${lat}/${long}`;

    return (
        <section id="map" className="py-20 bg-white dark:bg-black">
            <div className="container mx-auto px-4 md:px-6">

                <div className="text-center mb-12 animate-fade-in">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4 text-secondary dark:text-white">Mapa de Comercios</h2>
                    <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                        Descubrí dónde podés gastar tus sats en Tucumán y alrededores.
                    </p>
                </div>

                <div className="relative w-full h-[500px] rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-700 animate-fade-in" style={{ animationDelay: "0.2s" }}>
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

                <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: "0.4s" }}>
                    <Link
                        href="/comercios"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-full hover:bg-primary-hover transition-colors shadow-lg shadow-orange-500/20"
                    >
                        <MapPin className="w-4 h-4" />
                        Ver página completa de comercios
                    </Link>
                </div>

            </div>
        </section>
    );
}

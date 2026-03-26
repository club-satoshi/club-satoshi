"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, X, XIcon } from "lucide-react";
import { useState } from "react";
import { getAssetPath } from "@/utils/assets";

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 dark:bg-black/80 dark:border-gray-800 transition-colors">
            <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                {/* Logo */}
                <Link href="/" className="flex items-center gap-4 group">
                    <div className="relative h-10 w-10 shrink-0 rounded-full overflow-hidden">
                        <Image
                            src={getAssetPath("/images/logo.svg")}
                            alt="Club Satoshi Icon"
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>

                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-300">
                    <Link href="/" className="hover:text-primary transition-colors">Inicio</Link>
                    <Link href="/#about" className="hover:text-primary transition-colors">Quienes somos</Link>
                    <Link href="/#resources" className="hover:text-primary transition-colors text-secondary dark:text-white">Recursos</Link>
                    <Link href="/comercios" className="hover:text-primary transition-colors">Comercios</Link>
                    <Link href="/#contact" className="hover:text-primary transition-colors">Contacto</Link>
                </nav>

                {/* Actions */}
                <div className="hidden md:flex items-center gap-3">
                    <Link href="https://x.com/ClubSatoshi_" className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:bg-primary hover:text-white transition-colors text-gray-600 dark:text-gray-300">
                        <XIcon className="w-4 h-4" />
                    </Link>
                    <Link href="https://www.instagram.com/club.satoshi/" className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:bg-primary hover:text-white transition-colors text-gray-600 dark:text-gray-300">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                    </Link>
                    <Link href="/unirse" className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-full hover:bg-primary-hover transition-colors shadow-lg shadow-orange-500/20">
                        Unirse al Club
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 text-gray-600 dark:text-gray-300"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Navigation */}
            {isMenuOpen && (
                <div className="md:hidden absolute top-16 left-0 w-full bg-white dark:bg-black border-b border-gray-100 dark:border-gray-800 p-4 shadow-xl animate-in slide-in-from-top-2">
                    <nav className="flex flex-col gap-4 text-center">
                        <Link href="/" className="py-2 hover:text-primary" onClick={() => setIsMenuOpen(false)}>Inicio</Link>
                        <Link href="#about" className="py-2 hover:text-primary" onClick={() => setIsMenuOpen(false)}>Acerca de</Link>
                        <Link href="#resources" className="py-2 hover:text-primary" onClick={() => setIsMenuOpen(false)}>Recursos</Link>
                        <Link href="/comercios" className="py-2 hover:text-primary" onClick={() => setIsMenuOpen(false)}>Comercios</Link>
                        <Link href="#communities" className="py-2 hover:text-primary" onClick={() => setIsMenuOpen(false)}>Comunidades</Link>
                        <Link href="#contact" className="py-2 hover:text-primary" onClick={() => setIsMenuOpen(false)}>Contacto</Link>
                        <Link href="/unirse" className="py-2 bg-primary text-white rounded-full font-bold" onClick={() => setIsMenuOpen(false)}>
                            Unirse al Club
                        </Link>
                    </nav>
                </div>
            )}
        </header>
    );
}

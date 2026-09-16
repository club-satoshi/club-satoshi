import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Biblioteca comunitaria | Club Satoshi",
    description: "Una biblioteca comunitaria para compartir libros dentro de la comunidad, con un sistema de préstamo con garantía en Bitcoin, sats o pesos argentinos.",
};

export default function BibliotecaLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

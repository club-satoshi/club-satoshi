import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Comercios que aceptan Bitcoin en Tucumán | Club Satoshi",
    description: "Encontrá comercios que aceptan Bitcoin y Lightning en Tucumán y el Norte Argentino.",
};

export default function ComerciosLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

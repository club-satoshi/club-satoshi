import type { ReactNode } from "react";

const FONTS =
  "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;600&display=swap";

/** Typography shared by the P2P app and the seller panel. */
export default function P2PLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link rel="stylesheet" href={FONTS} precedence="p2p-fonts" />
      {children}
    </>
  );
}

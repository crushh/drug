import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "RDC API",
  description: "Next.js mock implementation for the Radioligand Drug Conjugates API",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body>
        <header className="site-header">
          <div className="site-header__inner">
            <Link href="/" className="brand">
              <img src="/logo.svg" alt="RDC" width={28} height={28} />
              <span className="brand__title">RDC Portal</span>
            </Link>
            <nav className="site-nav">
              <Link href="/">Home</Link>
              <div className="dropdown">
                <button className="dropdown-toggle" aria-haspopup="menu" aria-expanded="false">
                  Search
                </button>
                <div className="dropdown-menu" role="menu">
                  <Link href="/rdc/search" role="menuitem">Search for RDC</Link>
                  <Link href="/rdc/search?category=compound" role="menuitem">Search for Compound</Link>
                  <Link href="/rdc/search?category=ligand" role="menuitem">Search for Ligand</Link>
                  <Link href="/rdc/search?category=linker" role="menuitem">Search for Linker</Link>
                  <Link href="/rdc/search?category=chelator" role="menuitem">Search for Chelator</Link>
                  <Link href="/rdc/search?category=radionuclide" role="menuitem">Search for Radionuclide</Link>
                </div>
              </div>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}

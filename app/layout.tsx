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
                  <Link href="/?tab=rdc" role="menuitem">Search for RDC</Link>
                  <Link href="/?tab=cold_compound" role="menuitem">Search for Compound</Link>
                  <Link href="/?tab=ligand" role="menuitem">Search for Ligand</Link>
                  <Link href="/?tab=linker" role="menuitem">Search for Linker</Link>
                  <Link href="/?tab=chelator" role="menuitem">Search for Chelator</Link>
                  <Link href="/?tab=radionuclide" role="menuitem">Search for Radionuclide</Link>
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

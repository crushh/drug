import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}
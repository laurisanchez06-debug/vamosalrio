import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "vamosalrio · Encontrá tu próxima tripulación",
  description:
    "Salidas al río con gente que ya sabés quién es. Sin grupo de WhatsApp.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "vamosalrio",
  },
  // Íconos servidos por convención de archivos en /app: favicon.ico, icon.png
  // y apple-icon.png (el pin del logo).
};

export const viewport: Viewport = {
  themeColor: "#0EA5E9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR" className={inter.variable}>
      <body className="min-h-screen bg-crema text-tinta antialiased">
        {children}
      </body>
    </html>
  );
}

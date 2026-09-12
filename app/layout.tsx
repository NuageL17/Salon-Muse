import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Salon Muse — Prenez rendez-vous en ligne",
  description:
    "Salon d'esthétique : soins visage, épilation, ongles, massage. Réservez en ligne 24h/24.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Salon Muse",
  },
  icons: {
    icon: "/Muse192.png",
    apple: "/Muse192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#c9a87c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
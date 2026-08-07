import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "Sistema de Tickets",
    template: "%s | Sistema de Tickets",
  },
  description:
    "Plataforma interna de gestión y seguimiento de tickets de soporte.",
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: "/favicon_io/favicon.ico" },
      { url: "/favicon_io/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon_io/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/favicon_io/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { url: "/favicon_io/android-chrome-192x192.png", sizes: "192x192", type: "image/png", rel: "icon" },
      { url: "/favicon_io/android-chrome-512x512.png", sizes: "512x512", type: "image/png", rel: "icon" },
    ],
  },
  manifest: "/favicon_io/site.webmanifest",
};


export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}

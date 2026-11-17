import type { Metadata, Viewport } from "next";
import { Caveat, Fraunces, Inter_Tight } from "next/font/google";
import "./globals.css";

const sans = Inter_Tight({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});

const display = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  display: "swap",
});

const hand = Caveat({
  subsets: ["latin", "latin-ext"],
  variable: "--font-hand",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Notara — AI, które uczy się razem z tobą",
    template: "%s · Notara",
  },
  description:
    "Tablica AI, która tłumaczy na głos i rysuje, czat z korepetytorem, plany nauki, quizy i fiszki. Wszystko w jednym miejscu.",
};

export const viewport: Viewport = {
  themeColor: "#f6f1e7",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={`${sans.variable} ${display.variable} ${hand.variable}`}>
      <body>{children}</body>
    </html>
  );
}

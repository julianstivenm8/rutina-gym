import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const display = localFont({
  src: "./fonts/barlow-condensed-latin.woff2",
  variable: "--font-display",
  display: "swap",
  weight: "600",
});
const body = localFont({
  src: "./fonts/dm-sans-latin.woff2",
  variable: "--font-body",
  display: "swap",
  weight: "100 1000",
});

export const metadata: Metadata = {
  title: "Mi rutina · Fuerza + cardio",
  description: "Tu semana de fuerza, cardio y descanso. Consulta tu entrenamiento de cada día.",
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f6f5ef" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={display.variable + " " + body.variable + " scroll-smooth scroll-pt-[22px] mobile:scroll-pt-4 motion-reduce:scroll-auto"}>
      <body className="bg-paper font-sans text-[14px] text-ink antialiased">{children}</body>
    </html>
  );
}

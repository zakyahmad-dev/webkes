import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "HealthHub — Rumah Sakit Modern & AI Health Assistant",
  description: "Rumah sakit digital yang hangat: triage AI, dokter spesialis, antrean real-time, EMR, dan pembayaran dalam satu tempat.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Tipografi editorial: Fraunces (display) + Plus Jakarta Sans (body) */}
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&family=JetBrains+Mono:wght@400..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-cream text-ink min-h-screen flex flex-col paper-grain">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

import React from "react";
import LogoutButton from "./LogoutButton";

export const metadata = {
  title: "Evaluación Docente - Nivelación",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ fontFamily: "system-ui", margin: 0 }}>
        <div style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>
          {/* Barra superior global */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <LogoutButton />
          </div>

          {children}
        </div>
      </body>
    </html>
  );
}
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Historia Clínica Odontológica",
  description: "Gestión de pacientes e historias clínicas del consultorio",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

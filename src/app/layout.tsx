import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hipoteca Findr - Tu Asistente Hipotecario",
  description: "Resuelve tus dudas sobre hipotecas con un asistente IA sin sesgos comerciales. Compara opciones, calcula cuotas y entiende las condiciones.",
  keywords: ["hipoteca", "asistente", "comparador", "euribor", "banco", "tipo fijo", "tipo variable"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "League Tracker",
  description: "Seguimiento de cuentas y datos de League of Legends",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <meta name="google-adsense-account" content="ca-pub-7823702362685618" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}

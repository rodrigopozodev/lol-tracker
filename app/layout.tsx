import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";

export const metadata: Metadata = {
  title: "League Tracker",
  description: "Estadísticas e historial de League of Legends (API Riot).",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ea580c",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="bg-[#0a0a0a] text-[#f5f5f4]">
      <head>
        <meta name="google-adsense-account" content="ca-pub-7823702362685618" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7823702362685618"
          crossOrigin="anonymous"
        />
      </head>
      <body className="flex min-h-screen flex-col bg-[#0a0a0a] pb-[env(safe-area-inset-bottom)] antialiased text-[#f5f5f4]">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}

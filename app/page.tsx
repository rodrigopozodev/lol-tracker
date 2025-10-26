import Script from "next/script";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0416] text-white">
      <Script
        id="adsense-init"
        strategy="beforeInteractive"
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7823702362685618"
        crossOrigin="anonymous"
      />

      <section className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold">League Tracker — Estadísticas y progreso</h1>
        <p className="mt-4 text-[#B8A9C9]">
          Bienvenido a League Tracker, una plataforma que ayuda a jugadores de League of Legends a seguir su rango, LP y desempeño
          con resúmenes diarios, comparativas y análisis. Aquí encontrarás información útil, explicaciones del producto y consejos
          para mejorar tu juego. Este contenido es de lectura pública y puede ser rastreado por los sistemas de revisión.
        </p>
        <p className="mt-3 text-[#B8A9C9]">
          Características clave: búsqueda de jugadores, seguimiento del progreso, análisis de partidas, gráficos de evolución y sugerencias
          de mejora. Nuestro objetivo es ofrecer valor editorial claro, guías y contexto útil para todos los usuarios.
        </p>
        <p className="mt-3 text-[#B8A9C9]">
          Nota: las funciones avanzadas (registro, panel y comparativas) requieren iniciar sesión. Esta página es pública y contiene
          información útil que explica el servicio, cumpliendo las políticas de calidad del Programa AdSense.
        </p>
      </section>
    </main>
  );
}

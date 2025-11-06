import Script from "next/script";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#0a0416] text-white">
      <section className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold">League Tracker — Acerca de</h1>
        <p className="mt-4 text-[#B8A9C9]">
          League Tracker es una plataforma que ayuda a jugadores de League of Legends a entender y mejorar su rendimiento.
          Centraliza tu rango y LP, historial de partidas, tendencias y comparativas, ofreciendo análisis claros y recomendaciones
          prácticas para Solo/Duo y Flex.
        </p>
        <p className="mt-3 text-[#B8A9C9]">
          Nuestro objetivo es ofrecer contenido útil y público: guías, explicaciones del producto, ejemplos de análisis y consejos
          para la mejora continua. Esta página constituye contenido editorial de lectura pública.
        </p>
        <h2 className="mt-8 text-2xl font-semibold">Cómo funciona</h2>
        <p className="mt-3 text-[#B8A9C9]">
          Conecta tu cuenta o busca tu perfil, explora el panel con gráficos y métricas clave, identifica patrones y define objetivos
          semanales. Vuelve tras tus sesiones para medir el impacto y ajustar tu plan.
        </p>
        <h2 className="mt-8 text-2xl font-semibold">Privacidad</h2>
        <p className="mt-3 text-[#B8A9C9]">
          Usamos los datos mínimos necesarios para mostrar tus estadísticas. Puedes verificar tu correo, controlar tu sesión y
          solicitar la eliminación de tu cuenta cuando lo desees.
        </p>
      </section>

      {/* Cargar AdSense solo en esta página pública con contenido */}
      <Script
        id="adsense-about"
        strategy="afterInteractive"
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7823702362685618"
        crossOrigin="anonymous"
      />
    </main>
  );
}
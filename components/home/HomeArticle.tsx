import React from "react";

export default function HomeArticle() {
  return (
    <article className="mt-8 rounded-2xl bg-[#1a0b2e] border border-purple-500/30 p-6 shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-all">
      <header className="mb-4">
        <h2 className="text-2xl font-bold text-white">Guía de uso y buenas prácticas en LoL Tracker</h2>
        <p className="text-[#B8A9C9] mt-2">
          Esta guía explica cómo buscar invocadores, interpretar rangos y cuidar la privacidad al usar la página Home. Está pensada para usuarios nuevos y veteranos, y se basa en nuestra experiencia construyendo herramientas útiles y claras para la comunidad de League of Legends.
        </p>
      </header>

      <figure className="my-4 flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/LoL-Tracker.png"
          alt="Ilustración del panel de LoL Tracker"
          className="rounded-xl border border-purple-500/30 w-full max-w-2xl"
        />
        <figcaption className="sr-only">Imagen ilustrativa del panel principal de LoL Tracker.</figcaption>
      </figure>

      <section className="mt-6">
        <h2 className="text-xl font-semibold text-white">Cómo usar el buscador de invocadores</h2>
        <p className="text-[#B8A9C9] mt-2">
          En la parte superior de Home encontrarás el formulario de búsqueda pública. Introduce el <strong>Riot ID</strong> en formato <strong>GameName#TAG</strong> (por ejemplo, <em>Caps#EUW</em>) y pulsa “Buscar”. La página resolverá el jugador mediante las APIs de Riot, mostrando su icono, nivel y región. Cuando existan datos de clasificación, verás las pestañas de Solo/Q y Flex con su rango, puntos de liga y balance de victorias/derrotas. Si los datos no se encuentran al primer intento —por cambios de región o sesiones recientes—, utiliza el botón “Actualizar” para reconsultar los últimos valores.
        </p>
        <p className="text-[#B8A9C9] mt-2">
          El buscador está pensado para ser rápido y confiable. No requiere que te registres y no guarda información personal del jugador que consultas; únicamente se muestran resultados en tiempo real para tu referencia. Si estás logueado, Home mostrará además tu tarjeta personal con acceso directo a refrescar tu perfil.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-semibold text-white">Interpretación de rangos y estadísticas</h2>
        <p className="text-[#B8A9C9] mt-2">
          Cada rango incluye el <strong>tier</strong>, la <strong>división</strong> y los <strong>LP</strong> actuales. El componente de rangos calcula también el porcentaje de victorias considerando partidas de la cola correspondiente. Ten en cuenta que los cambios de cola, las temporadas y la actividad reciente pueden afectar a la disponibilidad y precisión de estos datos. Si el jugador no tiene clasificación activa en una cola, la verás como <em>Unranked</em>.
        </p>
        <p className="text-[#B8A9C9] mt-2">
          Usamos fuentes oficiales de Riot y, cuando es necesario, resolvemos región por PUUID para minimizar inconsistencias entre clústeres. Si notas discrepancias, pulsa “Actualizar” o intenta especificar correctamente la etiqueta de región del Riot ID. Esta práctica ayuda a que el sistema priorice el clúster más fiable para ese jugador.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-semibold text-white">Privacidad y tratamiento de datos</h2>
        <p className="text-[#B8A9C9] mt-2">
          La página Home no almacena búsquedas cuando no hay sesión iniciada. Todos los datos que ves se obtienen en tiempo real y se descartan tras la visualización. Si accedes con tu cuenta, tu perfil se gestiona a través de Supabase y puedes refrescar tu información manualmente desde Home. Cuidamos que el contenido mostrado sea útil sin exponer información sensible: nos enfocamos en datos públicos del ecosistema de Riot y en métricas que ayudan a comprender el progreso competitivo.
        </p>
        <p className="text-[#B8A9C9] mt-2">
          La transparencia es parte de nuestra propuesta. Si tienes dudas sobre privacidad, revisa nuestras políticas y ponte en contacto con nosotros. Queremos que LoL Tracker sea una herramienta clara, práctica y respetuosa con la comunidad.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-semibold text-white">Consejos para progresar en Solo/Q</h2>
        <p className="text-[#B8A9C9] mt-2">
          Analiza tu historial con calma, identifica patrones y ajusta tu pool de campeones. Prioriza un número reducido de picks que domines y mantén objetivos concretos: controlar oleadas, asegurar visión y optimizar rotaciones. La consistencia suele pesar más que los picos de rendimiento aislados. Además, evita jugar tiltado y usa herramientas como LoL Tracker para evaluar tu progreso de forma objetiva.
        </p>
        <p className="text-[#B8A9C9] mt-2">
          Cada sesión de ranked es una oportunidad de aprendizaje. Al terminar, revisa tu desempeño, toma notas y define un punto de mejora para la siguiente partida. Con disciplina y una visión clara de tus métricas, el ascenso llega como consecuencia del trabajo sostenido.
        </p>
      </section>
    </article>
  );
}
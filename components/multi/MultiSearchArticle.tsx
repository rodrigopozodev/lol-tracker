"use client";
import React from "react";
import Image from "next/image";
import multiSearchBanner from "@/public/multi-search.png";

export default function MultiSearchArticle() {
  return (
    <article className="mt-10 rounded-2xl bg-[#1a0b2e] border border-purple-500/30 p-6 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
      <header className="mb-4">
        <h2 className="text-2xl font-semibold text-white">Guía de uso de Multi‑search</h2>
      </header>

      <div className="mb-4 w-full">
        <Image
          src={multiSearchBanner}
          alt="Ilustración temática de Multi-search"
          className="w-full h-auto object-contain rounded-lg opacity-80"
          sizes="(max-width: 768px) 100vw, 1200px"
          priority={false}
        />
      </div>

      <section className="space-y-3 text-[#B8A9C9]">
        <p>
          Multi‑search te permite revisar rápidamente varios perfiles de League of Legends en una sola vista.
          Escribe cada Riot ID con el formato <span className="font-mono">Nombre#TAG</span> en los campos de arriba;
          al completar un jugador se añadirá otro campo automáticamente. El buscador muestra icono de perfil,
          nivel, maestrías principales y el rango de Solo/Duo y Flex, con énfasis en la información útil para
          una comparación ágil entre amigos, equipos o contrincantes.
        </p>

        <p>
          Para interpretar los rangos, fíjate primero en la cola más jugada. Si un perfil aparece como
          <em>Unranked</em> en una cola, no significa ausencia total de experiencia: puede concentrar su actividad
          en la otra cola o venir de temporadas anteriores. Además de la medalla y el texto del rango, verás
          los puntos de liga (LP) cuando estén disponibles; estos indican cuán cerca está de una serie de ascenso
          o descenso. En partidas recientes, usamos un listado compacto con resultado, campeón y K/D/A para
          ofrecer contexto sin abrumar la interfaz.
        </p>

        <p>
          Los datos mostrados provienen de las APIs oficiales de Riot. No almacenamos información de búsqueda
          si no tienes sesión iniciada: se consulta en el momento y se descarta al cerrar la página. Si deseas
          guardar tus estadísticas, acceder a más métricas históricas o recibir recomendaciones personalizadas,
          puedes crear una cuenta y actualizar tu perfil desde la sección Home. La privacidad es prioritaria:
          trabajamos con el mínimo de datos necesarios para servirte esta experiencia y evitamos el rastreo
          invasivo.
        </p>

        <p>
          Consejos prácticos: compara roles homogéneos (junglas con junglas, tiradores con tiradores) y observa
          tendencias antes que resultados aislados. Revisa maestrías para identificar confort picks y posibles
          focos de ban, y usa el resumen de partidas como referencia de forma reciente. Si buscas sin conocer la
          región, el formulario aplica una región por defecto; en el futuro añadiremos selección explícita para
          mejorar la precisión. Nuestra intención es que Multi‑search sea una herramienta rápida, clara y
          enfocada en decisiones reales dentro y fuera de la grieta.
        </p>
      </section>
    </article>
  );
}
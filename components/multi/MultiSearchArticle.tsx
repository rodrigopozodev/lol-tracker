"use client";
import React from "react";

export default function MultiSearchArticle() {
  return (
    <article className="mt-10 rounded-2xl border border-purple-500/30 bg-[#1a0b2e] p-6">
      <header className="mb-4">
        <h2 className="text-2xl font-semibold text-white">Guía de uso de Multi‑search</h2>
      </header>

      <section className="space-y-3 text-[#B8A9C9]">
        <p>
          Multi‑search te permite revisar varios perfiles en una sola vista. Escribe cada Riot ID como{" "}
          <span className="font-mono">Nombre#TAG</span>; al completar un jugador se puede añadir otro campo.
          Los resultados muestran rango Solo/Duo y Flex y datos básicos devueltos por la búsqueda.
        </p>

        <p>
          El historial de partidas detallado y las rachas en vivo están en{" "}
          <span className="text-purple-300">Mis cuentas</span> para no multiplicar llamadas a la API de Riot
          desde esta página.
        </p>

        <p>
          Los datos provienen de las APIs oficiales de Riot en el momento de la búsqueda. Si no hay sesión, la
          consulta es puntual.
        </p>
      </section>
    </article>
  );
}

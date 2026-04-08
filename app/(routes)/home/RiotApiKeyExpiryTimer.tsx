"use client";

import React, { useEffect, useState } from "react";

const TWENTY_FOUR_H_MS = 24 * 60 * 60 * 1000;

function formatHms(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function RiotApiKeyExpiryTimer({
  savedAtMs,
  fromEnv,
}: {
  savedAtMs: number | null;
  fromEnv: boolean;
}) {
  /** null hasta el primer tick en el cliente: evita hydration mismatch (SSR vs cliente con distinto Date.now()). */
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (fromEnv) {
    return (
      <div className="rounded-xl border border-purple-500/25 bg-[#1a0b2e]/80 px-5 py-4 text-base text-[#B8A9C9]">
        La clave activa viene de <code className="text-purple-300">RIOT_API_KEY</code> en el entorno. El
        temporizador de 24 h solo aplica cuando la clave se guarda desde el formulario (sin esa variable).
      </div>
    );
  }

  if (savedAtMs == null) {
    return (
      <div className="rounded-xl border border-purple-500/25 bg-[#1a0b2e]/80 px-5 py-4 text-base text-[#B8A9C9]">
        Guarda la clave con el botón de abajo para iniciar la cuenta atrás de 24 h.
      </div>
    );
  }

  const end = savedAtMs + TWENTY_FOUR_H_MS;

  if (now === null) {
    return (
      <div
        className="rounded-xl border border-emerald-500/35 bg-emerald-500/5 px-5 py-4 text-base text-emerald-100/95"
        role="status"
      >
        <p>
          Tiempo restante hasta la caducidad estimada (24 h desde el guardado):{" "}
          <strong className="tabular-nums text-white text-xl">--:--:--</strong>
        </p>
      </div>
    );
  }

  const left = end - now;
  const expired = left <= 0;

  return (
    <div
      className={`rounded-xl border px-5 py-4 text-base ${
        expired
          ? "border-amber-500/50 bg-amber-500/10 text-amber-100"
          : "border-emerald-500/35 bg-emerald-500/5 text-emerald-100/95"
      }`}
      role="status"
    >
      {expired ? (
        <p>
          Han pasado <strong className="text-white">24 horas</strong> desde el último guardado de la clave
          en el servidor. Genera una nueva en{" "}
          <a
            href="https://developer.riotgames.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-amber-300/80 hover:text-white"
          >
            developer.riotgames.com
          </a>{" "}
          y pégala en el formulario.
        </p>
      ) : (
        <p>
          Tiempo restante hasta la caducidad estimada (24 h desde el guardado):{" "}
          <strong className="tabular-nums text-white text-xl">{formatHms(left)}</strong>
        </p>
      )}
    </div>
  );
}
